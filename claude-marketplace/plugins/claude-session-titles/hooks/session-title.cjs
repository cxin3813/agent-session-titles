"use strict";
const { spawnSync } = require("node:child_process");
const path = require("node:path");

function findPython(env = process.env) {
  const candidates = process.platform === "win32"
    ? [["py", "-3"], ["python"], ["python3"]] : [["python3"]];
  for (const [command, ...args] of candidates) {
    const check = spawnSync(command, [...args, "-c", "import sys; sys.exit(sys.version_info < (3, 11))"], { env, stdio: "ignore" });
    if (!check.error && check.status === 0) return [command, ...args];
  }
  throw new Error("Python 3.11+ is required on PATH (Windows: py -3 or python).");
}

if (require.main === module) {
  try {
    const [command, ...args] = findPython();
    const result = spawnSync(command, [...args, path.join(__dirname, "session-title.py")], {
      stdio: "inherit", env: { ...process.env, PYTHONUTF8: "1" },
    });
    if (result.error) throw result.error;
    process.exitCode = result.status ?? 1;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
module.exports = { findPython };
