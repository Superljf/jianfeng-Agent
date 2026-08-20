import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import { runAgent, scriptedChat, toolCall } from "../src/loop.ts";
import { executeTool } from "../src/tools/index.ts";

async function tempRoot(): Promise<string> {
  return mkdtemp(path.join(tmpdir(), "mini-agent-"));
}

describe("executeTool", () => {
  it("read 返回工作区内的文件内容", async () => {
    const root = await tempRoot();
    await writeFile(path.join(root, "a.ts"), "export const n = 1;\n", "utf8");
    const text = await executeTool(root, "read", JSON.stringify({ path: "a.ts" }));
    assert.equal(text, "export const n = 1;\n");
  });

  it("越界路径不会读到工作区外，而是返回错误文本", async () => {
    const root = await tempRoot();
    const text = await executeTool(root, "read", JSON.stringify({ path: "../secret.txt" }));
    assert.match(text, /越出工作区/);
  });

  it("edit 在 old_text 为空时创建文件", async () => {
    const root = await tempRoot();
    await executeTool(
      root,
      "edit",
      JSON.stringify({ path: "hello.ts", old_text: "", new_text: "console.log('ok');\n" }),
    );
    assert.equal(await readFile(path.join(root, "hello.ts"), "utf8"), "console.log('ok');\n");
  });

  it("write 视为 edit，且 playground/ 前缀写到工作区根", async () => {
    const root = await tempRoot();
    await executeTool(
      root,
      "write",
      JSON.stringify({
        path: "playground/hello.ts",
        old_text: "",
        new_text: "console.log('o111k');\n",
      }),
    );
    assert.equal(await readFile(path.join(root, "hello.ts"), "utf8"), "console.log('o111k');\n");
  });
});

describe("runAgent", () => {
  it("假模型先 edit 再结束时，文件已写入并返回总结", async () => {
    const root = await tempRoot();
    const chat = scriptedChat([
      {
        content: null,
        tool_calls: [
          toolCall("1", "edit", {
            path: "hello.ts",
            old_text: "",
            new_text: "console.log('ok');\n",
          }),
        ],
      },
      { content: "写好了" },
    ]);
    const answer = await runAgent({
      task: "写 hello.ts",
      chat,
      execute: (name, args) => executeTool(root, name, args),
    });
    assert.equal(answer, "写好了");
    assert.equal(await readFile(path.join(root, "hello.ts"), "utf8"), "console.log('ok');\n");
  });

  it("达到步数上限时停止", async () => {
    const root = await tempRoot();
    const chat = scriptedChat([
      {
        content: null,
        tool_calls: [toolCall("1", "read", { path: "missing.ts" })],
      },
      {
        content: null,
        tool_calls: [toolCall("2", "read", { path: "missing.ts" })],
      },
    ]);
    const answer = await runAgent({
      task: "一直读",
      chat,
      execute: (name, args) => executeTool(root, name, args),
      maxSteps: 2,
    });
    assert.match(answer, /步数上限/);
  });
});
