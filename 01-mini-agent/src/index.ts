import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createDeepSeekChat } from "./llm.ts";
import { runAgent, scriptedChat, toolCall } from "./loop.ts";
import { executeTool } from "./tools/index.ts";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const playground = path.join(rootDir, "playground");

async function loadDotEnv(): Promise<void> {
  try {
    const text = await readFile(path.join(rootDir, ".env"), "utf8");
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (trimmed === "" || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}

function fakeChat() {
  return scriptedChat([
    {
      content: null,
      tool_calls: [
        toolCall("call_1", "edit", {
          path: "hello.ts",
          old_text: "",
          new_text: "console.log('ok');\n",
        }),
      ],
    },
    { content: "已在 playground/hello.ts 写入 console.log('ok')" },
  ]);
}

async function main(): Promise<void> {
  const fake = process.argv.includes("--fake");
  const task = process.argv
    .slice(2)
    .filter((arg) => arg !== "--fake")
    .join(" ")
    .trim();
  if (task === "") {
    console.error('用法: pnpm start "任务描述"\n无密钥试跑: pnpm start -- --fake "写一个 hello.ts"');
    process.exitCode = 1;
    return;
  }

  await loadDotEnv();
  const chat = fake
    ? fakeChat()
    : createDeepSeekChat({
        apiKey: process.env.DEEPSEEK_API_KEY ?? "",
        baseUrl: process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com",
        model: process.env.DEEPSEEK_MODEL ?? "deepseek-chat",
      });
  if (!fake && (process.env.DEEPSEEK_API_KEY ?? "") === "") {
    console.error("缺少 DEEPSEEK_API_KEY。可复制 .env.example 为 .env，或先用 --fake 看循环。");
    process.exitCode = 1;
    return;
  }

  const answer = await runAgent({
    task,
    chat,
    execute: (name, rawArguments) => executeTool(playground, name, rawArguments),
    onStep: ({ step, tool, arguments: args, result }) => {
      console.log(`\n[step ${step}] ${tool} ${args}`);
      console.log(result.slice(0, 2000));
    },
  });
  console.log(`\n${answer}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
