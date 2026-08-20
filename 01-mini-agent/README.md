# mini-agent

前端转 Agent 工程师的第一课：自己写一个 **模型 → 工具 → 再问模型** 的命令行循环。

默认三个工具：`read`、`edit`、`bash`。Agent 只能改 `playground/`，避免误伤其它项目。

## 准备

需要 Node.js 22+。复制环境变量并填入 [DeepSeek API Key](https://platform.deepseek.com/)：

```powershell
cd D:\2026Code\jianfeng-Agent\01-mini-agent
pnpm install
copy .env.example .env
```

## 无密钥看循环

假模型会按脚本调用 `edit` 写出 `playground/hello.ts`：

```powershell
pnpm start -- --fake "写一个 hello.ts"
```

## 真模型跑一次任务

```powershell
pnpm start "在 playground 里写一个 hello.ts，内容是 console.log('ok')"
```

终端会打印每一步工具名、参数和结果，最后打印模型总结。

## 测试

```powershell
pnpm test
```

不调用真实 API。用脚本化假模型验证：路径不能逃出工作区、edit 能写文件、循环会在无工具调用或步数上限时结束。

## 代码从哪读起

1. `src/loop.ts` — 整条循环
2. `src/tools/` — 三个工具
3. `src/llm.ts` — DeepSeek HTTP
4. `src/index.ts` — 命令行入口

下一步可以加「必须恰好替换一处」的评测任务，或把循环接到一个你熟悉的前端小仓库（仍然建议先复制到 `playground/`）。
