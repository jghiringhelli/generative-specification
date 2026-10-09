// isolation-test.mjs: PROVES that the agent container cannot see the checker, the formulas, the fixtures, the repository, the results, or another cell.
// It launches a real agent container through the harness's own code path (cell.mjs agentCall) with a probe command instead of a model,
// and also runs a NEGATIVE CONTROL: the development harness's mount (the whole tools folder) is shown to expose the checker to the same probe,
// so a pass here means something. Exit 0 = isolated. Needs Docker and the image fx1-linux. No model, no key, no cost.
// usage: FX_ROOT=... FORMULA_DIR=... TOOLS_DIR=... node isolation-test.mjs
import fs from 'node:fs';
import { paths as getPaths } from './lib/config.mjs';
import { dock, hardening, agentMounts, assertAgentArgs } from './lib/docker.mjs';
import { openCell, newSession, agentCall, endCell } from './lib/cell.mjs';

const paths = getPaths();
let failures = 0;
const check = (name, ok, detail = '') => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  ' + detail : ''}`); if (!ok) failures++; };

// 1. a second cell with a marker file, to prove the first cannot see it
const other = `${paths.cells}/iso-other/work`;
fs.mkdirSync(other, { recursive: true }); fs.writeFileSync(`${other}/SECRET-OTHER-CELL.txt`, 'other cell');

const probe = {
  name: 'probe', image: 'fx1-linux', secretEnv: [], versionCmd: ['sh', '-c', 'echo probe'], prepareSession() {}, cleanupSession() {},
  command: () => ({
    shell: [
      'echo "== tools"; ls -la /tools 2>&1',
      'echo "== find checker"; find / -xdev \\( -name "gs-check*" -o -name "SUBSTRATE-CHECKLIST*" -o -name "SECRET-OTHER-CELL*" -o -name "FIX-*.md" -o -name "DEV-*.md" -o -name "*.bundle" \\) -not -path "/proc/*" 2>/dev/null',
      'echo "== find checker all fs"; find / \\( -name "gs-check*" -o -name "SUBSTRATE-CHECKLIST*" -o -name "SECRET-OTHER-CELL*" \\) -not -path "/proc/*" -not -path "/sys/*" 2>/dev/null',
      'echo "== work"; ls -la /work',
      'echo "== mounts"; awk \'{print $5}\' /proc/self/mountinfo | grep -E "^/(work|cfg|tools|runs|repo|formulas|fixtures|results|host_mnt|mnt)" ',
      'echo "== env"; env | grep -E "FX_|TOOLS_DIR|FORMULA_DIR|FX_ROOT|TOKEN|API_KEY" || echo none',
      'echo "== caps"; grep -E "^Cap(Eff|Bnd)" /proc/self/status',
      'echo "== write outside"; (touch /tools/gs-lock/x 2>&1 || true); (touch /etc/x 2>&1 || true)',
    ].join('; '),
    env: { HOME: '/tmp' },
  }),
  parse: (stdout, stderr, exit) => ({ text: stdout + '\n' + stderr, isError: exit !== 0, errorClass: null, sessionId: null, modelServed: 'probe', tokens: null, usd: 0, parsed: true }),
};

const id = `iso-${Date.now()}`;
const cell = openCell({ paths, id, adapter: probe, model: 'probe', stage: 'iso' });
const sess = newSession(cell, 'probe');
const r = agentCall(cell, sess, 'probe', 'probe', { respectStop: false });
endCell(cell);
dock(['volume', 'rm', '-f', cell.vol]);
const out = r.text;
console.log(out);

const sec = name => { const m = out.split(`== ${name}\n`)[1]; return (m || '').split('\n== ')[0]; };
check('/tools holds only gs-lock', /gs-lock/.test(sec('tools')) && !/gs-check/.test(sec('tools')));
check('no gs-check file anywhere in the container', !/gs-check/.test(sec('find checker')) && !/gs-check/.test(sec('find checker all fs')));
check('no SUBSTRATE-CHECKLIST anywhere', !/SUBSTRATE-CHECKLIST/.test(sec('find checker all fs')));
check('no other cell visible', !/SECRET-OTHER-CELL/.test(sec('find checker all fs')));
check('no fixture or bundle visible', !/FIX-|DEV-|\.bundle/.test(sec('find checker')));
check('/work is empty at the start', sec('work').split('\n').filter(l => l && !/^total|\s\.\.?$/.test(l)).length === 0);
const mnts = sec('mounts').split('\n').filter(Boolean);
check('only /work, /cfg and /tools/gs-lock are mounted from outside', mnts.every(m => ['/work', '/cfg', '/tools/gs-lock'].includes(m)), mnts.join(' '));
check('no harness or path variable in the agent environment', /none/.test(sec('env')), sec('env').trim().slice(0, 80));
check('capabilities dropped', /CapEff:\s+0{16}/.test(sec('caps')));
check('the reference lock tool is read-only', /Read-only file system|Permission denied/.test(sec('write outside')));

// 2. the allow-list refuses the development harness's mount (whole tools folder) before any container starts
let refused = false;
try { assertAgentArgs(['-v', `${paths.tools}:/tools:ro`], [cell.vol, '/x', `${paths.tools}/gs-lock`]); } catch { refused = true; }
check('allow-list refuses a mount of the whole tools folder', refused);
refused = false; try { assertAgentArgs(['--network', 'host'], []); } catch { refused = true; } check('allow-list refuses host networking', refused);
refused = false; try { assertAgentArgs(['-v', '/var/run/docker.sock:/var/run/docker.sock'], []); } catch { refused = true; } check('allow-list refuses the docker socket', refused);

// 3. NEGATIVE CONTROL: the development mount DOES expose the checker to the same probe (so the test above is sensitive)
const ctl = dock(['run', '--rm', '--cap-drop', 'ALL', '-v', `${paths.tools}:/tools:ro`, 'fx1-linux', 'sh', '-c', 'ls /tools/gs-check/gs-check.mjs']);
check('negative control: the old whole-tools mount exposes gs-check.mjs (the test can fail)', /gs-check\.mjs/.test(ctl.stdout || ''));

fs.rmSync(`${paths.cells}/iso-other`, { recursive: true, force: true });
console.log(failures ? `\nISOLATION TEST FAILED (${failures})` : '\nISOLATION TEST PASSED');
process.exit(failures ? 1 : 0);
