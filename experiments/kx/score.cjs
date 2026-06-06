/**
 * KX scorer — SQuAD-style token-level F1 (the paper's primary metric, Eq. 1)
 * + Reasoning Density Score (RDS = F1 / tokens, Eq. 3) per condition and
 * query type. Writes RESULTS.md.
 *
 * Token accounting: input + output + cache_creation + cache_read from the
 * claude -p usage object — total context consumption, the agentic analog of
 * the paper's tokens-per-query. Cost from total_cost_usd.
 */
const fs = require("fs");
const path = require("path");

const KX = __dirname;
const queries = JSON.parse(fs.readFileSync(path.join(KX, "queries.json"), "utf-8"));
const truthById = Object.fromEntries(queries.map((q) => [q.id, q]));
const CONDITIONS = ["monolith", "cnt", "bare"];

const STOP = new Set(["the", "a", "an", "and", "or", "of", "in", "to", "is", "are", "for", "it", "its", "with", "by", "must", "be", "first", "after", "before", "according", "project", "conventions"]);

function tokens(s) {
  return String(s)
    .toLowerCase()
    .replace(/[`*_#>|]/g, " ")
    .replace(/[^a-z0-9./@-]+/g, " ")
    .split(/\s+/)
    .filter((t) => t && !STOP.has(t));
}

function tokenF1(pred, truth) {
  const p = tokens(pred);
  const t = tokens(truth);
  if (t.length === 0) return 0;
  if (p.length === 0) return 0;
  const tCount = {};
  for (const tok of t) tCount[tok] = (tCount[tok] || 0) + 1;
  let overlap = 0;
  for (const tok of p) {
    if (tCount[tok] > 0) {
      overlap++;
      tCount[tok]--;
    }
  }
  if (overlap === 0) return 0;
  const prec = overlap / p.length;
  const rec = overlap / t.length;
  return (2 * prec * rec) / (prec + rec);
}

function usageTokens(u) {
  if (!u) return 0;
  return (
    (u.input_tokens || 0) +
    (u.output_tokens || 0) +
    (u.cache_creation_input_tokens || 0) +
    (u.cache_read_input_tokens || 0)
  );
}

const rows = [];
for (const cond of CONDITIONS) {
  const dir = path.join(KX, "evidence", cond);
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json"))) {
    const r = JSON.parse(fs.readFileSync(path.join(dir, f), "utf-8"));
    const q = truthById[r.id];
    if (!q) continue;
    rows.push({
      cond,
      id: r.id,
      type: q.type,
      f1: r.is_error ? 0 : tokenF1(r.answer, q.truth),
      tok: usageTokens(r.usage),
      cost: r.total_cost_usd || 0,
      turns: r.num_turns || 0,
      err: !!r.is_error,
    });
  }
}

function agg(filter) {
  const sel = rows.filter(filter);
  if (sel.length === 0) return null;
  const mean = (k) => sel.reduce((s, r) => s + r[k], 0) / sel.length;
  const f1 = mean("f1");
  const tok = mean("tok");
  return {
    n: sel.length,
    f1,
    tok: Math.round(tok),
    cost: mean("cost"),
    turns: mean("turns").toFixed(1),
    rds: tok > 0 ? f1 / tok : 0,
    errs: sel.filter((r) => r.err).length,
  };
}

const types = ["T1", "T2", "T3", "T4", "T5"];
let md = "# KX Results — Harness-as-Knowledge-Retrieval (CKG-benchmark replication)\n\n";
md += "Token-level F1 (SQuAD-style) and RDS = F1/tokens, per Yarmoluk & McCreary.\n";
md += "Tokens = input + output + cache_creation + cache_read per query session.\n\n";
md += "## Macro (all query types)\n\n| Condition | n | Macro F1 | Tokens/q | RDS | RDS ratio | Cost/q | Turns/q | Errors |\n|---|---|---|---|---|---|---|---|---|\n";
const macro = {};
for (const c of CONDITIONS) macro[c] = agg((r) => r.cond === c);
const base = macro["cnt"]?.rds || 1;
for (const c of CONDITIONS) {
  const a = macro[c];
  if (!a) continue;
  md += `| ${c} | ${a.n} | ${a.f1.toFixed(4)} | ${a.tok.toLocaleString()} | ${a.rds.toExponential(2)} | ${(a.rds / base).toFixed(2)}× | $${a.cost.toFixed(4)} | ${a.turns} | ${a.errs} |\n`;
}
md += "\n## F1 by query type\n\n| Condition | T1 entity | T2 obligation | T3 path | T4 aggregate | T5 cross-link |\n|---|---|---|---|---|---|\n";
for (const c of CONDITIONS) {
  const cells = types.map((t) => {
    const a = agg((r) => r.cond === c && r.type === t);
    return a ? a.f1.toFixed(3) : "—";
  });
  md += `| ${c} | ${cells.join(" | ")} |\n`;
}
md += "\n## Tokens/query by type\n\n| Condition | T1 | T2 | T3 | T4 | T5 |\n|---|---|---|---|---|---|\n";
for (const c of CONDITIONS) {
  const cells = types.map((t) => {
    const a = agg((r) => r.cond === c && r.type === t);
    return a ? a.tok.toLocaleString() : "—";
  });
  md += `| ${c} | ${cells.join(" | ")} |\n`;
}

fs.writeFileSync(path.join(KX, "RESULTS.md"), md);
console.log(md);
