import { spawn } from "node:child_process";

const TIMEOUT_MS = 30_000;

/**
 * 在工作区根目录执行一条命令。Windows 走 PowerShell，其它系统走 bash。
 * 失败不抛给进程，把退出码和输出当成字符串返回给模型。
 */
export function runCommand(root: string, command: string): Promise<string> {
  const isWindows = process.platform === "win32";
  const child = isWindows
    ? spawn("powershell.exe", ["-NoProfile", "-Command", command], {
        cwd: root,
        timeout: TIMEOUT_MS,
      })
    : spawn("bash", ["-lc", command], { cwd: root, timeout: TIMEOUT_MS });

  return new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });
    child.on("error", (error) => {
      resolve(`启动失败: ${error.message}`);
    });
    child.on("close", (code) => {
      const parts = [
        `exit=${code ?? "unknown"}`,
        stdout.trim() === "" ? "" : `stdout:\n${stdout}`,
        stderr.trim() === "" ? "" : `stderr:\n${stderr}`,
      ].filter((part) => part !== "");
      resolve(parts.join("\n"));
    });
  });
}
