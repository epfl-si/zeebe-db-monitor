import { spawnSync } from "node:child_process";

export const commandExists = (command: string) => {
  const isWindows = process.platform === "win32";
  const checker = isWindows ? "where" : "which";

  const result = spawnSync(checker, [command], {
    stdio: "ignore",
  });

  return result.status === 0;
}
