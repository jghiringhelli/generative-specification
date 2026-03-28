# DX Experiment — Facilitator Runbook

## Pre-Session Checklist (day before)
- [ ] Fork collection form ready (Google Form or similar)
- [ ] Both workshop repos confirmed public: gs-workshop-vaquita, gs-workshop-taskflow
- [ ] Score script tested: `node score-fork.js <test-fork-url> vaquita`
- [ ] Group A/B assignment list prepared (random, ~35 each)
- [ ] START-*.md files distributed to participants by group

## Workshop Repos

**Greenfield (vaquita):** `https://github.com/jghiringhelli/gs-workshop-vaquita`
- Audience: Individual developers, Mexican dev community
- Task: Build a Tanda/Vaquita rotating savings group REST API from spec
- Group A: Free prompting (START-VAQUITA-A.md)
- Group B: ForgeCraft GS workflow (START-VAQUITA-B.md)

**Brownfield (taskflow):** `https://github.com/jghiringhelli/gs-workshop-taskflow`
- Audience: Teams, any audience
- Task: Add Activity Feed to a deliberately flawed Kanban API; fix atomic status transitions
- Group A: Structured prompt cards (START-TASKFLOW-A.md)
- Group B: ForgeCraft GS workflow (START-TASKFLOW-B.md)

Canonical participant instructions live in `C:\workspace\jc-dx-experiment\`.

## Session Day
- Group A gets: START-TASKFLOW-A.md (or START-VAQUITA-A.md for greenfield)
- Group B gets: START-TASKFLOW-B.md (or START-VAQUITA-B.md for greenfield)
- Collect fork URLs at session end via form
- Do NOT score during session

## Post-Session Scoring (bulk)
Run against all collected fork URLs:
```bash
node score-fork.js https://github.com/participant/gs-workshop-vaquita vaquita >> results-vaquita.jsonl
node score-fork.js https://github.com/participant/gs-workshop-taskflow taskflow >> results-taskflow.jsonl
```
Then aggregate:
```bash
node aggregate-results.js results-vaquita.jsonl results-taskflow.jsonl
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
