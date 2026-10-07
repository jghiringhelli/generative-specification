"""The project's own gates. Written independently of the FX-1 checker (it is the checker's python positive control)."""
import hashlib
import json
import os
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent


def fail(msg):
    print("gate: " + msg, file=sys.stderr)
    sys.exit(1)


def read(p):
    return (ROOT / p).read_text(encoding="utf8").replace("\r", "")


def walk(d):
    base = ROOT / d
    if not base.exists():
        return []
    skip = {"__pycache__", ".pytest_cache"}
    return sorted(str(p.relative_to(ROOT)).replace("\\", "/") for p in base.rglob("*") if p.is_file() and not (skip & set(p.parts)))


def syntax():
    for f in [x for x in walk("src") if x.endswith(".py")]:
        try:
            compile(read(f), f, "exec")
        except SyntaxError:
            fail("syntax error in " + f)


def tests():
    env = dict(os.environ, PYTHONDONTWRITEBYTECODE="1")
    r = subprocess.run([sys.executable, "-m", "pytest", "-q", "-p", "no:cacheprovider"], cwd=ROOT, capture_output=True, text=True, env=env)
    if r.returncode != 0:
        sys.stderr.write(r.stdout + r.stderr)
        fail("tests fail")


def open_questions():
    if not (ROOT / "docs/spec").exists():
        return
    for f in [x for x in walk("docs/spec") if x.endswith(".md")]:
        if re.search(r"^\s*OPEN:", read(f), re.M):
            fail("open question in " + f)


def measure():
    n = 0
    for f in [x for x in walk("tests") if re.search(r"test_.*\.py$", x)]:
        n += len(re.findall(r"^def test_", read(f), re.M))
    return {"tests_min": n}


def ratchet():
    floor = json.loads(read("docs/ratchet.json"))
    cur = measure()
    for k, v in floor.items():
        if cur.get(k, 0) < v:
            fail("ratchet: %s measured %s is below the floor %s" % (k, cur.get(k, 0), v))
    head = subprocess.run(["git", "show", "HEAD:docs/ratchet.json"], cwd=ROOT, capture_output=True, text=True)
    if head.returncode == 0:
        old = json.loads(head.stdout)
        for k, v in old.items():
            if floor.get(k, 0) < v:
                fail("ratchet: floor %s lowered from %s to %s" % (k, v, floor.get(k)))


def norm(t):
    t = t.replace("\r", "")
    t = re.sub(r"^[ \t]*(?:[-*]|\d+\.)[ \t]+(?:\[[ xX~]\][ \t]*)?", "", t, flags=re.M)
    t = re.sub(r"[*_`]", "", t)
    return re.sub(r"\s+", " ", t).strip()


def slug(s):
    return re.sub(r"^-+|-+$", "", re.sub(r"[^a-z0-9]+", "-", s.lower()))


def section(f, want):
    cur, buf = None, {}
    for line in read(f).split("\n"):
        h = re.match(r"^#{1,6}\s+(.*)$", line)
        if h:
            cur = slug(h.group(1))
            buf[cur] = []
        elif cur:
            buf[cur].append(line)
    return "\n".join(buf[want]) if want in buf else None


def lock():
    lp = ROOT / "docs/spec.lock"
    if not lp.exists():
        return
    S, A = {}, {}
    for l in read("docs/spec.lock").split("\n"):
        p = l.split(" ")
        if p[0] == "S":
            S[p[1]] = p[2]
        if p[0] == "A":
            A[p[1] + "|" + p[2]] = (p[3], p[4])

    def hash_of(target):
        f, s = target.split("#")
        if not (ROOT / f).exists():
            return None
        t = section(f, s)
        return None if t is None else hashlib.sha256(norm(t).encode()).hexdigest()[:16]

    for t, h in S.items():
        if hash_of(t) != h:
            fail("lock: section changed or missing: " + t)
    for k, (t, h) in A.items():
        if hash_of(t) != h:
            fail("lock: stale artifact " + k)


def refactor_proof():
    """A refactor claims behaviour did not change: the PARENT's tests, unchanged, must pass against the new source."""
    import shutil
    import tempfile
    out = subprocess.run(["git", "diff", "--cached", "--name-status", "--no-renames", "HEAD"], cwd=ROOT, capture_output=True, text=True).stdout
    names = []
    for l in out.split("\n"):
        if l:
            parts = l.split("\t")
            if not parts[1].startswith("tests/"):
                names.append((parts[0][0], parts[1]))
    if not any(p.startswith("src/") for _, p in names):
        return
    tmp = tempfile.mkdtemp(prefix="gate-rf-")
    wt = os.path.join(tmp, "wt")
    env = {k: v for k, v in os.environ.items() if k not in ("GIT_INDEX_FILE", "GIT_DIR")}
    subprocess.run(["git", "worktree", "add", "--detach", "-q", wt, "HEAD"], cwd=ROOT, env=env, capture_output=True)
    try:
        for s, p in names:
            dest = pathlib.Path(wt) / p
            if s == "D":
                dest.unlink(missing_ok=True)
            else:
                dest.parent.mkdir(parents=True, exist_ok=True)
                dest.write_bytes(subprocess.run(["git", "show", ":" + p], cwd=ROOT, capture_output=True).stdout)
        env2 = dict(env, PYTHONDONTWRITEBYTECODE="1")
        r = subprocess.run([sys.executable, "-m", "pytest", "-q", "-p", "no:cacheprovider"], cwd=wt, capture_output=True, text=True, env=env2)
        if r.returncode != 0:
            fail("refactor: the parent tests fail against the new source, so this is not a refactor")
    finally:
        subprocess.run(["git", "worktree", "remove", "--force", wt], cwd=ROOT, env=env, capture_output=True)
        shutil.rmtree(tmp, ignore_errors=True)
        subprocess.run(["git", "worktree", "prune"], cwd=ROOT, env=env, capture_output=True)


def commit_msg(path):
    msg = pathlib.Path(path).read_text(encoding="utf8").split("\n")[0]
    if not re.match(r"^(feat|fix|docs|test|chore|refactor|ci|build|perf|style|revert)(\([^)]+\))?!?: \S.{6,}$", msg):
        fail("commit message is not a conventional commit")
    staged = subprocess.run(["git", "diff", "--cached", "--name-only"], cwd=ROOT, capture_output=True, text=True).stdout.split("\n")
    staged = [s for s in staged if s]
    if any(s.startswith("src/") for s in staged) and not any(s.startswith("docs/") for s in staged) and not re.search(r"\b[A-Z]{2,5}-\d{3}\b", msg) and not msg.startswith("refactor"):
        fail("co-change: a change under src/ needs a criterion id in the message or a change under docs/")
    if msg.startswith("refactor"):
        refactor_proof()


if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else ""
    arg = sys.argv[2] if len(sys.argv) > 2 else None
    if mode == "pre-commit":
        syntax()
        tests()
        open_questions()
        ratchet()
        lock()
    elif mode == "commit-msg":
        commit_msg(arg)
    elif mode == "lock":
        lock()
    elif mode == "open":
        open_questions()
    elif mode == "ratchet":
        ratchet()
    else:
        fail("unknown mode " + mode)
