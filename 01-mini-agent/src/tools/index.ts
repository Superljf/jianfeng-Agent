import type { ToolDefinition } from "../types.ts";
import { runCommand } from "./bash.ts";
import { editFileInRoot, readFileInRoot } from "./files.ts";

/**
 * 【模型看见的菜单】
 *
 * 这份数组会原样放进 DeepSeek 请求的 `tools` 字段（见 llm.ts）。
 * 模型不会执行这里的 TypeScript，它只根据 name / description / parameters
 * 决定「下一句要调用哪个工具、参数填什么」。
 *
 * 可以把它想成后端的 OpenAPI：描述越清楚，模型乱发明 write、乱加 playground/ 的概率越低。
 */
export const toolDefinitions: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "read",
      description: "读取工作区内的文本文件。",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "相对工作区根目录，例如 hello.ts，不要加 playground/" },
        },
        required: ["path"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "edit",
      description:
        "创建或修改工作区内的文本文件。没有单独的 write 工具。old_text 为空时创建或覆盖整个文件；否则必须在文件中恰好出现一次后再替换。path 写 hello.ts，不要写 playground/hello.ts。",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "相对工作区根目录，例如 hello.ts" },
          old_text: { type: "string" },
          new_text: { type: "string" },
        },
        required: ["path", "old_text", "new_text"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "bash",
      description: "在工作区根目录执行一条 shell 命令（Windows 为 PowerShell）。",
      parameters: {
        type: "object",
        properties: {
          command: { type: "string" },
        },
        required: ["command"],
      },
    },
  },
];

function asString(value: unknown, key: string): string {
  if (typeof value !== "string") {
    throw new Error(`缺少字符串参数 ${key}`);
  }
  return value;
}

/**
 * 【TS 真正动手的地方】
 *
 * loop.ts 在模型返回 tool_calls 之后会调用这里。
 *
 * @param root 工作区绝对路径，入口里传的是 .../playground
 * @param name 模型点的工具名，例如 "edit" 或它瞎编的 "write"
 * @param rawArguments 模型给的 JSON 字符串，还不是对象，所以要 JSON.parse
 * @returns 一段普通文字。成功、失败都返回字符串，再由 loop 塞回 messages。
 *          绝不要在这里把整个 Agent 进程 throw 死掉，否则模型没法改主意。
 */
export async function executeTool(
  root: string,
  name: string,
  rawArguments: string,
): Promise<string> {
  try {
    const args = JSON.parse(rawArguments) as Record<string, unknown>;
    // 模型常发明一个叫 write 的工具；菜单里没有，这里当成 edit，避免空转一轮。
    const toolName = name === "write" ? "edit" : name;
    switch (toolName) {
      case "read":
        return await readFileInRoot(root, asString(args.path, "path"));
      case "edit":
        return await editFileInRoot(
          root,
          asString(args.path, "path"),
          asString(args.old_text, "old_text"),
          asString(args.new_text, "new_text"),
        );
      case "bash":
        return await runCommand(root, asString(args.command, "command"));
      default:
        // 这句话会作为 tool 结果出现在下一轮对话里，模型才知道自己点错了。
        return `未知工具: ${name}`;
    }
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}
