// scan-secrets.mjs: V8. Looks for credentials in a folder tree. Prints file names and the pattern name, NEVER the secret.
// Two checks: (1) known token shapes; (2) the literal VALUE of every environment variable whose name looks secret (TOKEN, KEY, SECRET, PASSWORD, CREDENTIAL)
// found anywhere in the files. Exit 0 = clean, 1 = hits. usage: node scan-secrets.mjs <dir> [<dir> ...]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SHAPES = [
  ['openai/anthropic key', /sk-(ant-)?[A-Za-z0-9_-]{20,}/],
  ['google api key', /AIza[0-9A-Za-z_-]{30,}/],
  ['github token', /gh[pousr]_[0-9A-Za-z]{30,}/],
  ['github fine-grained', /github_pat_[0-9A-Za-z_]{40,}/],
  ['slack token', /xox[baprs]-[0-9A-Za-z-]{10,}/],
  ['private key block', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ['assigned token', /[A-Z0-9_]*(API_KEY|ACCESS_TOKEN|AUTH_TOKEN|_TOKEN)\s*=\s*['"]?(?=[A-Za-z0-9_\-.\/+=]*\d)(?=[A-Za-z0-9_\-.\/+=]*[A-Za-z])[A-Za-z0-9_\-.\/+=]{20,}/],
  ['oauth json', /"(accessToken|refreshToken)"\s*:\s*"[^"]{12,}"/],
  ['bearer', /Bearer\s+[A-Za-z0-9_\-.=]{20,}/],
];
const SKIP_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.zip', '.gz', '.bundle', '.pdf', '.ico', '.woff', '.woff2']);
const NAME_RE = /(TOKEN|KEY|SECRET|PASSWORD|CREDENTIAL)/i;

export function envSecrets() {
  return Object.entries(process.env).filter(([k, v]) => NAME_RE.test(k) && v && v.length >= 8 && !/^(true|false|none|[0-9.]+)$/i.test(v) && !/(PATH|DIR|FILE|HOME)$/i.test(k)).map(([k, v]) => [k, v]);
}

export function scan(dirs) {
  const hits = [];
  const secrets = envSecrets();
  const walk = d => {
    let ents; try { ents = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of ents) {
      const f = path.join(d, e.name);
      if (e.isDirectory()) { if (e.name === '.git' || e.name === 'node_modules') continue; walk(f); continue; }
      if (/^\.credentials\.json$|^auth\.json$|\.pem$|^id_rsa/.test(e.name)) hits.push([f, 'credential file by name']);
      if (SKIP_EXT.has(path.extname(e.name).toLowerCase())) continue;
      let st; try { st = fs.statSync(f); } catch { continue; }
      if (st.size > 64 * 1024 * 1024) continue;
      let txt; try { txt = fs.readFileSync(f, 'utf8'); } catch { continue; }
      for (const [n, re] of SHAPES) if (re.test(txt)) hits.push([f, n]);
      for (const [k, v] of secrets) if (txt.includes(v)) hits.push([f, `literal value of env ${k}`]);
    }
  };
  for (const d of dirs) walk(d);
  return hits;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const dirs = process.argv.slice(2);
  if (!dirs.length) { console.error('usage: node scan-secrets.mjs <dir> ...'); process.exit(2); }
  const hits = scan(dirs);
  for (const [f, n] of hits) console.log(`HIT  ${f}  (${n})`);
  console.log(hits.length ? `V8 FAILED: ${hits.length} hit(s). Revoke the key, delete the files, write a deviation.` : 'V8 passed: no secrets found');
  process.exit(hits.length ? 1 : 0);
}
