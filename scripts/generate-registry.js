#!/usr/bin/env node
/**
 * Generate quality-gates/index.json from all gate YAML files.
 *
 * Usage: node scripts/generate-registry.js
 *
 * Reads every *.yaml in quality-gates/gates/, maps to the RemoteGatesIndex
 * schema expected by forgecraft-mcp's remote-gates.ts, and writes
 * quality-gates/index.json.
 *
 * No external dependencies — pure Node.js built-ins only.
 */

const fs = require('fs');
const path = require('path');

const GATES_DIR = path.join(__dirname, '..', 'quality-gates', 'gates');
const OUT_FILE  = path.join(__dirname, '..', 'quality-gates', 'index.json');

// ---------------------------------------------------------------------------
// Minimal YAML parser for the specific gate file format.
// Handles: scalar fields, > block scalars, [inline] arrays, nested check: obj.
// ---------------------------------------------------------------------------

/** @param {string} raw */
function parseGateYaml(raw) {
  const lines = raw.split(/\r?\n/);
  const gate = {};
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Skip comments and blank lines at top level
    if (/^\s*#/.test(line) || /^\s*$/.test(line)) { i++; continue; }

    const topKey = line.match(/^([a-z_]+):\s*(.*)/);
    if (!topKey) { i++; continue; }

    const key = topKey[1];
    const rest = topKey[2].trim();

    // Block scalar (> or >-)
    if (rest === '>' || rest === '>-') {
      i++;
      const blockLines = [];
      while (i < lines.length && /^\s+/.test(lines[i])) {
        blockLines.push(lines[i].trim());
        i++;
      }
      gate[key] = blockLines.join(' ').replace(/\s+/g, ' ').trim();
      continue;
    }

    // Inline array [a, b, c]
    if (rest.startsWith('[')) {
      const inner = rest.replace(/^\[|\]$/g, '');
      gate[key] = inner.split(',').map(s => s.trim()).filter(Boolean);
      i++; continue;
    }

    // Nested object (e.g. check:)
    if (rest === '') {
      i++;
      const obj = {};
      while (i < lines.length && /^ {2,}/.test(lines[i])) {
        const nested = lines[i].match(/^\s+([a-z_]+):\s*(.*)/);
        if (nested) {
          const nKey = nested[1];
          const nRest = nested[2].trim();
          if (nRest === '>' || nRest === '>-') {
            // Block scalar inside nested obj
            i++;
            const blockLines = [];
            while (i < lines.length && /^ {4,}/.test(lines[i])) {
              blockLines.push(lines[i].trim());
              i++;
            }
            obj[nKey] = blockLines.join(' ').replace(/\s+/g, ' ').trim();
          } else {
            obj[nKey] = nRest.replace(/^"|"$/g, '');
            i++;
          }
        } else { i++; }
      }
      gate[key] = obj;
      continue;
    }

    // Plain scalar (strip quotes)
    gate[key] = rest.replace(/^"|"$/g, '');
    i++;
  }

  return gate;
}

/** Extract the "Gate passes when..." clause from a description. */
function extractPassCriterion(description) {
  const match = description.match(/Gate passes when[^.]+\./i);
  return match ? match[0].trim() : description.split('.')[0].trim() + '.';
}

/** Map public gate schema → RemoteGate (the format remote-gates.ts expects). */
function toRemoteGate(raw) {
  if (raw.deprecated === 'true' || raw.deprecated === true) return null;

  const id          = raw.id          ?? '';
  const title       = raw.name        ?? id;
  const description = raw.description ?? '';
  const gsProperty  = raw.property    ?? 'Verifiable';
  const phase       = raw.phase       ?? 'development';
  const hook        = raw.trigger     ?? 'commit';
  const checkCmd    = typeof raw.check === 'object'
    ? (raw.check.command ?? '')
    : (raw.check ?? '');
  const tags        = Array.isArray(raw.tags)
    ? raw.tags.map(t => t.toUpperCase())
    : [];

  return {
    id,
    title,
    description,
    category:      gsProperty,
    gsProperty,
    phase,
    hook,
    check:         checkCmd,
    passCriterion: extractPassCriterion(description),
    tags,
    status:        'approved',
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const files = fs.readdirSync(GATES_DIR)
  .filter(f => f.endsWith('.yaml'))
  .sort();

const gates = [];
for (const file of files) {
  const raw  = parseGateYaml(fs.readFileSync(path.join(GATES_DIR, file), 'utf8'));
  const gate = toRemoteGate(raw);
  if (gate && gate.id) gates.push(gate);
}

const allTags = [...new Set(gates.flatMap(g => g.tags ?? []))].sort();

const index = {
  generatedAt: new Date().toISOString(),
  version:     '1',
  gateCount:   gates.length,
  tags:        allTags,
  gates,
};

fs.writeFileSync(OUT_FILE, JSON.stringify(index, null, 2) + '\n', 'utf8');
console.log(`✅ Written ${gates.length} gates to ${path.relative(process.cwd(), OUT_FILE)}`);
console.log(`   Tags: ${allTags.join(', ')}`);
