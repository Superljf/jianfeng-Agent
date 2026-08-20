import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { resolveInRoot } from "../workspace.ts";

/**
 * 【TS】把磁盘上的文件读成字符串，交给模型当「眼睛」。
 * 路径会先过 resolveInRoot：禁止 ../，并剥掉多余的 playground/ 前缀。
 */
export async function readFileInRoot(root: string, relativePath: string): Promise<string> {
  const filePath = resolveInRoot(root, relativePath);
  return readFile(filePath, "utf8");
}

/**
 * 【TS】真正改文件。模型只传来三个字符串，不会自己碰 fs。
 *
 * - oldText === "" → 创建或整文件覆盖（模型想「新建」时用这个）
 * - 否则 → 旧文本必须在文件里恰好出现 1 次，再换成 newText
 *   （出现 0 次或 2 次都抛错，executeTool 会把错误变成字符串还给模型）
 */
export async function editFileInRoot(
  root: string,
  relativePath: string,
  oldText: string,
  newText: string,
): Promise<string> {
  const filePath = resolveInRoot(root, relativePath);
  await mkdir(path.dirname(filePath), { recursive: true });
  if (oldText === "") {
    await writeFile(filePath, newText, "utf8");
    return `已写入 ${relativePath}`;
  }
  const current = await readFile(filePath, "utf8");
  const matches = current.split(oldText).length - 1;
  if (matches !== 1) {
    throw new Error(`old_text 在 ${relativePath} 中出现 ${matches} 次，必须恰好 1 次`);
  }
  await writeFile(filePath, current.replace(oldText, newText), "utf8");
  return `已修改 ${relativePath}`;
}
