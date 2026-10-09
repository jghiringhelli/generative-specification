// check.mjs: runs the conformance checker on a finished cell in a SEPARATE container (the agent never shares a container with it).
// The cell's output is mounted read-only at /runs/<id>; the checker comes from TOOLS_DIR (mounted read-only); the report is written to the cell's logs.
import fs from 'node:fs';
import { dock } from './docker.mjs';

export function runChecker({ paths, id, path: P, since, outName = 'report.json', txtName = 'checker.out.txt' }) {
  const dir = `${paths.cells}/${id}`;
  const c = ['run', '--rm', '-v', `${dir}/work:/runs/${id}:ro`, '-v', `${paths.tools}:/tools:ro`, '-v', `${dir}/logs:/out`, 'fx1-linux', 'node', '/tools/gs-check/gs-check.mjs', '--repo', `/runs/${id}`, '--strict', '--verbose', '--out', `/out/${outName}`];
  if (P === 'C') c.push('--migration');
  if (P === 'B' && since) c.push('--sync', '--base', since);
  if (since) c.push('--since', since);
  const r = dock(c, { timeout: 60 * 60 * 1000 });
  fs.writeFileSync(`${dir}/logs/${txtName}`, (r.stdout || '') + (r.stderr || ''));
  return r.status;
}
