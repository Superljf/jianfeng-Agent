import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import { resolveInRoot } from "../src/workspace.ts";

describe("resolveInRoot", () => {
  it("允许工作区内的相对路径", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "mini-agent-"));
    const resolved = resolveInRoot(root, "hello.ts");
    assert.equal(resolved, path.resolve(root, "hello.ts"));
  });

  it("拒绝用 .. 逃出工作区", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "mini-agent-"));
    assert.throws(() => resolveInRoot(root, "../secret.txt"), /越出工作区/);
  });

  it("去掉模型多写的 playground/ 前缀，落到工作区根下", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "mini-agent-"));
    const resolved = resolveInRoot(root, "playground/hello.ts");
    assert.equal(resolved, path.resolve(root, "hello.ts"));
  });
});
