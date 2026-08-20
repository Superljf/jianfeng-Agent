import type { ToolDefinition } from "../types.ts";
import { runCommand } from "./bash.ts";
import { editFileInRoot, readFileInRoot } from "./files.ts";

export const toolDefinitions: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "read",
      description: "读取工作区内的文本文件。",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "相对工作区根目录的路径" },
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
        "修改工作区内的文本文件。old_text 为空时创建或覆盖整个文件；否则必须在文件中恰好出现一次后再替换。",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string" },
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
 * 执行模型给出的工具调用。执行失败时返回错误文本，不中断循环。
 */
export async function executeTool(
  root: string,
  name: string,
  rawArguments: string,
): Promise<string> {
  try {
    const args = JSON.parse(rawArguments) as Record<string, unknown>;
    switch (name) {
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
        return `未知工具: ${name}`;
    }
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}
