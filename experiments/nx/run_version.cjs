// run_version.cjs <versionPath> <inputsJsonPath>
// requires the AI-generated module, runs its exported fn on each input, prints JSON outputs.
// Isolated child process (parent applies timeout). Never sees the oracle.
const fs = require("fs");
const [,, versionPath, inputsPath] = process.argv;
let fn;
try {
  fn = require(versionPath);
  if (typeof fn !== "function" && fn && typeof fn.default === "function") fn = fn.default;
} catch (e) {
  process.stdout.write(JSON.stringify({ loadError: String(e).slice(0,200) }));
  process.exit(0);
}
if (typeof fn !== "function") {
  process.stdout.write(JSON.stringify({ loadError: "export is not a function" }));
  process.exit(0);
}
const inputs = JSON.parse(fs.readFileSync(inputsPath, "utf-8"));
const outs = inputs.map(inp => {
  try {
    const o = fn(...inp.map(x => clone(x)));
    return { ok: true, v: o };
  } catch (e) { return { ok: false, err: String(e && e.message || e).slice(0,80) }; }
});
function clone(x){ return x && typeof x === "object" ? JSON.parse(JSON.stringify(x)) : x; }
process.stdout.write(JSON.stringify(outs));
