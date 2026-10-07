'use strict';
// Installs the versioned hooks in .githooks as the git hooks path. Safe outside a git checkout.
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
if (!fs.existsSync(path.join(root, '.git'))) process.exit(0);
const dir = path.join(root, '.githooks');
for (const f of fs.readdirSync(dir)) fs.chmodSync(path.join(dir, f), 0o755);
const r = spawnSync('git', ['config', 'core.hooksPath', '.githooks'], { cwd: root });
process.exit(r.status === 0 ? 0 : 1);
