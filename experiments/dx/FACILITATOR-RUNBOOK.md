---
nav_exclude: true
---

# DX Experiment — Facilitator Runbook

## Workshop Repos

**Greenfield (vaquita):** `https://github.com/pragma-works/gs-workshop-vaquita`
- Task: Build a Tanda/Vaquita rotating savings group REST API from spec
- Group A: Free prompting — hand out `README.md` (Group A section)
- Group B: ForgeCraft GS workflow — hand out `README.md` (Group B section)

**Brownfield (taskflow):** `https://github.com/pragma-works/gs-workshop-taskflow`
- Task: Add Activity Feed to a deliberately flawed Kanban API
- Group A: Structured prompt cards — hand out `README.md` (Group A section)
- Group B: ForgeCraft GS workflow — hand out `README.md` (Group B section)

Participants use `START.md` as their quick reference during the session.

---

## Pre-Session Checklist (day before)

- [ ] Both workshop repos public and cloneable without auth (test: `git clone https://github.com/pragma-works/gs-workshop-vaquita`)
- [ ] All participants added as collaborators: `npm run workshop:add-collaborators`
- [ ] Participant IDs assigned (P001–P070); sign-in sheet ready with ID pre-printed per seat
- [ ] Group A/B assignment list prepared (random, ~35 each)
- [ ] Confirm GH Actions work: push a test commit to `participant/P000-test-branch`, confirm `score.json` appears within 2 minutes
- [ ] Run Group 0 simulation (see below) to verify end-to-end scoring
- [ ] Dashboard running: `npm run dashboard` in argos_automation

---

## Session Day

1. Direct participants to their seat (ID pre-assigned)
2. They clone the canonical repo and create their branch — instructions in `START.md`:
   ```bash
   git clone https://github.com/pragma-works/gs-workshop-vaquita
   cd gs-workshop-vaquita
   git checkout -b participant/PXXX    # PXXX = their ID from the sheet
   git push -u origin participant/PXXX
   ```
3. Hand out the correct `README.md` section (printed or projected by group)
4. Do NOT score during session — GH Actions handles automated scoring on each push

---

## Post-Session Scoring

Scoring runs automatically via GitHub Actions on every participant push.
After the session ends, collect remaining scores:

```bash
cd C:\workspace\argos\argos_automation

# Score a single participant manually (if Actions didn't run or for ad-hoc checks):
npm run score-live -- https://github.com/pragma-works/gs-workshop-vaquita participant/PXXX

# Collect all automated scores from GitHub Actions artifacts:
npm run collect-scores

# Run quality metrics (verbosity + structural erosion) on a participant:
npm run measure-quality -- https://github.com/pragma-works/gs-workshop-vaquita participant/PXXX
```

The dashboard at `http://localhost:3000` shows live results.

---

## Group 0 — Simulation (run before the event)

Run these four conditions yourself using P000 participant IDs to verify the full pipeline:

```bash
# Vaquita — Group A (control)
git clone https://github.com/pragma-works/gs-workshop-vaquita vaquita-p000a
cd vaquita-p000a && git checkout -b participant/P000-vaquita-a && git push -u origin participant/P000-vaquita-a
# <do the work> then push

# Vaquita — Group B (treatment)
git clone https://github.com/pragma-works/gs-workshop-vaquita vaquita-p000b
cd vaquita-p000b && git checkout -b participant/P000-vaquita-b && git push -u origin participant/P000-vaquita-b

# Taskflow — Group A (control)
git clone https://github.com/pragma-works/gs-workshop-taskflow taskflow-p000a
cd taskflow-p000a && git checkout -b participant/P000-taskflow-a && git push -u origin participant/P000-taskflow-a

# Taskflow — Group B (treatment)
git clone https://github.com/pragma-works/gs-workshop-taskflow taskflow-p000b
cd taskflow-p000b && git checkout -b participant/P000-taskflow-b && git push -u origin participant/P000-taskflow-b
```

Score each after pushing:
```bash
npm run score-live -- https://github.com/pragma-works/gs-workshop-vaquita participant/P000-vaquita-a
npm run score-live -- https://github.com/pragma-works/gs-workshop-vaquita participant/P000-vaquita-b
npm run score-live -- https://github.com/pragma-works/gs-workshop-taskflow participant/P000-taskflow-a
npm run score-live -- https://github.com/pragma-works/gs-workshop-taskflow participant/P000-taskflow-b
```

---

## Contingency

- Participant can't push: confirm collaborator access was added (`workshop:add-collaborators`); as fallback, collect zip archive and score from local path
- GitHub unavailable: collect zip archives — `npm run score-live -- /path/to/local/dir`
- Participant on Windows: scoring script is cross-platform, no action needed
- Zero tests in branch: Verifiable = 0 automatically (not facilitator's call)
- Actions didn't run: run `npm run score-live` manually with the branch URL

---

## What to Watch During Session

- Interventions: log any participant who asks for help (note group + nature)
- Blind evaluators: do not identify group membership during scoring
- Dual rubric: GS rubric runs via Actions; quality battery (`measure-quality`) runs post-session
