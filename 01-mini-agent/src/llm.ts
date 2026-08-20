import type { ChatFn, ChatResult, Message, ToolCall } from "./types.ts";
import { toolDefinitions } from "./tools/index.ts";

type DeepSeekOptions = {
  apiKey: string;
  baseUrl: string;
  model: string;
};

type WireToolCall = {
  id: string;
  function?: { name?: string; arguments?: string };
};

type WireMessage = {
  content?: string | null;
  tool_calls?: WireToolCall[];
};

type WireResponse = {
  error?: { message?: string };
  choices?: Array<{ message?: WireMessage }>;
};

function toWireMessages(messages: Message[]): unknown[] {
  return messages.map((message) => {
    if (message.role === "assistant" && message.tool_calls) {
      return {
        role: "assistant",
        content: message.content,
        tool_calls: message.tool_calls.map((call) => ({
          id: call.id,
          type: "function",
          function: { name: call.name, arguments: call.arguments },
        })),
      };
    }
    return message;
  });
}

function fromWire(message: WireMessage): ChatResult {
  const toolCalls: ToolCall[] = (message.tool_calls ?? [])
    .filter((call) => call.function?.name)
    .map((call) => ({
      id: call.id,
      name: call.function?.name ?? "",
      arguments: call.function?.arguments ?? "{}",
    }));
  return {
    content: message.content ?? null,
    tool_calls: toolCalls.length > 0 ? toolCalls : undefined,
  };
}

/** DeepSeek Chat Completions（与 OpenAI 工具调用协议兼容）。 */
export function createDeepSeekChat(options: DeepSeekOptions): ChatFn {
  const endpoint = `${options.baseUrl.replace(/\/$/, "")}/chat/completions`;
  return async (messages) => {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        authorization: `Bearer ${options.apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: options.model,
        messages: toWireMessages(messages),
        tools: toolDefinitions,
      }),
    });
    const payload = (await response.json()) as WireResponse;
    if (!response.ok) {
      throw new Error(payload.error?.message ?? `HTTP ${response.status}`);
    }
    const message = payload.choices?.[0]?.message;
    if (message === undefined) {
      throw new Error("模型响应缺少 choices[0].message");
    }
    return fromWire(message);
  };
}
