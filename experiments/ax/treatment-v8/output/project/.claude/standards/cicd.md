<!-- ForgeCraft sentinel: cicd | 2026-06-04 | npx forgecraft-mcp refresh . --apply to update -->

## Dev Environment Hygiene
- VS Code: `code --list-extensions | grep -i <name>` before install; skip if in-range. Never install unconditionally in scripts.
- Docker: `docker ps -a --filter name=<service>` before create — reuse if exists. Prefer `docker compose up` over `docker run`. One Compose file per project.
- Docker: `docker system prune -f` periodically; container logs < 500 MB total.
- Data volumes: before writing >100 MB, ask retention. Synthetic data >7 days with no code ref: ask to delete.
- Python: one `.venv` per project root or standalone package — never more. Check `.venv/` + `python --version` before creating; recreate only on major mismatch.
- Before any install: check installed version, skip if in-range.
- If project dir usage (excluding `node_modules/`, `.venv/`, `dist/`, `.next/`) > 2 GB: warn and ask before generating files.

## CI/CD & Deployment
- Pipeline on push: lint → type-check → unit → build → integration. On main: + security scan → staging → smoke → promote. < 10 min (parallelize, cache). Failed pipeline blocks merge.
- Three environments min: development (local), staging (faithful prod replica), production. Same artifact, injected config.
- Default rolling deploy with health checks; blue-green/canary for critical services with auto-rollback on error spike.
- Tag every deploy with git SHA; rollback = redeploy prior SHA. One command/button — no manual runbooks.
- PRs get ephemeral preview deploys where feasible (Vercel, Netlify, Railway); preview URL in PR comment.

## Commit Protocol
- Conventional commits: `feat|fix|refactor|docs|test|chore(scope): description`.
- A commit must pass: compilation, lint, tests, coverage gate, mutation gate (Stryker on changed modules), anti-pattern scan.
- Atomic — one logical change per commit. Never combine a behavior change with a refactor.
- Commit BEFORE any risky refactor. Update Status.md at end of every session.

### One logical change =
feature+tests · behavior-preserving refactor · spec change + its code change · bug fix + repro test.

### Message precision
- ❌ `fix bug` — not queryable.
- ✅ `fix(auth): reject expired tokens at middleware boundary before service invocation`
Commit history is episodic memory the AI reads in future sessions; `wip`/`changes` are not.

### Emit, Don't Reference (P0/P1)
Hooks (`.husky/pre-commit`, `.husky/commit-msg`, `commitlint.config.js`), linter config (`.eslintrc.json`/`ruff.toml`/`.golangci.yaml` for this stack), and `.github/workflows/ci.yml` must be written to disk as fenced code blocks in the first response — not referenced in prose. If the file is not on disk, the gate does not exist. The hook stack emits these configs in P0/P1.
- CI steps: checkout → install → type-check → lint → test --coverage → mutation gate (`stryker run`/`mutmut run`/`pitest`). The mutation gate is non-negotiable — it verifies test quality, not just execution.
