import type { ChatFn, ChatResult, Message, ToolCall } from "./types.ts";

const SYSTEM = `你是一个只会改当前工作区文件的编程助手。
工作区根目录已经是 playground，cwd 就是这里。
路径只写相对文件名，例如 hello.ts，不要再写 playground/hello.ts。
只使用这三个工具：read、edit、bash。没有 write；创建或覆盖文件用 edit，并把 old_text 设为空字符串。
完成任务后用自然语言做简短总结，不要再调工具。
不要尝试访问工作区以外的路径。`;

export type AgentStep = {
  step: number;
  tool: string;
  arguments: string;
  result: string;
};

export type RunAgentOptions = {
  task: string;
  chat: ChatFn;
  execute: (name: string, rawArguments: string) => Promise<string>;
  maxSteps?: number;
  onStep?: (step: AgentStep) => void;
};

/**
 * 核心循环：问模型 → 若有 tool_calls 就执行并回填 → 直到模型只说话或达到步数上限。
 *
 * tool_calls 可以想成模型点的「按钮」。有按钮就去 src/tools 里执行；
 * 没按钮只剩一段文字，就是最终答案，循环结束。
 */
export async function runAgent(options: RunAgentOptions): Promise<string> {
  const maxSteps = options.maxSteps ?? 20;
  const messages: Message[] = [
    { role: "system", content: SYSTEM },
    { role: "user", content: options.task },
  ];

  for (let step = 1; step <= maxSteps; step += 1) {
    const reply = await options.chat(messages);
    const toolCalls = reply.tool_calls ?? [];
    if (toolCalls.length === 0) {
      return reply.content?.trim() || "(模型没有返回文本)";
    }

    // 必须先把「我调用了这些工具」记进历史，模型和 OpenAI 协议才能把后续 tool 结果对上号。
    messages.push({
      role: "assistant",
      content: reply.content,
      tool_calls: toolCalls,
    });

    for (const call of toolCalls) {
      // 【分界】这里离开模型，进入你的 TS。call.arguments 仍是 JSON 字符串。
      const result = await options.execute(call.name, call.arguments);
      options.onStep?.({
        step,
        tool: call.name,
        arguments: call.arguments,
        result,
      });
      // 结果变成 role: "tool" 的消息。下一轮模型能看见「上次工具跑出了什么」。
      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: result,
      });
    }
  }

  return `已达到步数上限 ${maxSteps}，任务可能未完成。`;
}

/** 给测试用的脚本化假模型：按预定回复依次返回。 */
export function scriptedChat(script: ChatResult[]): ChatFn {
  let index = 0;
  return async () => {
    const next = script[index];
    index += 1;
    if (next === undefined) {
      return { content: "脚本用尽" };
    }
    return next;
  };
}

export function toolCall(id: string, name: string, args: unknown): ToolCall {
  return { id, name, arguments: JSON.stringify(args) };
}
