import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { resolveInRoot } from "../workspace.ts";

/** 读取工作区内的文本文件。 */
export async function readFileInRoot(root: string, relativePath: string): Promise<string> {
  const filePath = resolveInRoot(root, relativePath);
  return readFile(filePath, "utf8");
}

/**
 * 在工作区内改文件：`oldText` 为空则创建/覆盖；否则必须精确出现一次再替换。
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
