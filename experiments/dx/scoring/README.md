---
nav_exclude: true
---

# DX Scoring Automation

Scripts for scoring participant fork submissions for the DX experiment.

---

## Usage

### Score a single fork

```bash
# Prerequisites: git, node, npm
node score-fork.js <github-fork-url> <task> [--json]

# task: "base" or "kanban"
# Examples:
node score-fork.js https://github.com/participant1/gs-workshop-base base
node score-fork.js https://github.com/participant1/gs-workshop-kanban kanban --json
```

The script:
1. Clones the fork into a temp directory
2. Runs all automated checks
3. Outputs a score (console + score-{timestamp}.json)

### Score with live server (for Composable check)

The feature endpoint shape check (3pts) requires the server to be running:

```bash
# Start the server in another terminal
npm run dev

# Then score with server flag
SCORE_WITH_SERVER=1 TEST_TOKEN=<jwt> node score-fork.js <url> <task>
```

---

## Scoring Rubric

| Check | Property | Points | Automated? |
|---|---|---|---|
| `npm test` passes (≥ 0 failures) | Verifiable | 2 | ✅ |
| Zero `prisma.*` in `src/routes/` | Bounded | 2 | ✅ |
| `CLAUDE.md` exists in repo root | Self-describing | 1 | ✅ |
| ADR directory exists | Auditable | 1 | ✅ |
| ≥ 50% conventional commits | Auditable | 1 | ✅ |
| Feature endpoint correct JSON shape | Composable | 3 | ✅ (needs server) |
| **Total** | | **10** | |

Observer-scored bonuses (not automated):
- `$transaction` in status endpoint (kanban): +1
- Membership check before comments (kanban): +1
- Error middleware: +1
- Zero `console.log` in routes: +1

---

## Aggregating Results (post-April 2026)

After collecting fork URLs from all participants:

```bash
# Score all base forks
for url in $(cat pilot/fork-urls-base.txt); do
  node score-fork.js "$url" base --json >> results/base-scores.jsonl
done

# Score all kanban forks
for url in $(cat pilot/fork-urls-kanban.txt); do
  node score-fork.js "$url" kanban --json >> results/kanban-scores.jsonl
done
```

Results are committed to `experiments/dx/results/` after the April 2026 session.
