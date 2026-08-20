# 第一课：怎么读懂 tools

先记住一句话：**模型不会自己改文件。** 它只能回 JSON：「请帮我调用某某工具，参数是这些」。你的 TypeScript 才真正去读盘、写盘、跑命令。

可以把模型想成前端，把 tools 想成后端 API：

| 前端（模型） | 后端（你的 TS） |
|---|---|
| 看到 `toolDefinitions` 这份接口文档 | `src/tools/index.ts` 里的 JSON Schema |
| 发出 `edit({ path, old_text, new_text })` | `executeTool()` 收到名字和参数字符串 |
| 看不到 Node、看不到磁盘 | `files.ts` / `bash.ts` 动真格 |

---

## 一次真实请求里发生了什么

你上次终端大致是：

```text
[step 1] write { "path": "playground/hello.ts", ... }
未知工具: write          ← 那时还没有把 write 映射成 edit

[step 2] edit { "path": "playground/hello.ts", ... }
已写入 playground/hello.ts
```

拆开看：

```text
你  →  pnpm start "写一个 hello.ts..."
         │
         ▼
index.ts  把任务交给 runAgent()
         │
         ▼
loop.ts   组装 messages（系统提示 + 你的任务）
         │
         ▼
llm.ts    POST DeepSeek，body 里带着 tools: [read, edit, bash]
         │
         ▼
模型      不直接改文件，而是返回 tool_calls
         │
         ▼
loop.ts   看到有 tool_calls，调用 execute(name, arguments)
         │
         ▼
tools     真正写文件，得到一段字符串结果
         │
         ▼
loop.ts   把结果当 role: "tool" 塞回 messages，再问模型
         │
         ▼
模型      不再调工具，只说话 → 循环结束，打印总结
```

**有 `tool_calls` = 还没做完，继续转圈。没有 `tool_calls` = 结束。** 这就是 `src/loop.ts` 里那个 `if (toolCalls.length === 0) return`。

---

## 三个工具分别干什么

工作区根目录是 `01-mini-agent/playground/`。模型应写 `hello.ts`，不要写 `playground/hello.ts`（多写了我们会剥掉前缀）。

### 1. `read`

- **模型说：** `{ "path": "hello.ts" }`
- **TS 做：** 读这个文件，把全文当字符串返回给模型
- **模型拿来干什么：** 先看再改，避免瞎编文件内容

### 2. `edit`（创建和修改都是它）

没有单独的 `write`。两种用法：

| old_text | 含义 |
|---|---|
| `""` 空字符串 | 创建或整文件覆盖 |
| 一段旧文本 | 必须在文件里**恰好出现一次**，再换成 `new_text` |

模型有时仍会叫 `write`。`executeTool` 里把 `write` 当成 `edit`，所以现在不会再停在「未知工具」。

### 3. `bash`

- **模型说：** `{ "command": "Get-ChildItem" }`（Windows 实际跑 PowerShell）
- **TS 做：** 在 `playground/` 里 spawn 进程，把 stdout/stderr/退出码拼成字符串
- **注意：** 命令失败也不会把 Agent 进程打死，失败文本照样喂回模型

---

## 对照代码读（按这个顺序）

1. `src/tools/index.ts` — 菜单（给模型看的说明书）+ 服务员（`executeTool`）
2. `src/tools/files.ts` — 真正的读/写磁盘
3. `src/tools/bash.ts` — 真正的跑命令
4. `src/workspace.ts` — 路径不能 `../` 逃出去
5. `src/loop.ts` — 什么时候调用 `execute`
6. `src/llm.ts` — 第 69 行 `tools: toolDefinitions`，模型就是在这里看见菜单的

文件里加了「给第一课看的」注释，遇到 `【模型】` / `【TS】` 就是在区分两边。

---

## 自己验证懂没懂

用假模型走一遍（不花 Token）：

```powershell
cd D:\2026Code\jianfeng-Agent\01-mini-agent
pnpm start -- --fake "写一个 hello.ts"
```

问自己三句：

1. 这一步是模型在写文件，还是 TS 在写文件？  
2. 终端里 `[step 1] edit {...}` 的 JSON 是谁产生的？  
3. 「已写入 hello.ts」这句话会回到哪，下一轮谁会读到？

答得上来：模型只出 JSON；TS 写盘；结果进 `messages` 里 role 为 `tool` 的那条，下一轮模型能看见——第一课的 tools 就算看懂了。
