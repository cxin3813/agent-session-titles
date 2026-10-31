"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");
const roots = ["plugins/codex-session-titles/hooks", "claude-marketplace/plugins/claude-session-titles/hooks"];
for (const root of roots) {
  test(`${root}: launcher and competing process locks`, () => {
    const { findPython } = require(`../${root}/session-title.cjs`);
    const [command, ...args] = findPython();
    const code = `import os, subprocess, sys, tempfile
sys.path.insert(0, ${JSON.stringify(path.resolve(root))})
from file_lock import lock, unlock
with tempfile.TemporaryDirectory() as directory:
    name = os.path.join(directory, 'lock')
    with open(name, 'a+') as handle:
        lock(handle.fileno())
        child = "from file_lock import lock; import sys; f=open(sys.argv[1], 'a+'); lock(f.fileno())"
        env = dict(os.environ, PYTHONPATH=sys.path[0])
        assert subprocess.run([sys.executable, '-c', child, name], env=env, capture_output=True).returncode != 0
        unlock(handle.fileno())
        assert subprocess.run([sys.executable, '-c', child, name], env=env, capture_output=True).returncode == 0
`;
    const result = spawnSync(command, [...args, "-c", code], { encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    const hook = spawnSync(process.execPath, [path.join(root, "session-title.cjs")], { input: "{}", encoding: "utf8" });
    assert.equal(hook.status, 0, hook.stderr);
  });
}

test("Windows npm shim preserves spaces and rejects shell expansion", { skip: process.platform !== "win32" }, () => {
  const os = require("node:os");
  const { runCommand } = require("../bin/agent-session-titles.cjs");
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "title shim 中文 "));
  fs.writeFileSync(path.join(directory, "codex.cmd"), '@echo off\r\nnode -e "console.log(process.argv[1])" %*\r\n' );
  const env = { ...process.env, PATH: `${directory};${process.env.PATH}` };
  assert.deepEqual(runCommand("codex", ["a b 中文"], env, "test"), ["a b 中文"]);
  assert.throws(() => runCommand("codex", ["%PATH%"], env, "test"), /unsupported shell/);
});
