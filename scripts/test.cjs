"use strict";
const fs = require("node:fs");
const { spawnSync } = require("node:child_process");
const { findPython } = require("../plugins/codex-session-titles/hooks/session-title.cjs");
const [python, ...args] = findPython();
const checks = [
  [process.execPath, ["--test", ...fs.readdirSync("tests").filter((f) => f.endsWith(".test.cjs")).map((f) => `tests/${f}`)]],
  ...["claude-marketplace/plugins/claude-session-titles/tests/test-session-title.py", "plugins/codex-session-titles/tests/test-session-title-state.py"].map((file) => [python, [...args, file]]),
];
for (const [command, argv] of checks) {
  const result = spawnSync(command, argv, { stdio: "inherit", env: { ...process.env, PYTHONUTF8: "1" } });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
