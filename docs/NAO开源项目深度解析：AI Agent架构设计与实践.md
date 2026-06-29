# NAO开源项目深度解析：AI Agent架构设计与实践

## 项目简介

NAO是一个开源的AI Agent框架，专注于构建智能对话系统。本文将深入分析NAO的架构设计，涵盖系统提示词、Agent循环、工具系统、对话压缩和记忆系统等核心模块。

通过阅读NAO的源码，我们可以学习到如何设计一个完整的AI Agent系统，这对于构建自己的AI应用非常有参考价值。

## 系统提示词设计

### 动态系统提示词

NAO的系统提示词不是静态的，而是根据用户状态动态生成的。系统提示词可以包含：

```javascript
type SystemPromptProps = {
  memories?: UserMemory[];    // 对话中积累的用户记忆（个人偏好、全局规则）
  userRules?: string;         // 用户自定义规则（从 RULES.md 读取）
  connections?: Connection[]; // 用户的数据库连接列表
  skills?: Skill[];           // 用户定义的 skills（可复用的 prompt 片段）
  timezone?: string;          // 用户时区，用于显示当前日期
  testMode?: boolean;         // 测试模式（隐藏 clarification 工具说明）
};
```

### 上下文长度控制

为了防止超出LLM上下文窗口，NAO对系统提示词长度进行了限制：

```javascript
/** 记忆 token 上限：system prompt 中记忆部分最多占 1000 tokens */
export const MEMORY_TOKEN_LIMIT = 1000;
```

### 三段式结构

NAO的系统提示词采用三段式结构：

1. **基础指令**：定义AI的角色身份、当前日期、项目结构说明
2. **人格设定**：告诉AI应该用什么语气和人设回答问题
3. **工具调用规则**：指导AI如何正确使用各类工具

## Agent核心架构

### 整体分层

NAO采用三层架构设计：

```
AgentService（管理器）
  └─ 管理多个 AgentManager（按 chatId 索引）
       └─ 每个 AgentManager 封装一个 ToolLoopAgent（Vercel AI SDK）
```

这种设计允许多个对话同时运行，每个对话都有独立的Agent实例。

### AgentService — 对话管理器

AgentService负责管理所有活跃对话：

- 使用 `Map<string, AgentManager>` 管理对话
- `create(chat, model?)` 方法在每次用户发消息时调用
- 负责解析模型、检查API预算、创建模型实例等

### AgentManager — 单个代理

每个AgentManager封装一个ToolLoopAgent，主要职责：

1. **构建消息**：通过7步转换管道处理消息
2. **启动循环**：调用 `_agent.stream()` 进入AI循环
3. **后台任务**：提取记忆、生成标题

### 消息转换管道

NAO的消息处理采用7步管道：

| 步骤 | 方法 | 作用 |
|------|------|------|
| 1 | `_syncStoryToolOutputs` | 同步故事最新版本，旧版标_stale |
| 2 | `_addStoryMode` | @story 时注入故事指令 |
| 3 | `_addSkills` | /技能名 注入技能内容 |
| 4 | `_addCitationContext` | 选中文本提问时注入引用上下文 |
| 5 | `_addDatabaseContext` | @表名 注入列结构 |
| 6 | `_addCache` | 添加Anthropic prompt缓存标记 |
| 7 | `_pruneMessages` | 清理推理过程和空消息 |

### 三种停止条件

| 场景 | 条件 |
|------|------|
| 正常聊天 | 检测到 `suggest_follow_ups` 或 `clarification` 工具调用 |
| 测试模式 | 只检测 `suggest_follow_ups` |
| 自动化 | 按步骤数停止（默认20步） |

## 工具系统架构

### 三层工具架构

NAO的工具系统采用三层设计：

```
第1层：Schema 定义（shared/src/tools/*.ts）
├── InputSchema    → 工具接收什么参数
├── OutputSchema   → 工具返回什么数据
├── Input          → TypeScript 类型
└── Output         → TypeScript 类型

第2层：工具实现（backend/src/agents/tools/*.ts）
├── createTool() 包装 AI SDK 的 tool()
├── execute()     → 真正的逻辑
├── toModelOutput → 控制 AI 看到的返回结果
└── 安全限制

第3层：组装（backend/src/agents/tools/index.ts）
├── tools 对象    → 静态注册所有工具
├── getTools()    → 动态过滤
│   ├── 测试模式去掉 clarification
│   ├── excludeFollowUps 去掉 suggest_follow_ups
│   ├── 沙箱没开去掉 execute_python
│   ├── + MCP 工具
│   └── + allowlist 限制（上下文审计用）
└── 传给 ToolLoopAgent
```

### 工具安全限制

NAO采用四层安全限制：

```javascript
createTool({
  inputSchema,        // ① Zod 运行时校验
  outputSchema,       // ② 输出格式校验
  execute: (input, context) => {
    // ③ 业务安全
    isReadOnlySqlQuery(input.sql_query)  // 只允许 SELECT
    toRealPath(file_path, projectFolder) // 防路径逃逸
    // ④ 输出裁剪
    toModelOutput: ({ output }) => renderToModelOutput(...)
  }
});
```

### Zod Schema的作用

Zod在NAO中扮演重要角色：

1. **运行时类型校验**：确保AI返回的数据格式正确
2. **JSON Schema生成**：自动告诉LLM工具有什么参数
3. **前后端共享类型**：确保类型一致性

## 对话压缩

### 为什么需要压缩

LLM上下文窗口有限（Claude 200K，GPT 400K），长对话会撑爆上下文。压缩就是在快到上限时，把旧消息概括成摘要，腾出空间。

### 触发条件

```javascript
private async _shouldCompact({ messages, tools, contextWindow }) {
  const total = messageTokens + toolTokens + maxOutputTokens;
  const threshold = contextWindow * 0.75;
  return total > threshold;
}
```

### 压缩策略

NAO采用"保留最近一轮，总结前面的"策略：

```
压缩前：
┌──────────────────────────────────────────┐
│ system prompt                            │
│ 用户第1轮 → AI回复 → 工具调用 → SQL结果   │
│ 用户第2轮 → AI回复 → 工具调用 → 图表      │  ← 这些被总结
│ 用户第3轮 → AI回复 → 工具调用             │
│──────────────────────────────────────────│
│ 用户第4轮 → AI回复（最新的）               │  ← 保留原样
└──────────────────────────────────────────┘

压缩后：
┌──────────────────────────────────────────┐
│ system prompt                            │
│ <conversation-summary>                   │  ← 一段文字代替了前面三轮
│   用户问了销售趋势，AI 查了 orders 表     │
│   发现 Q2 增长 15%，生成了折线图          │
│ </conversation-summary>                  │
│ 用户第4轮 → AI回复（最新的）               │  ← 保留
└──────────────────────────────────────────┘
```

### 预算控制

NAO通过预算控制确保不超出上下文：

```javascript
selectMessagesInBudget() {
  for (let i = messages.length - 1; i >= 0; i--) {
    // 从最新的消息开始往前选
    // 工具调用必须和对应的 assistant 消息成对出现
    // 超过预算就停
  }
}
```

## 记忆系统

### 两层结构

```
memory.ts（服务层）              → 调度、读取、持久化
memory-extractor-llm.ts（提取层） → 调 LLM 提取记忆
```

### 两种记忆类型

| 类型 | 含义 | 示例 |
|------|------|------|
| `global_rule` | 用户行为偏好（需要"永久性信号"才提取） | "以后用中文回答"、"别用折线图" |
| `personal_fact` | 用户个人信息（自动提取） | "我是市场部总监"、"公司叫 ABC Tech" |

### 记忆提取规则

- **全局规则**：必须有永久性信号：always / never / from now on / 以后
- **个人事实**：用户透露个人信息就自动提取
- **默认不提取**：大多数对话不会产生新记忆，拿不准就别提取

### 记忆更新机制

NAO使用`supersedes_id`机制更新记忆：

```
旧：偏好看同比数据
新：以后偏好看环比数据
LLM 返回：{ content: "偏好看环比", supersedes_id: "1" }
                                           ↑ 指向旧记忆 ID

数据库把旧记忆标记 supersededBy=新ID，查询时过滤掉
```

## 实际运行示例

以"上个月的销售额是多少？"为例：

1. **前端请求**：POST /api/agent { chatId: "abc", text: "上个月的销售额是多少" }
2. **AgentService.create()**：解析模型、检查预算、创建工具上下文
3. **AgentManager.stream()**：构建消息、启动AI循环
4. **ToolLoopAgent循环**：
   - 第1轮：Claude调用execute_sql工具查询数据库
   - 第2轮：Claude调用suggest_follow_ups工具提供追问建议
5. **流式输出**：将结果逐块推送给前端
6. **后台任务**：提取记忆、生成标题

## 总结与思考

NAO项目展示了如何构建一个完整的AI Agent系统，其架构设计有以下亮点：

1. **模块化设计**：系统提示词、工具、记忆等模块独立设计，易于扩展
2. **安全考虑**：工具系统有多层安全限制，防止恶意操作
3. **性能优化**：对话压缩和预算控制确保系统稳定运行
4. **用户体验**：记忆系统让AI能够记住用户偏好，提供个性化服务

对于想构建AI Agent系统的开发者，NAO提供了一个很好的参考实现。通过学习其架构设计，我们可以避免很多常见的坑，更快地构建出自己的AI应用。