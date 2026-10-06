'use strict';
// Smoke-start a command (README "run" commands, such as a server): let it run for <ms>, then kill the WHOLE process tree.
// (dev loop 2026-10-06, defect C7) The prototype killed only the direct child: `npm start` left a node grandchild listening on the port, which then
// failed the next project's smoke start ("EADDRINUSE") and made E12 a false PARTIAL. usage: node smoke.js <ms> <cwd> <command>
const { spawn, spawnSync } = require('child_process');
const [ms, cwd, cmd] = process.argv.slice(2);
const win = process.platform === 'win32';
const child = spawn(process.env.FX1_SHELL || 'bash', ['-c', cmd], { cwd, detached: !win, stdio: ['ignore', 'pipe', 'pipe'], env: process.env });
let out = '', timed = false;
child.stdout.on('data', d => { out += d; }); child.stderr.on('data', d => { out += d; });
const killTree = () => { try { if (win) spawnSync('taskkill', ['/T', '/F', '/PID', String(child.pid)], { stdio: 'ignore' }); else process.kill(-child.pid, 'SIGKILL'); } catch { /* already gone */ } };
const t = setTimeout(() => { timed = true; killTree(); }, +ms);
child.on('exit', code => { clearTimeout(t); killTree(); process.stdout.write(out.slice(-4000)); process.exit(timed ? 124 : (code === null ? 1 : code)); });
child.on('error', e => { process.stdout.write(String(e)); process.exit(1); });
