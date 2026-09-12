#!/usr/bin/env node
/*
 * sx_metric.cjs — parse a `claude -p --output-format stream-json` raw log.
 *
 * Usage: node sx_metric.cjs <raw-log-path>
 *
 * Iterates JSON lines. For each type==="assistant" message with message.usage,
 * accumulates cumulative_tokens += input + output + cache_read + cache_creation.
 * For each tool_use in assistant content:
 *   - Read  -> add file_path to a reads set
 *   - Edit/Write/MultiEdit -> count as a write; on the FIRST such edit snapshot
 *       localization_tokens       = cumulative_tokens up to & incl. this message
 *       localization_read_breadth = reads.size at that point
 * At end: total_tokens (final cumulative), total_read_breadth (reads.size),
 * writes (count of Edit/Write/MultiEdit), turns + total_cost_usd from the
 * type==="result" event. Output JSON. If no edit ever happened,
 * localization_* = total_* and note it.
 */
'use strict';
const fs = require('fs');

const path = process.argv[2];
if (!path) {
  console.error('usage: node sx_metric.cjs <raw-log-path>');
  process.exit(2);
}

const raw = fs.readFileSync(path, 'utf8');
const lines = raw.split(/\r?\n/);

let cumulative_tokens = 0;
const reads = new Set();
let writes = 0;

let localization_tokens = null;
let localization_read_breadth = null;
let firstEditSeen = false;

let turns = null;
let total_cost_usd = null;
let result_total_tokens = null; // from result.usage if present (informational)

const EDIT_TOOLS = new Set(['Edit', 'Write', 'MultiEdit']);

function num(x) { return typeof x === 'number' && isFinite(x) ? x : 0; }

for (const line of lines) {
  const t = line.trim();
  if (!t) continue;
  let ev;
  try { ev = JSON.parse(t); } catch (_) { continue; }
  if (!ev || typeof ev !== 'object') continue;

  if (ev.type === 'assistant' && ev.message && ev.message.usage) {
    const u = ev.message.usage;
    cumulative_tokens += num(u.input_tokens) + num(u.output_tokens) +
      num(u.cache_read_input_tokens) + num(u.cache_creation_input_tokens);

    const content = Array.isArray(ev.message.content) ? ev.message.content : [];
    for (const item of content) {
      if (!item || item.type !== 'tool_use') continue;
      const name = item.name;
      if (name === 'Read') {
        const fp = item.input && item.input.file_path;
        if (fp) reads.add(fp);
      } else if (EDIT_TOOLS.has(name)) {
        writes += 1;
        if (!firstEditSeen) {
          firstEditSeen = true;
          localization_tokens = cumulative_tokens;
          localization_read_breadth = reads.size;
        }
      }
    }
  } else if (ev.type === 'result') {
    if (typeof ev.num_turns === 'number') turns = ev.num_turns;
    if (typeof ev.total_cost_usd === 'number') total_cost_usd = ev.total_cost_usd;
    if (ev.usage) {
      const u = ev.usage;
      result_total_tokens = num(u.input_tokens) + num(u.output_tokens) +
        num(u.cache_read_input_tokens) + num(u.cache_creation_input_tokens);
    }
  }
}

const total_tokens = cumulative_tokens;
const total_read_breadth = reads.size;

let note = null;
if (!firstEditSeen) {
  localization_tokens = total_tokens;
  localization_read_breadth = total_read_breadth;
  note = 'no edit occurred; localization_* set equal to total_*';
}

const out = {
  localization_tokens,
  localization_read_breadth,
  total_tokens,
  total_read_breadth,
  writes,
  turns,
  total_cost_usd,
  result_usage_total_tokens: result_total_tokens,
};
if (note) out.note = note;

console.log(JSON.stringify(out, null, 2));
