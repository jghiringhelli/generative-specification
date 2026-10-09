// gate.mjs: the code form of the gating rule for REGISTERED runs. A run on a confirmatory fixture (FIX-*) is refused unless
//   1. the formulas tag exists and is ANNOTATED (git cat-file -t prints "tag"), and the formulas checkout is exactly that tag's commit;
//   2. the registration tag prereg/FX-1-v<n> exists in the protocol repository;
//   3. docs/experiments/prereg/FX-1.md says FROZEN on its Status line (and not NOT FROZEN, not DRAFT).
// Today none of the three holds, so this returns { ok: false } and the harness stops.
import cp from 'node:child_process';
import fs from 'node:fs';

const git = (dir, ...a) => cp.spawnSync('git', ['-c', 'safe.directory=*', '-C', dir, ...a], { encoding: 'utf8' });

export function gateCheck({ repo, formulasRoot, tagName }) {
  const reasons = [];
  git(repo, 'fetch', '--tags', '--quiet');
  const tags = (git(repo, 'tag', '--list').stdout || '').split('\n').filter(Boolean);
  const ftags = tags.filter(t => /^formulas-v\d/.test(t) || t === tagName);
  const ptags = tags.filter(t => /^prereg\/FX-1-v\d/.test(t));
  let fOk = false;
  for (const t of ftags) {
    const kind = (git(repo, 'cat-file', '-t', t).stdout || '').trim();
    if (kind === 'tag') {
      const tc = (git(repo, 'rev-parse', `${t}^{commit}`).stdout || '').trim();
      const head = formulasRoot ? (git(formulasRoot, 'rev-parse', 'HEAD').stdout || '').trim() : '';
      if (head && tc === head) fOk = true; else reasons.push(`formulas tag ${t} is annotated but the formulas checkout (${head.slice(0, 8) || 'none'}) is not its commit (${tc.slice(0, 8)})`);
    } else reasons.push(`formulas tag ${t} is ${kind || 'unknown'}, not an annotated tag`);
  }
  if (!ftags.length) reasons.push('no frozen formulas tag (expected formulas-v1 or the name JC gives); `git tag --list` shows: ' + (tags.join(' ') || '(none)'));
  if (!ptags.length) reasons.push('no registration tag prereg/FX-1-v*');
  let frozen = false;
  const f = `${repo}/docs/experiments/prereg/FX-1.md`;
  if (fs.existsSync(f)) {
    const st = (fs.readFileSync(f, 'utf8').split('\n').find(l => /^Status:/.test(l)) || '');
    frozen = /FROZEN/.test(st) && !/NOT FROZEN|DRAFT/i.test(st);
    if (!frozen) reasons.push('FX-1.md Status line is not FROZEN: ' + st.slice(0, 120));
  } else reasons.push('FX-1.md not found');
  return { ok: reasons.length === 0 && fOk && ptags.length > 0 && frozen, reasons, tags };
}
