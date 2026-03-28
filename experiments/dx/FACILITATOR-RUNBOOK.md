# DX Experiment — Facilitator Runbook

## Pre-Session Checklist (day before)
- [ ] Fork collection form ready (Google Form or similar)
- [ ] Both workshop repos confirmed public: gs-workshop-base, gs-workshop-kanban
- [ ] Score script tested: `node score-fork.js <test-fork-url> base`
- [ ] Group A/B assignment list prepared (random, ~35 each)
- [ ] START-*.md files distributed to participants by group

## Session Day
- Group A gets: START-TASKFLOW-A.md (or START-VAQUITA-A.md for greenfield)
- Group B gets: START-TASKFLOW-B.md (or START-VAQUITA-B.md for greenfield)
- Collect fork URLs at session end via form
- Do NOT score during session

## Post-Session Scoring (bulk)
Run against all collected fork URLs:
```bash
node score-fork.js https://github.com/participant/gs-workshop-base base >> results-base.jsonl
node score-fork.js https://github.com/participant/gs-workshop-kanban kanban >> results-kanban.jsonl
```
Then aggregate:
```bash
node aggregate-results.js results-base.jsonl results-kanban.jsonl
```

## Contingency
- Fork fails to clone: mark as "submission error," exclude from scoring
- GitHub unavailable: collect zip archives, score from local path
- Participant on Windows: scoring script is cross-platform, no action needed
- Zero tests in fork: Verifiable = 0 automatically (not facilitator's call)

## What to Watch During Session
- Interventions: log any participant who asks for help (note group and nature)
- Blind evaluators: do not identify group membership during scoring
- Dual rubric: GS rubric runs automated; external quality battery runs manually post-session
