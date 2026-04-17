# EX — Executable Sprint: Full GS Tier Proof on RealWorld Conduit

**Date**: April 17, 2026  
**Duration**: Single session (~8 hours)  
**Benchmark**: [RealWorld Conduit](https://github.com/gothinkster/realworld) — TypeScript/Express/Prisma/PostgreSQL  
**Deployment**: Railway (managed PostgreSQL, production Docker image)  
**Tooling**: [ForgeCraft MCP](https://github.com/jghiringhelli/forgecraft-mcp)

---

## What This Experiment Proves

EX demonstrates all four GS tiers on a **publicly recognized benchmark** — the RealWorld Conduit API — using the ForgeCraft Executable Sprint toolchain:

| Tier | Layer | Evidence |
|---|---|---|
| **L1** | Specification artifacts | PRD, use-cases (UC-001–UC-008), 4 ADRs, C4 diagrams, CLAUDE.md |
| **L2** | Behavioral contracts | 13 hurl probes, 1,013 assertions — 13/13 passing against Railway |
| **L3** | Environment probes | 3 bash probes (health+DB, JWT round-trip, env-vars) — 3/3 passing |
| **L4** | SLO / load test | k6 ramp: 10 VUs sustained × 3 min — p95=350ms, errors=0.04% |

All four tiers verified **against the live production deployment on Railway** — not localhost.

---

## Results at a Glance

```
L2 — Behavioral:   13/13 probes PASS  (1,013 assertions, ~24s total)
L3 — Environment:  3/3  probes PASS   (health DB connected, JWT configured, env-vars)
L4 — SLO ramp:     6/6  thresholds GREEN
  p95 overall:  350ms  (limit: 2000ms)
  p99 overall:  720ms  (limit: 4000ms)
  read p95:     181ms  (limit: 1000ms)
  write p95:    401ms  (limit: 2000ms)
  error rate:   0.04%  (limit: 1%)
  sustained:    10 VUs (limit: 10)
```

---

## Directory Structure

```
ex/
├── README.md           ← this file
├── spec/               ← L1 specification artifacts
│   ├── PRD.md
│   ├── use-cases.md
│   ├── CLAUDE.md
│   ├── adrs/           ← ADR-001 through ADR-004
│   └── diagrams/       ← C4 context + container (Mermaid)
├── harness/            ← L2/L3/L4 probe files
│   ├── *.hurl          ← behavioral probes (hurl HTTP assertions)
│   ├── hurl.env        ← target URL config
│   ├── slo-ramp.k6.js  ← L4 k6 ramp scenario
│   ├── env/            ← L3 bash probes
│   └── specs/          ← .forgecraft env/slo YAML contracts
├── evidence/           ← machine-readable run results
│   ├── harness-run.json     ← L2: 13/13 pass, 2026-04-17T20:30:31Z
│   ├── env-probe-run.json   ← L3: 3/3 pass, 2026-04-17T23:01:27Z
│   └── slo-ramp-summary.json ← L4: all thresholds green
└── project/            ← full Conduit source code
    ├── src/            ← TypeScript source (hexagonal architecture)
    ├── prisma/         ← schema + migrations
    ├── tests/          ← Jest unit tests + harness probes
    ├── Dockerfile      ← multi-stage Alpine build
    └── package.json
```

---

## Reproducing This Experiment

### Prerequisites

- Node 18+, Docker, [hurl](https://hurl.dev), [k6](https://k6.io)
- Railway CLI (`npm install -g @railway/cli`) + account
- PostgreSQL (Railway managed or local)

### 1 — Deploy to Railway

```bash
cd project
railway login
railway init
railway add --name conduit-db --plugin postgresql
railway up --service conduit-api
```

Set env vars in Railway dashboard:
- `DATABASE_URL` — auto-linked from the PostgreSQL plugin
- `JWT_SECRET` — any strong secret (e.g. `openssl rand -hex 32`)
- `NODE_ENV=production`

### 2 — Run L2 behavioral probes

```bash
cd harness
API_URL=https://<your-railway-url> hurl --variables-file hurl.env \
  --variable host=https://<your-railway-url> \
  *.hurl --test
```

Expected: 13/13 files pass, 1,013 assertions.

### 3 — Run L3 environment probes

```bash
cd harness/env
API_URL=https://<your-railway-url> bash health.sh
API_URL=https://<your-railway-url> bash jwt.sh
bash env-vars.sh  # skips gracefully outside deployment context
```

### 4 — Run L4 SLO ramp

```bash
cd harness
k6 run --env API_URL=https://<your-railway-url> slo-ramp.k6.js
```

Expected: all thresholds green (p95<2000ms, errors<1%).

---

## Implementation Notes

The Conduit implementation required 15 bug fixes during the session to achieve full compliance with the RealWorld API spec. The key fixes were:

1. **Error contract**: each error class owns its `toJSON()` shape — `{ errors: { <field>: ["message"] } }`
2. **Null semantics**: `bio`/`image` use `value || null` not `value ?? null` (empty string → null)
3. **articlesCount**: separate `countAll()`/`countFeed()` queries, not page-count
4. **ConflictError**: 409 status for duplicate username/email (not 422)
5. **Rate limiting**: disabled in non-production; raised to 500/min in production
6. **Prisma on Alpine**: `binaryTargets = ["native", "linux-musl-openssl-3.0.x"]` + `apk add openssl`
7. **JWT middleware**: error message `"is missing"` not `"Authorization header missing"`

All fixes are reflected in `project/CLAUDE.md` (the architectural constitution) and `spec/adrs/`.

---

## ForgeCraft Toolchain

The Executable Sprint was driven by ForgeCraft MCP actions:

| Action | Role |
|---|---|
| `generate_harness` | Scaffolds hurl probes from use-cases |
| `run_harness` | Executes hurl probes, writes harness-run.json |
| `generate_env_probe` | Scaffolds bash probes from .forgecraft/env/ specs |
| `run_env_probe` | Executes bash probes, writes env-probe-run.json |
| `generate_slo_probe` | Scaffolds k6 scenario from .forgecraft/slo/ spec |
| `run_slo_probe` | Executes k6 ramp, reports threshold results |
| `layer_status` | Shows L1–L4 coverage picture |
| `close_cycle` | Evaluates all gates — returns READY when all tiers pass |

Source: [github.com/jghiringhelli/forgecraft-mcp](https://github.com/jghiringhelli/forgecraft-mcp)
