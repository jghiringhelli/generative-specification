// docker.mjs: thin helpers. Every agent container is named and labelled so a timeout can kill it for real
// (killing the docker client alone leaves the container running).
import cp from 'node:child_process';

export const dock = (args, o = {}) => cp.spawnSync('docker', args, { encoding: 'utf8', maxBuffer: 1 << 28, ...o });

export function inVol(vol, cmd, image = 'fx1-linux') {
  return dock(['run', '--rm', '-v', `${vol}:/work`, '-w', '/work', image, 'sh', '-c', cmd]);
}

export function runNamed(name, args, timeoutMs) {
  // args are the arguments after `docker run --rm --name <name>`
  const r = dock(['run', '--rm', '--name', name, '--label', 'fx1=1', ...args], { timeout: timeoutMs, killSignal: 'SIGKILL' });
  if (r.error && r.error.code === 'ETIMEDOUT') { dock(['rm', '-f', name]); r.timedOut = true; }
  return r;
}

// The agent container: sees ONLY /work (its sandbox), /cfg (its own empty configuration folder, also holds the prompt files)
// and, read-only, the reference lock tool. Never the checker, never the formulas, never the fixtures, never another cell.
export function agentMounts({ vol, cfgDir, lockDir }) {
  const m = ['-v', `${vol}:/work`, '-v', `${cfgDir}:/cfg`];
  if (lockDir) m.push('-v', `${lockDir}:/tools/gs-lock:ro`);
  return m;
}
export const hardening = (memory = '8g') => ['--cap-drop', 'ALL', '--security-opt', 'no-new-privileges', '--pids-limit', '2048', '--memory', memory];

// Allow-list check: every -v / --mount / --volumes-from / --privileged / host-network in the agent's docker arguments must be one of the
// allowed mount sources (volume name or host folder). Anything else (the checker, the formulas, the fixtures, the repository, another
// cell, the Docker socket) throws before the container starts. A deny-list would miss the next mistake; this cannot.
export function assertAgentArgs(args, allowedSources) {
  const bad = [];
  for (let i = 0; i < args.length; i++) {
    const a = String(args[i]);
    if (a === '-v' || a === '--volume') {
      const spec = String(args[i + 1]);
      const m = spec.match(/^(.*?):(\/[^:]*)(?::(ro|rw))?$/);   // source:dest[:mode]; source may contain a drive colon
      const src = m ? m[1] : spec;
      if (!allowedSources.includes(src)) bad.push(`mount source not allowed: ${src}`);
      if (/docker\.sock/.test(spec)) bad.push('docker socket');
    }
    if (/^--(mount|volumes-from|privileged|pid|ipc|device|cap-add)(?![a-z-])/.test(a) || a === '--network=host' || (a === '--network' && args[i + 1] === 'host')) bad.push(`flag not allowed: ${a}`);
  }
  if (bad.length) throw new Error('ISOLATION VIOLATION: ' + bad.join('; '));
}
