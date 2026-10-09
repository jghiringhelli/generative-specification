// config.mjs: every path and setting comes from the environment or an argument. No personal paths, no keys.
// Required: FX_ROOT (work folder for cells, ledger, queue state; no spaces in the path; 60 GB free for a big stage).
// Required for model runs: FORMULA_DIR (the docs/formulas folder of the formulas checkout), TOOLS_DIR (its tools folder).
// Optional: FX_FIXTURES_DEV, FX_FIXTURES_LEGACY, FX_CONFIRM_DIR (defaults inside this repository).
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const BS = String.fromCharCode(92); // a backslash, written this way so no tool can eat it

export const HARNESS_DIR = path.dirname(path.dirname(fileURLToPath(import.meta.url))).split(BS).join("/");
export const REPO_ROOT = path.resolve(HARNESS_DIR, '..', '..', '..').split(BS).join("/");
export const norm = p => (p ? String(p).split(BS).join("/") : p);

export function need(name) {
  const v = process.env[name];
  if (!v) { console.error(`set ${name} (see experiments/fx1/harness/README.md)`); process.exit(2); }
  return norm(v);
}

export function paths(opts = {}) {
  const root = need('FX_ROOT');
  const p = {
    root,
    cells: `${root}/cells`,
    ledger: `${root}/ledger.jsonl`,
    stop: `${root}/STOP`,
    state: `${root}/queue-state.json`,
    driveLog: `${root}/drive.log`,
    harness: HARNESS_DIR,
    repo: REPO_ROOT,
    fixturesDev: norm(process.env.FX_FIXTURES_DEV) || `${HARNESS_DIR}/fixtures-dev`,
    fixturesLegacy: norm(process.env.FX_FIXTURES_LEGACY) || `${HARNESS_DIR}/fixtures-legacy`,
    confirmDir: norm(process.env.FX_CONFIRM_DIR) || `${REPO_ROOT}/experiments/fx1/fixtures`,
  };
  if (!opts.noFormulas) { p.formulas = need('FORMULA_DIR'); p.tools = need('TOOLS_DIR'); }
  fs.mkdirSync(p.cells, { recursive: true });
  return p;
}

export const num = (name, dflt) => (process.env[name] !== undefined && process.env[name] !== '' ? Number(process.env[name]) : dflt);
export const nowIso = () => new Date().toISOString();
