import { spawn } from "node:child_process";

const TIMEOUT_MS = 30_000;

/**
 * 【TS】在工作区里跑一条命令。模型传来的只是 command 字符串。
 *
 * Windows 用 powershell.exe，macOS/Linux 用 bash。
 * cwd 固定为 root（playground），所以模型不必先 cd。
 *
 * 注意返回值：不管命令成功还是失败，都 resolve 成一段文本。
 * Agent 循环要的是「告诉模型发生了什么」，不是「命令一失败就崩溃」。
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
