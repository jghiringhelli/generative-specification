---
layout: default
title: Post-Hardening
parent: Workflow Recipes
nav_order: 8
description: "Prepare for release or deployment after the hardening cycle completes"
---

# Post-Hardening

**Scenario**: Loop 3 is complete. `start_hardening` generated the hardening session prompt. You have worked through it. Now prepare for release.

---

## Step 1 — Verify all hardening gates pass

```
forgecraft_actions({
  action: "check_cascade",
  project_dir: "/path/to/your-project"
})
```

Cascade must pass cleanly. Then run the full audit:

```
forgecraft_actions({
  action: "audit_project",
  project_dir: "/path/to/your-project"
})
```

Zero blockers required before proceeding.

---

## Step 2 — Verify smoke tests

The hardening session prompt generated Playwright (API) or node-pty (CLI) smoke tests. Run them:

```bash
npx playwright test
# or
npx vitest run tests/smoke/
```

All smoke tests must pass. These test the system as a deployed artifact, not as unit-isolated components.

---

## Step 3 — Check security baseline

Run the security gates that apply to your tags:

```bash
npm audit --audit-level=high    # UNIVERSAL: no high/critical CVEs
npx secretlint .                 # UNIVERSAL: no secrets in source
```

For API projects:
```bash
# Verify security headers in smoke test responses
# Verify rate limiting is active
# Verify auth is required on protected endpoints
```

---

## Step 4 — Verify production readiness

| Check | How |
|---|---|
| Environment config complete | `forgecraft.yaml` lists all required env vars; CI has them all |
| No debug code | Search for `console.log`, `debugger`, `TODO` in `src/` |
| Error messages safe | Production errors don't leak stack traces or internal paths |
| Graceful shutdown | SIGTERM handler tested in integration test |
| Health endpoint | `GET /health` returns 200 with status JSON |

---

## Step 5 — Update the changelog

```markdown
## [1.0.0] - YYYY-MM-DD

### Added
- [list features from PRD goals]

### Changed
- [list breaking changes if major version]

### Fixed
- [list bugs fixed during hardening]
```

Follow [Keep a Changelog](https://keepachangelog.com/) format.

---

## Step 6 — Tag the release

```bash
git tag -a v1.0.0 -m "Release 1.0.0 — [brief description]"
git push origin main --tags
```

For a library: publish to npm/PyPI.
For an API: trigger the production deployment pipeline.
For a CLI: publish binary artifacts.

---

## Step 7 — Post-deployment verification (API/service)

After deploying to production:

1. Run smoke tests against the production URL
2. Check health endpoint: `curl https://your-api.com/health`
3. Monitor error rate for 15 minutes: should be at baseline
4. Verify at least one end-to-end user journey works

If any check fails, roll back immediately. A deployed version with a failing smoke test is a production incident in progress.

---

## Hardening → Release Checklist

- [ ] `check_cascade` passes
- [ ] `audit_project` passes
- [ ] All smoke tests pass
- [ ] `npm audit` — no high/critical CVEs
- [ ] No secrets in source (`secretlint`)
- [ ] No TODOs or debug code in `src/`
- [ ] `CHANGELOG.md` updated
- [ ] Version bumped in `package.json`
- [ ] Git tag created and pushed
- [ ] Post-deploy smoke test passing

A release is not done until every item is checked.
