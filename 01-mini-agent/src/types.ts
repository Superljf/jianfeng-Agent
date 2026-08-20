/** 发给模型的对话消息（OpenAI / DeepSeek 同形）。 */
export type Message =
  | { role: "system" | "user"; content: string }
  | {
      role: "assistant";
      content: string | null;
      tool_calls?: ToolCall[];
    }
  | { role: "tool"; tool_call_id: string; content: string };

export type ToolCall = {
  id: string;
  name: string;
  arguments: string;
};

/** 一次模型回复：要么继续调工具，要么给出最终文本。 */
export type ChatResult = {
  content: string | null;
  tool_calls?: ToolCall[];
};

export type ChatFn = (messages: Message[]) => Promise<ChatResult>;

export type ToolDefinition = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};
