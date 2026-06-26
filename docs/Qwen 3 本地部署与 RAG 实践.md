# Qwen 3 本地部署与 RAG 实践

最近 AI 这块最让我兴奋的一个趋势，就是能在自己电脑上直接跑大模型了。不用依赖云端的 API，数据不用往外传，也不用担心按 Token 付费，而且没网也能用。对咱们开发者来说，这玩意儿太香了。

我折腾了一段时间，把过程记了下来。这篇东西主要讲怎么用阿里开源的 Qwen 3 搭配 Ollama，在本地搭一套能用的 RAG 系统和简单的 AI 代理。

## 前提条件

得有点 Python 基础，会用命令行。电脑上得有 Python 3。之前接触过 AI 或 LLM 最好，没有也没关系，我会把 RAG 和 AI 代理这些概念顺带讲清楚。

## 搭建本地 AI 环境

### 安装 Ollama

Ollama 是目前在本地跑 LLM 最简单的工具，没有之一。

- **Linux / macOS：** 打开终端，跑官方脚本：
  ```
  curl -fsSL https://ollama.com/install.sh | sh
  ```
- **Windows：** 去 [Ollama 官网](https://ollama.com/download) 下载安装包，按提示装就行。

装完验证一下：
```
ollama --version
```

Ollama 默认把模型存在 `~/.ollama/models`（macOS）或 `/usr/share/ollama/.ollama/models`（Linux/WSL）。

### 选 Qwen 3 模型

选哪个模型取决于你的任务和硬件（主要是内存和显存）。模型越大，效果越好，但吃得也越多。

Qwen 3 在 Ollama 上有两种架构：

- **Dense 模型：**（`qwen3:0.6b`、`qwen3:4b`、`qwen3:8b`、`qwen3:14b`、`qwen3:32b`）推理时所有参数都激活，性能可预测，但资源需求跟参数数量成正比。
- **MoE（混合专家）模型：**（`qwen3:30b-a3b`）总参数量很大（300亿），但每个 Token 只激活一小部分"专家"，推理成本接近小模型。效果和效率的平衡挺不错的，尤其适合推理和编码。

**我推荐的：** `qwen3:8b` 在能力和资源消耗之间平衡得最好。如果配置低一些，`qwen3:4b` 也行。`qwen3:30b-a3b` 这个 MoE 模型效果很棒，16GB 以上显存跑起来意外的流畅。

### 拉取并运行 Qwen 3

选好模型后，通过 Ollama 下载：

```
ollama pull qwen3:8b
```

想先聊两句试试的话：

```
ollama run qwen3:8b
```

输入 `/bye` 退出。其他有用的命令：`/?` 看帮助，`/set parameter num_ctx 8192` 临时调整参数。在会话外可以用 `ollama list` 查看已下载的模型。

**如果要跟 Python 脚本配合**（通过 LangChain），需要让 Ollama 以服务模式运行，开一个新终端窗口：

```
ollama serve
```

这个命令会启动一个服务器，默认监听 `http://localhost:11434`，提供兼容 OpenAI 的 API 接口。跑 Python 脚本的时候这个终端不要关。

### 配置 Python 环境

建议建一个虚拟环境来管理依赖：

```
python -m venv venv
```

激活：

- macOS/Linux：`source venv/bin/activate`
- Windows：`venv\Scripts\activate`

装必要的库：

```
pip install langchain langchain-community langchain-core langchain-ollama chromadb sentence-transformers pypdf python-dotenv unstructured[pdf] tiktoken
```

每个库的用途简单说一下：

- `langchain` 全家桶：构建 LLM 应用的核心框架
- `langchain-ollama`：LangChain 和 Ollama 的桥梁
- `chromadb`：本地向量数据库，存文档的向量表示
- `sentence-transformers`：另一种本地嵌入方案（后面会讲）
- `pypdf`：读 PDF 用的
- `python-dotenv`：管理环境变量
- `unstructured[pdf]`：另一个 PDF 加载器，处理复杂排版更强
- `tiktoken`：用来统计 Token 数量

本地环境搭起来涉及好几个组件：Ollama 本身、Qwen 3 模型权重、Python 环境、LangChain 和 ChromaDB 这些库。这玩意儿好处是灵活，哪个组件都能换，坏处就是一开始得花点心思配置。下面我尽量把步骤写清楚，减少踩坑。

## Qwen 3 本地部署与 RAG 实践

RAG（检索增强生成）是个很实用的技术：LLM 不光是靠自己的训练数据来回答，还能从你指定的文档集（比如本地的 PDF）里检索相关信息，再根据这些信息回答问题。这样能大大减少"幻觉"，也能让 LLM 回答关于你私有数据的问题，不用重新训练。

核心流程：

1. 加载文档，拆成小块
2. 用嵌入模型把这些块转成向量
3. 存到向量数据库里
4. 收到查询时，把查询也转成向量，去数据库里找最相似的块
5. 把这些相关块（上下文）连同原始问题一起发给 LLM，让它给出回答

下面用 Qwen 3、Ollama、LangChain 和 ChromaDB 一步步搭起来。

### 第 1 步：准备数据

在项目文件夹里创建 `data` 目录，把你要查的 PDF 放进去。

```
mkdir data
# 把 PDF 复制到 data 目录里
```

没有现成的 PDF 的话，可以下一个 Llama 2 论文来试：

```
wget --user-agent "Mozilla" "https://arxiv.org/pdf/2307.09288.pdf" -O "data/llama2.pdf"
```

### 第 2 步：用 Python 加载文档

用 LangChain 的文档加载器来读 PDF：

```python
# rag_local.py
import os
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader

load_dotenv()

DATA_PATH = "data/"
PDF_FILENAME = "mydocument.pdf"

def load_documents():
    pdf_path = os.path.join(DATA_PATH, PDF_FILENAME)
    loader = PyPDFLoader(pdf_path)
    documents = loader.load()
    print(f"Loaded {len(documents)} page(s) from {pdf_path}")
    return documents
```

### 第 3 步：拆分文档

大文档需要拆成适合嵌入和检索的小块。`RecursiveCharacterTextSplitter` 会尽量按语义（段落、句子）来切，不行的话再按固定大小切。`chunk_size` 是每块的最大字符数，`chunk_overlap` 是块之间重叠的字符数，用来保持上下文连贯。

```python
# rag_local.py (continued)
from langchain_text_splitters import RecursiveCharacterTextSplitter

def split_documents(documents):
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len,
        is_separator_regex=False,
    )
    all_splits = text_splitter.split_documents(documents)
    print(f"Split into {len(all_splits)} chunks")
    return all_splits
```

### 第 4 步：选择嵌入模型

嵌入就是把文本转成向量（数字列表），语义相似的文本在向量空间里距离也近。

#### 方案 A（推荐）：Ollama 嵌入

让 Ollama 来跑一个专用的嵌入模型。`nomic-embed-text` 是个不错的开源模型。

先拉取：

```
ollama pull nomic-embed-text
```

然后在 Python 里用：

```python
# rag_local.py (continued)
from langchain_ollama import OllamaEmbeddings

def get_embedding_function(model_name="nomic-embed-text"):
    embeddings = OllamaEmbeddings(model=model_name)
    print(f"Initialized Ollama embeddings with model: {model_name}")
    return embeddings
```

#### 方案 B（备选）：Sentence Transformers

直接用 `sentence-transformers` 库，好处是不用再开一个 Ollama 进程：
`all-MiniLM-L6-v2` 轻量快速，`all-mpnet-base-v2` 质量更高。

```python
from langchain_community.embeddings import HuggingFaceEmbeddings

def get_embedding_function_hf(model_name="all-MiniLM-L6-v2"):
    embeddings = HuggingFaceEmbeddings(model_name=model_name)
    return embeddings
```

这篇笔记里我用方案 A，保持工具链统一。

### 第 5 步：搭建本地向量数据库（ChromaDB）

ChromaDB 用来高效地存储和搜索向量。使用持久化模式可以把索引数据存到磁盘，不用每次都重新处理文档。

```python
# rag_local.py (continued)
from langchain_community.vectorstores import Chroma

CHROMA_PATH = "chroma_db"

def get_vector_store(embedding_function, persist_directory=CHROMA_PATH):
    vectorstore = Chroma(
        persist_directory=persist_directory,
        embedding_function=embedding_function
    )
    print(f"Vector store initialized/loaded from: {persist_directory}")
    return vectorstore
```

### 第 6 步：索引文档（嵌入并存储）

把文档块转成向量存到 ChromaDB：

```python
# rag_local.py (continued)

def index_documents(chunks, embedding_function, persist_directory=CHROMA_PATH):
    print(f"Indexing {len(chunks)} chunks...")
    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=embedding_function,
        persist_directory=persist_directory
    )
    vectorstore.persist()
    print(f"Indexing complete. Data saved to: {persist_directory}")
    return vectorstore
```

后面想加载已经存在的数据库的话：

```python
embedding_function = get_embedding_function()
vector_store = Chroma(persist_directory=CHROMA_PATH, embedding_function=embedding_function)
```

### 第 7 步：构建 RAG 链

现在把各个组件组装成 LangChain 的 LCEL 链。这里有个关键参数 `num_ctx`——它定义了 LLM 能处理的上下文窗口大小（以 Token 计）。Ollama 的默认值（2048 或 4096）对于 RAG 来说通常太小了，装不下检索到的文档内容和用户的查询。

Qwen 3（8B 及以上）支持更大的上下文窗口（比如 128k Token），但实际能设多大取决于你的内存/显存。对于 RAG，`num_ctx` 设到 8192 或更高是常有的事。

```python
# rag_local.py (continued)
from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser

def create_rag_chain(vector_store, llm_model_name="qwen3:8b", context_window=8192):
    llm = ChatOllama(
        model=llm_model_name,
        temperature=0,
        num_ctx=context_window
    )
    print(f"Initialized ChatOllama with model: {llm_model_name}, context window: {context_window}")

    retriever = vector_store.as_retriever(
        search_type="similarity",
        search_kwargs={'k': 3}
    )

    template = """Answer the question based ONLY on the following context:
{context}

Question: {question}
"""
    prompt = ChatPromptTemplate.from_template(template)

    rag_chain = (
        {"context": retriever, "question": RunnablePassthrough()}
        | prompt
        | llm
        | StrOutputParser()
    )
    print("RAG chain created.")
    return rag_chain
```

RAG 的效果好坏取决于每个组件的配置：分块的 `chunk_size` 和 `chunk_overlap` 会影响检索结果；嵌入模型在索引和查询时必须保持一致；LLM 的 `num_ctx` 必须够大才能装下上下文和提示词；提示词模板写得不好也会把模型带偏。这些都得慢慢调。

### 第 8 步：查询文档

最后，用 RAG 链来问问题：

```python
# rag_local.py (continued)

def query_rag(chain, question):
    print("\nQuerying RAG chain...")
    print(f"Question: {question}")
    response = chain.invoke(question)
    print("\nResponse:")
    print(response)

# --- Main Execution ---
if __name__ == "__main__":
    docs = load_documents()
    chunks = split_documents(docs)
    embedding_function = get_embedding_function()
    vector_store = index_documents(chunks, embedding_function)
    rag_chain = create_rag_chain(vector_store, llm_model_name="qwen3:8b")

    query_rag(rag_chain, "What is the main topic of the document?")
    query_rag(rag_chain, "Summarize the introduction section.")
```

跑 `python rag_local.py` 之前确保 `ollama serve` 在另一个终端跑着。脚本会加载 PDF、拆分、用 `nomic-embed-text` 嵌入、存 ChromaDB、用 `qwen3:8b` 构建 RAG 链、最后执行查询。

## 用 Qwen 3 创建本地 AI 代理

除了基于文档回答问题，LLM 还能当 AI 代理的"大脑"——代理可以规划行动、调用外部工具（函数或 API）、完成更复杂的任务。

Qwen 3 在设计时就考虑了工具调用和代理能力。阿里自己有个 Qwen-Agent 框架，不过我这里还是用 LangChain，保持一致。

下面做一个简单的代理，能调用自定义的 Python 工具。

### 第 1 步：定义工具

工具就是普通的 Python 函数。函数的文档字符串很重要——LLM 靠它来理解这个工具是干啥的、需要什么参数。LangChain 的 `@tool` 装饰器可以把函数包装成代理可用的工具。

```python
# agent_local.py
import os
from dotenv import load_dotenv
from langchain.agents import tool
import datetime

load_dotenv()

@tool
def get_current_datetime(format: str = "%Y-%m-%d %H:%M:%S") -> str:
    """
    Returns the current date and time, formatted according to the provided Python strftime format string.
    Use this tool whenever the user asks for the current date, time, or both.
    Example format strings: '%Y-%m-%d' for date, '%H:%M:%S' for time.
    If no format is specified, defaults to '%Y-%m-%d %H:%M:%S'.
    """
    try:
        return datetime.datetime.now().strftime(format)
    except Exception as e:
        return f"Error formatting date/time: {e}"

tools = [get_current_datetime]
print("Custom tool defined.")
```

### 第 2 步：搭建代理 LLM

```python
# agent_local.py (continued)
from langchain_ollama import ChatOllama

def get_agent_llm(model_name="qwen3:8b", temperature=0):
    llm = ChatOllama(
        model=model_name,
        temperature=temperature
    )
    print(f"Initialized ChatOllama agent LLM with model: {model_name}")
    return llm
```

说句实话，本地模型通过 Ollama 调工具的可靠性，跟 GPT-4 或 Claude 这些商业 API 比还是有些差距的。LLM 可能意识不到该用工具、参数传错、或者误解工具的输出。建议从简单的提示和工具开始试。

### 第 3 步：创建代理提示词

代理需要特定的提示结构来引导它的推理和工具调用。LangChain Hub 上有现成的提示模板可以用。

```python
# agent_local.py (continued)
from langchain import hub

def get_agent_prompt(prompt_hub_name="hwchase17/openai-tools-agent"):
    prompt = hub.pull(prompt_hub_name)
    print(f"Pulled agent prompt from Hub: {prompt_hub_name}")
    return prompt
```

### 第 4 步：构建代理

```python
# agent_local.py (continued)
from langchain.agents import create_tool_calling_agent

def build_agent(llm, tools, prompt):
    agent = create_tool_calling_agent(llm, tools, prompt)
    print("Agent runnable created.")
    return agent
```

### 第 5 步：创建代理执行器

`AgentExecutor` 负责运行代理循环——调用代理、解析输出（可能是最终答案或工具调用请求）、执行工具、把结果喂回给代理，直到得出最终答案。开发时强烈建议把 `verbose=True` 打开，能看到代理的思考过程。

```python
# agent_local.py (continued)
from langchain.agents import AgentExecutor

def create_agent_executor(agent, tools):
    agent_executor = AgentExecutor(
        agent=agent,
        tools=tools,
        verbose=True
    )
    print("Agent executor created.")
    return agent_executor
```

### 第 6 步：运行代理

```python
# agent_local.py (continued)

def run_agent(executor, user_input):
    print("\nInvoking agent...")
    print(f"Input: {user_input}")
    response = executor.invoke({"input": user_input})
    print("\nAgent Response:")
    print(response['output'])

if __name__ == "__main__":
    agent_llm = get_agent_llm(model_name="qwen3:8b")
    agent_prompt = get_agent_prompt()
    agent_runnable = build_agent(agent_llm, tools, agent_prompt)
    agent_executor = create_agent_executor(agent_runnable, tools)

    run_agent(agent_executor, "What is the current date?")
    run_agent(agent_executor, "What time is it right now? Use HH:MM format.")
    run_agent(agent_executor, "Tell me a joke.")
```

跑 `python agent_local.py`（确保 `ollama serve` 开着），`verbose=True` 会打印类似 ReAct 框架的输出——代理的"思考"过程、决定调用的工具和参数、"观察"到工具返回的结果。

如果 `qwen3:8b` 在复杂代理任务上不太靠谱，硬件允许的话可以试试 `qwen3:14b` 或更高效的 `qwen3:30b-a3b`。

## 一些进阶话题和踩坑记录

### 控制 Qwen 3 的思考模式

Qwen 3 支持在深度"思考"模式和快速"不思考"模式之间切换。用 Ollama 的时候，主要是通过在提示词里加"软开关"来控制：

在用户提示末尾加 `/think` 鼓励逐步推理，加 `/no_think` 要求快速直接回答。

```python
from langchain_ollama import ChatOllama

llm = ChatOllama(model="qwen3:8b")

response = llm.invoke("Solve the equation 2x + 5 = 15 /think")
response = llm.invoke("What is the capital of France? /no_think")
```

### 管理上下文长度（num_ctx）

`num_ctx` 决定 LLM 一次能处理多少信息。Qwen 3（8B+）原生支持很大的上下文（128k Token），但 Ollama 默认值通常设得很小（2048 或 4096）。做 RAG 或长对话时肯定不够。

```python
llm = ChatOllama(model="qwen3:8b", num_ctx=8192)
```

注意：`num_ctx` 设得越大，内存和显存消耗也跟着涨。设太低模型会"失忆"甚至出现重复循环。得在任务需求和硬件能力之间找个平衡。

### 硬件限制与显存

本地跑 LLM 还是有点吃硬件的：

- **显存：** 强烈建议有独立显卡（NVIDIA 或 Apple Silicon），显存决定能跑多大模型
- **内存：** 如果模型塞不进显存，Ollama 会拿内存兜底，但速度会慢很多
- **量化：** Ollama 通常用的都是量化模型（4-bit 或 5-bit），比全精度模型小得多，性能损失却不大

如果跑起来很慢或者报错，考虑：
- 换更小的模型（比如 4B 代替 8B）
- 检查 Ollama 是否正确识别并使用了 GPU
- 关掉其他占资源的程序

## 总结

这篇笔记记录了用 Qwen 3 + Ollama 搭建本地 AI 环境的过程，包括：

1. 安装 Ollama 并在本地跑 Qwen 3 模型
2. 用 LangChain 和 ChromaDB 搭了一个 RAG 流程，能查本地文档
3. 做了一个简单的 AI 代理，能调用自定义工具

本地跑这些东西的好处很明显——隐私、零成本、可定制、离线可用。Qwen 3 的性能和开放许可加上 Ollama 的易用性，确实是个很不错的组合。

我自己也是边学边试，文章里可能有说得不对的地方，欢迎指正。如果有人也在折腾类似的东西，可以多交流。

**相关资源：**
- [Qwen 3](https://github.com/QwenLM/Qwen3)
- [Ollama](https://ollama.com/)
- [LangChain](https://python.langchain.com/docs/get_started/introduction)
- [ChromaDB](https://docs.trychroma.com/)
- [Sentence Transformers](https://www.sbert.net/)
