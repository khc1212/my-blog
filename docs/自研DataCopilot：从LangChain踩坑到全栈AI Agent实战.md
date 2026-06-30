---
title: 自研 DataCopilot 实战
description: 从 LangChain 踩坑到全栈 AI Agent 实战，自研数据查询助手的完整历程
---

# 自研 DataCopilot：从 LangChain 踩坑到全栈 AI Agent 实战

## 背景

之前在公司用 LangChain 搭了一套数据查询 Agent（详见 [从零搭建数据查询 Agent](/从零搭建数据查询Agent：LangChain踩坑到自研框架)），能用，但越用越别扭——抽象层太厚、调试困难、上下文窗口一爆就全线崩溃。

离职后决定自己从零写一个，不依赖 LangChain，核心目标：

1. **Agent 主循环自己掌控**，不被框架绑架
2. **RAG 知识增强**，让 AI 理解业务术语
3. **全栈交付**，前端对话 + 图表渲染 + 知识库管理，开箱即用

项目叫 **DataCopilot**——自然语言驱动的数据库自助分析 Agent。用户用中文提问，系统自动完成"理解意图 → 生成 SQL → 查询数据库 → 推荐图表 → 前端渲染"。

[Git 仓库](https://gitee.com/khc-warehouse/data-copilot)

## 整体架构

```
用户输入 → Vue3 (对话界面) → FastAPI 后端 → Agent 主循环
                                          ↓ 工具调用
               RAG 知识检索 → 注入上下文 → Text-to-SQL → SQLite → 结果集 → 图表决策 → ECharts 配置 → 前端渲染
```

技术栈：
- **前端**：Vue3 + Vite + ECharts（纯 JS，没用 TypeScript）
- **Agent 后端**：Python FastAPI + 自实现 Agent 循环
- **模型工厂**：支持 OpenAI / DeepSeek / Mock 多厂商
- **RAG**：Milvus 向量数据库 + OpenAI Embedding
- **通信**：SSE 流式输出，前端逐 token 渲染
- **数据库**：SQLite（含模拟 MES 生产数据）

## 核心设计：自研 Agent 循环

### 为什么不用 LangChain

上一个项目用 LangChain 的教训：

1. **工具一多就炸**：LangChain 把所有工具描述塞进系统提示词，6 个工具上下文就爆了
2. **调试地狱**：出错时堆栈被层层包装，定位一个问题要翻 5 层源码
3. **不灵活**：需求稍微偏离框架设计就要 hack 很多东西

其实 Agent 循环的核心逻辑并不复杂：

```
用户提问 → LLM 判断意图 → 调用工具 → 把结果喂回 LLM → 决定下一步
```

LangChain 把它包装得太重了。自己写，核心代码就 200 行。

### Agent 主循环实现

```python
class Agent:
    def __init__(self, llm: BaseLLM, tools: list[BaseTool], max_rounds: int = 5, rag_engine=None):
        self.llm = llm
        self.tools = {t.name: t for t in tools}
        self.tool_schemas = [t.to_openai_tool() for t in tools]
        self.max_rounds = max_rounds
        self.rag_engine = rag_engine

    async def run_stream(self, user_message, history=None):
        system_content = SYSTEM_PROMPT

        # RAG 检索相关知识注入系统提示词
        if self.rag_engine:
            rag_context = await self.rag_engine.retrieve(user_message)
            if rag_context:
                system_content += f"\n\n## 参考知识\n{rag_context}"

        messages = [{"role": "system", "content": system_content}]
        if history:
            messages.extend(history)
        messages.append({"role": "user", "content": user_message})

        for round_idx in range(self.max_rounds):
            resp = await self.llm.chat(messages, self.tool_schemas)

            # 没有工具调用 → Agent 完成
            if not resp.tool_calls:
                yield {"type": "token", "content": resp.content}
                yield {"type": "done"}
                return

            # 执行工具调用
            for tc in resp.tool_calls:
                tool = self.tools.get(tc.name)
                result = await tool.execute(**tc.arguments)
                messages.append({
                    "role": "tool",
                    "tool_call_id": tc.id,
                    "content": json.dumps(result),
                })
```

几个关键设计决策：

1. **工具调用基于 OpenAI function-calling 格式**：不绑定 LangChain，直接用 OpenAI 的 tool schema，兼容所有支持 function-calling 的模型
2. **最大轮次限制**：防止 Agent 陷入死循环，超过 5 轮直接终止
3. **SSE 流式输出**：每个阶段都 yield 事件（status / tool_start / tool_end / token / chart / done），前端实时展示思考过程
4. **RAG 可插拔**：`rag_engine` 参数可选，不传就走纯 Agent 模式

### 对比 LangChain

| 维度 | LangChain | DataCopilot |
|------|-----------|-------------|
| Agent 核心代码 | 几千行（分散在多个包） | ~200 行（一个文件） |
| 工具描述加载 | 全部塞进系统提示词 | 按需加载（RAG 辅助筛选） |
| 调试 | 层层包装，堆栈难读 | 直接打印，所见即所得 |
| 上下文管理 | 框架自动管理（容易爆） | 自己控制（精确到每个 token） |
| 新增模型 | 继承 + 注册 + 配置 | 继承一个基类就行 |

## 模型工厂：一套代码支持多厂商

生产环境不可能只绑一个模型厂商。用工厂模式抽象了一层：

```python
class LLMFactory:
    _registry = {
        "openai": OpenAILLM,
        "deepseek": (OpenAILLM, {"extra_body": {"thinking": {"type": "disabled"}}}),
        "mock": "mock",
    }

    @classmethod
    def create(cls, provider: str, **kwargs) -> BaseLLM:
        entry = cls._registry[provider]
        if entry == "mock":
            return MockLLM()
        if isinstance(entry, tuple):
            model_class, default_kwargs = entry
            return model_class(**kwargs, **default_kwargs)
        return entry(**kwargs)
```

所有模型实现继承同一个基类：

```python
class BaseLLM(ABC):
    @abstractmethod
    async def chat(self, messages, tools=None) -> LLMResponse: ...

    @abstractmethod
    async def chat_stream(self, messages, tools=None) -> AsyncGenerator: ...
```

扩展新模型只需要：
1. 继承 `BaseLLM`
2. 实现 `chat()` 和 `chat_stream()`
3. 在 `_registry` 里注册一行

DeepSeek 的特殊处理——它用的是 OpenAI SDK 兼容接口，但需要 `extra_body` 关闭深度思考模式。工厂模式把这种差异封装掉了，业务代码完全不用改。

## RAG 知识增强：让 AI 懂业务

### 为什么需要 RAG

Text-to-SQL 最大的痛点不是语法，而是**业务术语**。

用户问"各产线的良率是多少"，LLM 不知道：
- "良率"在数据库里对应的是 `quality` 表的 `pass_rate` 字段
- "产线"对应的是 `production` 表的 `line` 字段
- 良率的计算公式是 `(合格数 / 总数) × 100%`

这些知识不注入，LLM 只能瞎猜。RAG 就是把这些业务知识在查询时检索出来，塞进系统提示词。

### RAG 流程

```
知识文档 (.md)
    ↓ 递归字符分片（段落→行→字符，500字/片，50字重叠）
    ↓ OpenAI Embedding 向量化
    ↓ 存入 Milvus 向量数据库

用户提问
    ↓ 向量化
    ↓ Milvus 相似度检索（top_k=3）
    ↓ 注入系统提示词
    ↓ LLM 结合知识生成 SQL
```

### RAG 引擎实现

```python
class RAGEngine:
    def __init__(self, embedding_provider, store, chunk_size=500, chunk_overlap=50):
        self.embedding = embedding_provider
        self.store = store
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    async def retrieve(self, query: str, top_k: int = 3) -> str:
        if self.store.count() == 0:
            return ""
        query_embedding = await self.embedding.embed_query(query)
        results = await self.store.query(query_embedding, top_k=top_k)
        if not results:
            return ""
        parts = []
        for i, r in enumerate(results, 1):
            source = r["metadata"].get("filename", "unknown")
            parts.append(f"[参考{i}] (来源: {source})\n{r['text']}")
        return "\n\n---\n\n".join(parts)
```

选 **Milvus Lite** 的原因：嵌入式模式，不需要启动服务，数据持久化到一个 `.db` 文件，开发和小规模部署都够用。生产环境切到 Milvus Server 只需要改一行连接配置。

### RAG 在两个地方起作用

1. **Agent 系统提示词**：检索全局业务知识，让 LLM 理解整体业务背景
2. **Text-to-SQL 工具内部**：独立检索 SQL 相关知识（表结构说明、字段映射），辅助生成更准确的 SQL

```python
class TextToSQLTool(BaseTool):
    async def execute(self, question: str, _retry_context: str = "") -> dict:
        schema = get_table_schema()
        system_content = f"You are a SQL expert. Schema:\n{schema}\n..."

        # RAG 检索领域知识辅助 SQL 生成
        if self._rag_engine:
            sql_context = await self._rag_engine.retrieve(question, top_k=2)
            if sql_context:
                system_content += f"\n\n查询参考知识:\n{sql_context}\n"

        resp = await self._llm.chat(sql_prompt)
        sql = resp.content.strip()

        # SQL 安全校验
        safety_error = _validate_sql(sql)
        if safety_error:
            return {"error": f"SQL safety check failed: {safety_error}"}

        columns, rows = execute_query(sql)
        return {"sql": sql, "columns": columns, "rows": rows[:200]}
```

## SQL 安全：不能让 LLM 乱来

LLM 生成的 SQL 不能直接执行，必须做安全校验。用正则拦截：

```python
_FORBIDDEN_KEYWORDS = re.compile(
    r"\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|REPLACE|GRANT|REVOKE|EXEC|EXECUTE)\b",
    re.IGNORECASE,
)

def _validate_sql(sql: str) -> str | None:
    stripped = sql.strip().rstrip(";")
    first_word = stripped.split()[0].upper()
    if first_word not in ("SELECT", "WITH", "EXPLAIN"):
        return f"Only SELECT queries are allowed. Got: {first_word}"
    if _FORBIDDEN_KEYWORDS.search(stripped):
        return "SQL contains forbidden keywords."
    if ";" in stripped:
        return "Multiple SQL statements are not allowed."
    return None
```

三层防护：
1. **只允许 SELECT/WITH/EXPLAIN**：拦截所有写操作
2. **正则黑名单**：拦截 INSERT/UPDATE/DELETE/DROP 等危险关键字
3. **禁止多语句**：防止 SQL 注入（`SELECT 1; DROP TABLE ...`）

另外还加了 **Agent 自动重试**：SQL 执行报错时，把错误信息喂回 LLM，让它自动分析错误并修正 SQL，最多重试 2 次。

## SSE 流式输出：实时展示思考过程

Agent 不是秒回的，中间要经历多轮思考和工具调用。如果让用户盯着空白页面等 5 秒，体验很差。

用 SSE（Server-Sent Events）把每个阶段实时推给前端：

```python
# 后端：FastAPI StreamingResponse
async def chat_stream(request: ChatRequest):
    async def event_generator():
        async for event in agent.run_stream(request.message, request.history):
            yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"
    return StreamingResponse(event_generator(), media_type="text/event-stream")
```

```javascript
// 前端：ReadableStream 逐 token 渲染
const response = await fetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ message, history }),
});
const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const text = decoder.decode(value);
    // 解析 SSE 事件，实时更新 UI
}
```

前端展示的状态：
- "正在分析问题..."
- "AI 思考中（第 N 轮）..."
- "正在生成回答..."
- 工具调用过程（哪个工具、传了什么参数、返回了什么）
- 逐 token 流式输出回答
- 图表自动渲染

## 前端：对话 + 图表 + 知识库管理

### 对话界面

Vue3 Composition API，核心是一个消息列表组件。每条消息支持：
- 纯文本（Markdown 渲染）
- 图表（ECharts 自动渲染，由 Agent 的 `recommend_chart` 工具生成）
- 工具调用过程的折叠展示

### 知识库管理

独立的路由页面 `/knowledge`，支持：
- 查看已入库文档列表
- 上传新文档（.md / .txt）
- 删除文档
- 重建向量索引
- 检索测试（输入问题看返回哪些知识片段）

这让非技术人员也能维护业务知识库，不需要改代码。

## 最终效果

| 指标 | 数据 |
|------|------|
| 典型问题响应时间 | 3-8s（含 LLM 推理 + RAG 检索） |
| SQL 生成准确率 | 85%+（有 RAG 辅助） |
| 支持的查询类型 | 聚合、筛选、排序、趋势分析 |
| 图表类型 | 柱状图、折线图、饼图、表格（自动推荐） |
| Agent 核心代码量 | ~200 行（vs LangChain 几千行） |

## 踩坑与反思

### 1. LLM 生成的 SQL 经常出错

最常见的问题：字段名写错、表名搞混、SQLite 语法不兼容。

解决方案：
- RAG 注入表结构说明和字段映射
- Agent 自动重试机制（报错 → 分析错误 → 修正 SQL → 重新执行）
- 结果集限制 200 行，防止 LLM 生成 `SELECT *` 拉全表

### 2. Embedding 成本

OpenAI 的 Embedding API 虽然便宜，但文档多了也是一笔开销。

解决方案：
- 支持本地 sentence-transformers 模型作为备选
- 文档增量更新（重新入库时先删旧版本）
- `RAG_ENABLED=false` 一键关闭

### 3. 前端 SSE 不是银弹

SSE 只支持 GET 请求（浏览器的 `EventSource` 限制），但我们的对话接口是 POST。

解决方案：用 `fetch` + `ReadableStream` 手动解析 SSE，不用 `EventSource`。

## 总结

这个项目从 LangChain 的踩坑经验出发，自己实现了 Agent 循环、RAG 知识增强、模型工厂、SQL 安全校验、SSE 流式输出，最后用 Vue3 做了完整的前端界面。

核心收获：
1. **Agent 循环本身不复杂**，LangChain 把它包装得太重了。理解了原理之后，自己写更灵活
2. **RAG 是 Text-to-SQL 的刚需**，没有业务知识注入，LLM 只能猜
3. **安全不能靠 LLM 自觉**，必须在代码层做校验
4. **全栈能力是加分项**，能从后端 Agent 到前端图表一条龙交付，比只会调 API 有竞争力

---

## 进阶优化：对话压缩与记忆系统

> 2026-06-30 更新

在基础功能完成后，参考 NAO 开源项目的架构设计，补充了三个关键模块：

### 对话压缩（ConversationCompressor）

长对话会撑爆 LLM 上下文窗口。解决方案是当 token 数超过 75% 阈值时，用 LLM 总结旧消息，保留最近一轮对话。

```python
class ConversationCompressor:
    def __init__(self, llm, keep_recent=2):
        self.llm = llm
        self.keep_recent = keep_recent  # 保留最近几轮

    async def compress(self, messages):
        # 1. 分离系统提示词、旧消息、最近消息
        # 2. 用 LLM 总结旧消息
        # 3. 返回：系统提示词 + 摘要 + 最近消息
```

效果：
- 10 轮对话 → 压缩后只剩系统提示词 + 摘要 + 最近 2 轮
- 腾出空间继续对话，不会因为上下文超限而报错

### 记忆系统（MemoryStore + MemoryExtractor）

让 AI 记住用户偏好和个人信息，下次对话自动注入系统提示词。

**存储层**：SQLite 持久化，支持两种记忆类型
| 类型 | 用途 | 示例 |
|------|------|------|
| `global_rule` | 行为偏好 | "以后用中文回答" |
| `personal_fact` | 个人信息 | "我是做Java开发的" |

**提取层**：正则匹配用户消息中的关键词
```python
# 偏好触发词
RULE_PATTERNS = [
    r"以后.{0,10}(用|以|请|要|别|不要)",
    r"记住.{0,10}(我|告诉)",
    ...
]

# 个人信息模式
PERSONAL_PATTERNS = [
    (r"我叫(.+?)[。，,；;\s]", 1),
    (r"我是做(.+?)的", 1),
    ...
]
```

使用方式：直接在对话中说"以后用中文回答"，系统会自动记住，下次对话时注入到系统提示词。

### 预算控制（TokenBudget）

监控 token 使用量，防止超出上下文窗口。简单估算中文 2 token/字，英文 0.75 token/字符，超过 75% 阈值时触发压缩。

### 本地模型离线加载

修复了 sentence-transformers 即使本地有模型也会访问 Hugging Face 的问题：
1. 在导入前设置 `HF_HUB_OFFLINE=1`
2. 优先使用 snapshot 绝对路径加载
3. 创建缺失的 `config_sentence_transformers.json`

### 新增文件

```
backend/app/agent/budget.py        # Token 预算控制
backend/app/agent/compressor.py    # 对话压缩
backend/app/memory/store.py        # 记忆存储（SQLite）
backend/app/memory/extractor.py    # 记忆自动提取
```

---

> 相关文章：[从零搭建数据查询 Agent：LangChain 踩坑到自研框架](/从零搭建数据查询Agent：LangChain踩坑到自研框架) 记录了在公司用 LangChain 的踩坑经历，这篇是"续集"。
