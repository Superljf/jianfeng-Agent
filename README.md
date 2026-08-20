# jianfeng-Agent

前端转 Agent 工程师的练习仓库。每一课一个目录，后面的课都往这里加，不另开仓库。

远程：[Superljf/jianfeng-Agent](https://github.com/Superljf/jianfeng-Agent)

## 目录

| 目录 | 课 | 做什么 |
|---|---|---|
| [01-mini-agent](./01-mini-agent) | 第一课 | 自己写「模型 → 工具 → 再问模型」的最小循环 |

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
