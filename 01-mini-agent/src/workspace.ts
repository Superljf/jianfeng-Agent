import path from "node:path";

/**
 * 把相对路径限制在工作区根目录内，防止 `../` 读到仓库外的文件。
 * @param root 工作区绝对路径
 * @param relativePath 模型传入的相对路径
 */
export function resolveInRoot(root: string, relativePath: string): string {
  if (path.isAbsolute(relativePath)) {
    throw new Error(`路径越出工作区: ${relativePath}`);
  }
  const rootResolved = path.resolve(root);
  const resolved = path.resolve(rootResolved, relativePath);
  const rel = path.relative(rootResolved, resolved);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error(`路径越出工作区: ${relativePath}`);
  }
  return resolved;
}
