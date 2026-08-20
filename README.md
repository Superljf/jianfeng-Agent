# jianfeng-Agent

前端转 Agent 工程师的练习仓库。每一课一个目录，计划见 [课程计划.md](./课程计划.md)。

远程：[Superljf/jianfeng-Agent](https://github.com/Superljf/jianfeng-Agent)

## 目录

| 目录 | 课 | 做什么 |
|---|---|---|
| [01-mini-agent](./01-mini-agent) | 第一课 | 自己写「模型 → 工具 → 再问模型」的最小循环 |
| `02-eval` | 第二课 | 固定任务、自动判定成败 |
| `03-chat` | 第三课 | 多轮对话 |
| `04-approval` | 第四课 | 写文件 / 跑命令前审批 |
| `05-frontend-task` | 第五课 | 改真实小前端组件 |
| `06-context` | 第六课 | AGENTS.md 与上下文 |
| `07-trace-ui` | 第七课 | 把工具步骤画成页面 |
| `08-own-tool` | 第八课 | 自己加一个领域工具 |

未建目录的课，按计划做到那一课再创建。

## 约定

- 新练习：`02-...`、`03-...`，数字表示顺序
- 密钥只放各课自己的 `.env`，不要提交
- 每课自带 `README.md` / 启动说明

## 第一课怎么跑

```powershell
cd 01-mini-agent
pnpm install
pnpm start -- --fake "写一个 hello.ts"
```
