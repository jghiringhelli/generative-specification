// manual-prompts.mjs: the SEMI-AUTOMATIC Copilot route (editor agent, no CLI). Writes one prompt file per step of a cell so a person (or an
// agent driving the editor) can paste them into a fresh agent-mode chat in the right order. Use it only if the CLI route fails adapter-probe.
// usage: FORMULA_DIR=... node manual-prompts.mjs --id <id> --path A|B --lang en|es --fixture <DEV-key> --out <folder>
// Writes: 00-README.md, then for A: 01-first.txt 02-ratify.txt 03-continue.txt (the scripted human messages) and 10-lock.txt (a NEW chat).
//         for B: 00-mvp.txt (chat 1, neutral prompt), then 01-first.txt (adopt, a NEW chat) 02-ratify.txt 03-continue.txt, 10-lock.txt (a NEW chat).
// Path C is not supported manually (it needs scripted decisions per fixture and the legacy clone).
import fs from 'node:fs';
import { makePrompts } from './lib/formulas.mjs';
import { paths as getPaths } from './lib/config.mjs';
import { readFixture } from './lib/flow.mjs';
const a = Object.fromEntries(process.argv.slice(2).reduce((r, x, i, v) => (x.startsWith('--') ? [...r, [x.slice(2), v[i + 1]]] : r), []));
for (const k of ['id', 'path', 'lang', 'fixture', 'out']) if (!a[k]) { console.error('missing --' + k); process.exit(2); }
if (!['A', 'B'].includes(a.path)) { console.error('manual route supports paths A and B only'); process.exit(2); }
const paths = getPaths();
const pr = makePrompts({ formDir: paths.formulas, lang: a.lang, fixtureKey: a.fixture });
const brief = readFixture(paths, a.fixture, a.lang).text;
fs.mkdirSync(a.out, { recursive: true });
const w = (f, t) => fs.writeFileSync(`${a.out}/${f}`, t);
if (a.path === 'A') w('01-first.txt', pr.greenfield(pr.ES ? brief : '\n' + brief + '\n', pr.ES ? 'lo que dice mi spec' : 'as my spec says'));
else { w('00-mvp.txt', pr.neutral(brief)); w('01-first.txt', pr.adopt()); }
w('02-ratify.txt', pr.RATIFY); w('03-continue.txt', pr.CONT); w('10-lock.txt', pr.lock('master'));
w('00-README.md', `# Manual cell ${a.id}\n\nFor each chat: NEW chat, agent mode, no memory, no custom instructions, workspace = an EMPTY folder outside any repository, model picked and its exact id written down.\n\n` +
  (a.path === 'B' ? `1. Chat 1: paste 00-mvp.txt. When it ends, record the commit hash (git rev-parse HEAD): that is the MVP boundary (--base for the checker).\n2. Chat 2 (NEW chat, same folder): paste 01-first.txt (adopt).\n` : `1. Chat 1: paste 01-first.txt (greenfield).\n`) +
  `3. If the agent has not printed a table with PRESENT/MISSING and has stopped to ask something, paste 02-ratify.txt once, then 03-continue.txt at most once more. Never answer in any other words.\n4. Chat 3 (NEW chat, same folder): paste 10-lock.txt (the lock formula; the reference lock tool path inside it says /tools/gs-lock/: tell the agent nothing else; if it cannot find the tool, record that).\n5. When done, collect: node collect-manual.mjs --id ${a.id} --from <the folder> --model "<exact id>" --path ${a.path} --fixture ${a.fixture}${a.path === 'B' ? ' --base <MVP commit>' : ''}\n\nThese runs are labelled copilot-vscode-manual, report no cost, and are NEVER pooled with CLI runs. The lock tool is not mounted in this route: the lock step will differ from the CLI route (record it).\n`);
console.log('wrote', a.out);
