// record.mjs: one JSON summary of a finished cell from its meta.json and the ledger lines of that cell.
// usage: FX_ROOT=... node record.mjs <cell id>   > RUN-RECORD.json
import fs from 'node:fs';
import { paths as getPaths } from './lib/config.mjs';
const id = process.argv[2];
if (!id) { console.error('usage: node record.mjs <cell id>'); process.exit(2); }
const paths = getPaths({ noFormulas: true });
const meta = JSON.parse(fs.readFileSync(`${paths.cells}/${id}/logs/meta.json`, 'utf8'));
const calls = fs.existsSync(paths.ledger) ? fs.readFileSync(paths.ledger, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)).filter(r => r.cell === id) : [];
const rec = {
  id, status: meta.status, adapter: meta.adapter, modelAsked: meta.modelAsked, modelServed: meta.modelServed, modelMismatch: meta.modelMismatch,
  cliVersion: meta.cliVersion, start: meta.start, end: meta.end, durationSec: meta.durationSec,
  calls: calls.length, errors: calls.filter(c => c.isError).length, infraErrors: calls.filter(c => String(c.errorClass || '').startsWith('infra')).length,
  tokensAvailable: calls.length > 0 && calls.every(c => c.tokensIn != null), tokens: meta.tokens, tokensNote: meta.tokensNote,
  usdReported: meta.usdReported, premiumEstimated: meta.premiumEstimated, premiumMultiplierKnown: meta.premiumMultiplierKnown,
  outputBytes: meta.outputBytes, outputFiles: meta.outputFiles, outputCommits: meta.outputCommits, void: meta.void,
  turns: calls.map(c => ({ turn: c.turn, label: c.label, durationMs: c.durationMs, isError: c.isError, errorClass: c.errorClass, usd: c.usd, tokensIn: c.tokensIn, tokensOut: c.tokensOut })),
};
console.log(JSON.stringify(rec, null, 2));
