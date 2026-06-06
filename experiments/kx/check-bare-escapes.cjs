const fs = require("fs");
const path = require("path");
const os = require("os");
const base = path.join(os.homedir(), ".claude", "projects");
const dirs = fs.readdirSync(base).filter((d) => d.includes("kx-bare-project"));
console.log("transcript dirs:", dirs);
const reads = [];
for (const d of dirs) {
  const dir = path.join(base, d);
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".jsonl"))) {
    for (const line of fs.readFileSync(path.join(dir, f), "utf-8").split("\n")) {
      if (!line.includes("tool_use")) continue;
      let e;
      try {
        e = JSON.parse(line);
      } catch {
        continue;
      }
      const c = e?.message?.content;
      if (!Array.isArray(c)) continue;
      for (const t of c) {
        if (t.type !== "tool_use") continue;
        const raw = t.input?.file_path || t.input?.path || t.input?.pattern || t.input?.command || "";
        const p = String(raw).split(String.fromCharCode(92)).join("/");
        if (p.includes("treatment-v8") || p.includes("..") || p.includes(".forgecraft") || p.includes("/ax/")) {
          reads.push(t.name + ": " + p.slice(-100));
        }
      }
    }
  }
}
console.log("escapes found:", reads.length);
console.log(reads.slice(0, 12).join("\n"));
