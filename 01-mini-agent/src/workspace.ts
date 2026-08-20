import path from "node:path";

/**
 * 工作区根目录已经是 playground。模型常把路径写成 playground/hello.ts，
 * 这里去掉这一层前缀，避免写成 playground/playground/hello.ts。
 */
export function stripPlaygroundPrefix(relativePath: string): string {
  const normalized = relativePath.replaceAll("\\", "/").replace(/^\.\//, "");
  return normalized.replace(/^playground\//, "");
}

/**
 * 把相对路径限制在工作区根目录内，防止 `../` 读到仓库外的文件。
 * @param root 工作区绝对路径
 * @param relativePath 模型传入的相对路径
 */
export function resolveInRoot(root: string, relativePath: string): string {
  const trimmed = stripPlaygroundPrefix(relativePath);
  if (path.isAbsolute(trimmed) || path.isAbsolute(relativePath)) {
    throw new Error(`路径越出工作区: ${relativePath}`);
  }
  const rootResolved = path.resolve(root);
  const resolved = path.resolve(rootResolved, trimmed);
  const rel = path.relative(rootResolved, resolved);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error(`路径越出工作区: ${relativePath}`);
  }
  return resolved;
}
