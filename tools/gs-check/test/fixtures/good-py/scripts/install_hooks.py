"""Installs the versioned hooks in .githooks as the git hooks path. Safe outside a git checkout."""
import os
import subprocess
import sys

root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
if not os.path.exists(os.path.join(root, ".git")):
    sys.exit(0)
hooks = os.path.join(root, ".githooks")
for name in os.listdir(hooks):
    os.chmod(os.path.join(hooks, name), 0o755)
sys.exit(subprocess.run(["git", "config", "core.hooksPath", ".githooks"], cwd=root).returncode)
