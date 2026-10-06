---
layout: default
title: Substrate checklist
parent: Formulas
nav_order: 11
permalink: /formulas/substrate-checklist/
description: "The twelve items of a complete project substrate, with the day each is due and, for each, a machine-checkable definition of present and working. The target the formulas aim to produce, and the input to a conformance checker."
---

# The substrate checklist

**Status: written to the canon, not yet tested in a registered run.** This is the target that [formulas 1 and 2](/formulas/) aim to produce, stated so that a program can check it. The shell commands below were run against one small hand-built fixture project, first on a conforming version and then with planted defects, to see that each check fails when it should. They have **not** been run on any real project, and a checker built from them will produce false positives and negatives on the first real repository. Treat them as a starting definition, not a validated instrument.

## What "present and working" means

For each item there are two tests. **Present**: the artifact exists in the repository. **Working**: it does what it is for, shown by something that runs. An item that is present and not working counts as **not met**: a gate that has never been seen to fail, a hook that does not install in a fresh clone, a CI file that watches the wrong branch. That is why every gate has a **red proof**.

**The gate proof, stated once.** A gate is proven **red once** (a violation planted in a throwaway copy makes it exit non-zero) and **green in a clean clone** (a fresh `git clone`, the README's setup, the one command, exit 0). Items 5, 6, 7, 8, 10 and 11 use it. Its convention: the sentinel has a table `gate | command | runs at | red proof`, and the red proof is **one shell command** (no pipe character in the cell; for a longer plant, name a script) that, run in a throwaway clone, plants a violation and runs the gate, and exits non-zero.

## The twelve items

| # | Item | Due | Machine-checkable | Produced by |
|---|---|---|---|---|
| 1 | Sentinel that routes to files that exist | day one | yes, except "routes to the right slice" | [1](/formulas/greenfield/), [2](/formulas/adopt/) |
| 2a | Spec with requirement ids | day one | yes | 1, 2 |
| 2b | Acceptance criteria with ids, each with how it is verified | day one | yes, except that a criterion is good | 1, 2, [4](/formulas/refine/) |
| 3 | Decision records | day one | partly | 1, 2, [5](/formulas/change/) |
| 4 | Derived cascade (architecture, data model, conventions) | day one | yes, except that it is true | 1, 2 |
| 5 | Tests and at least one blocking gate, proven red once and green in a clean clone | day one | yes | 1, 2, [7](/formulas/gate/) |
| 6 | Ratchet: a measured floor that cannot go down | day one | yes, except who may edit it | 1, 2, 7 |
| 7 | Open-questions gate | day one | yes | 1, 2, 4 |
| 8 | Criteria coverage tracked | day one | yes, except that a test is good | 1, 2 |
| 9 | Atomic, descriptive, typed commits | day one | partly | 1, 2, 5 |
| 10 | Spec lock | **day 7 to 30, once there is code with ids** | yes | [8](/formulas/lock/) |
| 11 | Co-change gate | **day 7 to 30, once there is code with ids** | yes | 8 |
| 12 | Clean-clone instruction in the README | day one | yes, on one machine | 1, 2 |

"Day one" means the end of the first working day, not the first commit. Items 10 and 11 are not asked for on day one on purpose: they need criteria with ids and code that derives from them. The numbering follows the checklist the formulas were derived from; item 2 is split in two because requirement ids and criterion ids are reached at different times.

## Conventions the checks assume

These are conventions of these formulas, not canon. A project that uses other paths can still be checked by changing the variables.

- **Sentinel**: the first of `CLAUDE.md`, `AGENTS.md`, `.github/copilot-instructions.md` at the root.
- **Spec**: `docs/spec/SPEC.md` (the root, which lists the features) and `docs/spec/F-NNN-slug.md` (one per feature).
- **Ids**: requirement `F-001` (or `N-001`), written as a **heading that starts with the id**. Criterion `F-001.1`, written as a **list line (or table row) that starts with the id**, with `MUST`, `SHOULD` or `MAY` (or the Spanish `DEBE`, `DEBERÍA`, `PUEDE`) and `verified by:`. An id is never renumbered and never reused.
- **Records**: `docs/decisions/NNNN-slug.md` with the headings `Status`, `Date`, `Context`, `Decision`, `Consequences`. **Derived documents**: `docs/architecture.md`, `docs/data-model.md`, `docs/conventions.md`, each with a `Derived from:` line. **Baseline**: `docs/baseline.json`, shaped `{"floors": {...}, "ceilings": {...}}`.
- **Words in English** even in a Spanish project, because checks read them: `OPEN:`, `verified by:`, `Derived from:`, `Fresh clone`, the headings above and the table column names.

Needs `bash`, `git`, `grep`, `awk`, `sed` and `python3`; run from the repository root.

```bash
SENT=$(ls CLAUDE.md AGENTS.md .github/copilot-instructions.md 2>/dev/null | head -1)
REQ='^#{1,6} +\**[FN]-[0-9]{3}'
CRIT='^[ >|*_[xX-]*\**[FN]-[0-9]{3}\.[0-9]+'
ROOT=$PWD
```

Each check below prints nothing or exits 0 when it passes. Where a command prints lines, those lines are the failures.

---

## 1. Sentinel that routes to files that exist

**Present.** A sentinel file; it contains the tool-sequence table, the routing table and the triage block.

```bash
test -f "$SENT" \
 && grep -qiE '^\|[^|]*gate[^|]*\|[^|]*command' "$SENT" \
 && grep -qiE '^\|[^|]*topic[^|]*\|[^|]*file' "$SENT" \
 && grep -qiE 'which case it is|de qué caso se trata' "$SENT"
```

**Working.**
- Every path the sentinel names exists:

```bash
grep -oE '[A-Za-z0-9_./-]+\.(md|ya?ml|json|sh|mjs|js|ts|py)|docs/[A-Za-z0-9_./-]*' "$SENT" \
 | sed 's/[.,;:]*$//' | sort -u | while read -r p; do [ -e "$p" ] || echo "MISSING $p"; done
```

- Every Markdown file under `docs/` is reachable from the sentinel, directly or through a file it names (a directory named counts for the files under it):

```bash
python3 - "$SENT" <<'PY'
import re, sys, os
pat = re.compile(r'[A-Za-z0-9_./-]*[A-Za-z0-9_/-]')
seen, todo = set(), [sys.argv[1]]
while todo:
    f = todo.pop()
    if f in seen or not os.path.isfile(f): continue
    seen.add(f)
    if not f.endswith(('.md', '.mdc', '.txt')): continue
    for p in pat.findall(open(f, encoding='utf-8', errors='ignore').read()):
        if os.path.isdir(p):
            for r, _, fs in os.walk(p):
                todo += [os.path.join(r, x).replace('\\', '/') for x in fs]
        elif os.path.isfile(p): todo.append(p)
docs = [os.path.join(r, x).replace('\\', '/') for r, _, fs in os.walk('docs') for x in fs if x.endswith('.md')]
print('\n'.join('UNREACHABLE ' + d for d in docs if d not in seen))
PY
```

- Small enough to read whole: `[ "$(wc -l < "$SENT")" -le 300 ]` (the Field Guide holds the root at about 250 to 300 lines at most; the formulas ask for about 150).

**Not machine-checkable.** That the routing sends a cold session to the *right* slice for a task. That needs a fresh session and a judge (a stranger test); it is inferential, so run it twice. That each constraint has a real reason.

## 2a. Spec with requirement ids

**Present.** `docs/spec/SPEC.md` exists and at least one heading starts with a requirement id.

```bash
test -f docs/spec/SPEC.md && grep -hEq "$REQ" docs/spec/*.md
```

**Working.** No two feature files share an id; every feature file's id is listed in `SPEC.md`; no id is defined twice in one file.

```bash
ls docs/spec | grep -oE '^[FN]-[0-9]{3}' | sort | uniq -d
for f in docs/spec/[FN]-*.md; do [ -e "$f" ] || continue
  id=$(basename "$f" | grep -oE '^[FN]-[0-9]{3}'); grep -q "$id" docs/spec/SPEC.md || echo "NOT LISTED $id"; done
for f in docs/spec/*.md; do grep -oE "$REQ" "$f" | grep -oE '[FN]-[0-9]{3}' | sort | uniq -d; done
```

**Not machine-checkable.** That the requirements are the right ones, or complete. That the spec was ratified by the person who should.

## 2b. Acceptance criteria with ids, each with how it is verified

**Present.** At least one line starts with a criterion id.

```bash
[ "$(cat docs/spec/*.md | grep -cE "$CRIT")" -ge 1 ]
```

**Working.** Criterion ids are unique where defined (lines that carry `verified by:`); every criterion line has a modal word and a `verified by:`; every requirement has at least one criterion.

```bash
grep -hiE "$CRIT.*verified by:" docs/spec/*.md | grep -oE "$CRIT" | grep -oE '[FN]-[0-9]{3}\.[0-9]+' | sort | uniq -d
grep -hE "$CRIT" docs/spec/*.md | grep -viE 'verified by:'
grep -hE "$CRIT" docs/spec/*.md | grep -vE 'MUST|SHOULD|MAY|DEBE|DEBERÍA|PUEDE'
comm -23 <(grep -hoE "$REQ" docs/spec/*.md | grep -oE '[FN]-[0-9]{3}' | sort -u) \
         <(grep -hoE "$CRIT" docs/spec/*.md | grep -oE '[FN]-[0-9]{3}\.[0-9]+' | cut -d. -f1 | sort -u)
```

**Ratification record (present, not provable).** `docs/spec/ratifications.md` exists once any criterion has been refined (a line per id: date, id, what, reason). The file is checkable; **that a person really ratified is not**: an assistant can type a line.

**Not machine-checkable.** That a criterion is correct, testable in practice, or that a verification method named is a good one. That a person ratified.

## 3. Decision records

**Present.** At least one `docs/decisions/NNNN-slug.md`.

```bash
[ "$(ls docs/decisions/[0-9][0-9][0-9][0-9]-*.md | wc -l)" -ge 1 ]
```

**Working.** Numbers are unique; each record has the five headings; no record was ever deleted (records are superseded, not removed).

```bash
ls docs/decisions | grep -oE '^[0-9]{4}' | sort | uniq -d
for f in docs/decisions/[0-9]*.md; do for h in Status Date Context Decision Consequences; do
  grep -qiE "^(#+ *|\*+)$h" "$f" || echo "$f lacks $h"; done; done
git log --diff-filter=D --name-only --format= -- docs/decisions | grep .
```

**Not machine-checkable.** That a record carries the real *why*. That an Accepted record was not quietly rewritten (history shows edits; whether an edit changed the decision needs a reader).

## 4. Derived cascade, referenced from the sentinel

**Present and working.** `docs/architecture.md` and `docs/conventions.md` exist; `docs/data-model.md` exists or the project declares it stores nothing; each starts with a `Derived from:` line; every id it cites exists in the spec. Reachability from the sentinel is check 1.

```bash
for d in architecture conventions; do [ -f docs/$d.md ] || echo "missing $d"; done
[ -f docs/data-model.md ] || grep -qiE 'no (stored )?data|stores no data' "$SENT" docs/architecture.md || echo "no data-model and no declaration"
for f in docs/architecture.md docs/data-model.md docs/conventions.md; do [ -f $f ] || continue
  grep -qiE '^[> *_]*derived from:' $f || echo "$f: no Derived from"
  grep -hoE '[FN]-[0-9]{3}(\.[0-9]+)?' $f | sort -u | while read -r id; do grep -rqF "$id" docs/spec || echo "$f: dangling $id"; done; done
```

**Not machine-checkable.** That the documents are true of the code. (A later spec lock, item 10, covers artifacts that carry tags; documents without tags can drift.)

## 5. Tests and a blocking gate, proven red once and green in a clean clone

**Present.** A test command; at least one row in the sentinel's gate table; a hook stored in the repository and a CI workflow.

**Working.** Everything runs from a clean clone, the hook installs itself there and stops a bad commit, each gate has a red proof that fails, and CI watches the real default branch.

```bash
T=$(mktemp -d); git clone -q "$ROOT" "$T/c"
awk '/^#+ .*[Ff]resh clone/{f=1;next} f&&/^[`][`][`]/{c++;next} f&&c==1{print} c>=2{exit}' README.md > "$T/cmds.sh"
G='git -c user.name=x -c user.email=x@x'
(cd "$T/c" && sh -e "$T/cmds.sh")                                          # setup + one command: exit 0
(cd "$T/c" && { git config core.hooksPath || test -x .git/hooks/commit-msg; })   # a hook was installed
! (cd "$T/c" && $G commit --allow-empty -qm "fixed stuff")                 # a bad message is rejected
(cd "$T/c" && $G commit --allow-empty -qm "chore: probe")                  # a good one is accepted
```

Red proofs (the gate proof; the same loop serves items 6, 7, 8, 10 and 11, filtered by the row name). Each runs in a fresh clone **after** the README's setup commands (`$T/cmds.sh` from the block above), so a proof cannot "fail" merely because a dependency is missing; read the failure message of any proof that surprises you:

```bash
awk -F'|' '/^\|/ && tolower($0) ~ /red proof/ {h=1; next} h && /^\|[- |]+\|?$/ {next} h && /^\|/ {n=$2; gsub(/^ +| +$/,"",n); print n "\t" $(NF-1)} h && !/^\|/ {h=0}' "$SENT" |
while IFS=$'\t' read -r name proof; do
  proof=$(echo "$proof" | sed 's/^ *`//; s/` *$//'); R=$(mktemp -d); git clone -q "$ROOT" "$R/c" </dev/null
  if (cd "$R/c" && sh "$T/cmds.sh" >/dev/null 2>&1; sh -c "$proof") </dev/null >/dev/null 2>&1; then echo "FAIL $name: red proof did not fail"; else echo "PASS $name"; fi
done
```

CI watches the default branch (heuristic; a workflow with no branch filter passes):

```bash
BR=$(git symbolic-ref --short HEAD)
ls .github/workflows/*.y*ml >/dev/null 2>&1 || echo "no CI file"
grep -hE 'branches' .github/workflows/*.y*ml | grep -qE "\b$BR\b" || grep -L 'branches' .github/workflows/*.y*ml | grep -q . || echo "CI branch filter excludes $BR"
```

**Not machine-checkable.** That CI actually ran and was green on the server (a clone cannot show it; read the CI history). That a test proves something (that is mutation testing and live probes). That `git commit --no-verify` is stopped: only a check on the shared branch does that, and branch protection is a server setting.

## 6. Ratchet: a measured floor that cannot go down

**Present.** `docs/baseline.json` parses and holds at least one number; a row of the gate table checks it.

```bash
python3 -c 'import json; b=json.load(open("docs/baseline.json")); assert any(isinstance(v,(int,float)) for d in (b.get("floors",{}),b.get("ceilings",{})) for v in d.values())'
grep -qiE '^\|.*(ratchet|baseline|floor).*\|' "$SENT"
```

**Working.** The row's red proof fails (the gate proof above, rows matching `ratchet|baseline|floor`). The file never went the wrong way in history: floors never fell, ceilings never rose.

```bash
python3 - <<'PY'
import json, subprocess
revs = subprocess.run(['git','log','--format=%H','--reverse','--','docs/baseline.json'],capture_output=True,text=True).stdout.split()
prev = None
for r in revs:
    s = subprocess.run(['git','show',f'{r}:docs/baseline.json'],capture_output=True,text=True).stdout
    try: b = json.loads(s)
    except Exception: print('unparseable at', r[:7]); continue
    if prev:
        for k, v in b.get('floors', {}).items():
            if k in prev.get('floors', {}) and v < prev['floors'][k]: print('floor fell', k, r[:7])
        for k, v in b.get('ceilings', {}).items():
            if k in prev.get('ceilings', {}) and v > prev['ceilings'][k]: print('ceiling rose', k, r[:7])
    prev = b
PY
grep -qs baseline CODEOWNERS .github/CODEOWNERS docs/CODEOWNERS     # the file is under an owner
```

**Not machine-checkable.** That the executor cannot edit the baseline: CODEOWNERS only helps if branch protection requires the owner's review, which is a server setting. Whether the measured numbers are the ones that matter.

## 7. Open-questions gate

**Present.** A row of the gate table for open questions, and the command it names.

```bash
grep -qiE '^\|.*open.*\|' "$SENT"
```

**Working.** Its red proof fails (gate proof, rows matching `open`). "Ready to implement" is a separate state: `! grep -rn 'OPEN:' docs/spec` is true. In an adoption the gate may be advisory while `OPEN:` lines remain; it is working when its red proof fails, and the project is ready to implement only at zero.

**Not machine-checkable.** That no implementation depends on a question that was resolved by deleting the marker instead of deciding. A resolved question should leave a record (item 3).

## 8. Criteria coverage tracked

**Present.** A command, named in the gate table, that prints `criteria coverage: N/M`.

**Working.** It prints that line; `M` equals the number of criterion ids defined; `N` equals the number of those cited in at least one test file; no test cites an id the spec does not define (an orphan).

```bash
CMD=$(awk -F'|' '/^\|/ && tolower($2) ~ /coverage/ {print $3}' "$SENT" | head -1 | sed 's/^ *`//; s/` *$//')
OUT=$(sh -c "$CMD" 2>&1); echo "$OUT" | grep -E 'criteria coverage: [0-9]+/[0-9]+'
TESTS=$(git ls-files | grep -vE '^docs/' | grep -iE '(^|/)(tests?|__tests__|spec)/|\.(test|spec)\.|_test\.')
IDS=$(grep -hiE "$CRIT.*verified by:" docs/spec/*.md | grep -oE "$CRIT" | grep -oE '[FN]-[0-9]{3}\.[0-9]+' | sort -u)
M=$(echo "$IDS" | wc -l); N=0; for id in $IDS; do grep -qE "$id([^0-9]|$)" $TESTS && N=$((N+1)); done
[ "$OUT" = "criteria coverage: $N/$M" ] || echo "printed [$OUT], recomputed $N/$M"
grep -hoE '[FN]-[0-9]{3}\.[0-9]+' $TESTS | sort -u | while read -r id; do echo "$IDS" | grep -qxF "$id" || echo "orphan $id"; done
```

The `TESTS` pattern is a heuristic for where tests live; adjust it. **Not machine-checkable.** That a tagged test is a good test: coverage counts that a check exists, not that it is strong.

## 9. Atomic, descriptive, typed commits

**Present.** A commit-msg hook stored in the repository (checked in item 5).

**Working.** Every commit since the substrate started has a typed subject; the hook rejects a bad message in a clean clone (item 5). Adoption: replace `git log` with `git log BASE..HEAD` in both commands below, where `BASE` is the commit the formula printed at its start (the history before it will not conform).

```bash
RE='^(feat|fix|docs|test|refactor|chore|ci|perf|style|build)(\([^)]+\))?!?: .{1,72}$'
git log --format=%s | grep -vE "$RE"
git log --shortstat --format='%h %s' | awk '/^[0-9a-f]{7} /{h=$0} /files? changed/{if ($1>25) print "LARGE " h " (" $1 " files)"}'
```

The second command is a heuristic for "atomic": it reports large commits and does not fail them. **Not machine-checkable.** That a commit is one change; that its message says *why*; that it names the right id.

## 10. Spec lock (day 7 to 30, once there is code with ids)

**Present.** `docs/spec.lock`; `@gs <id> <spec-path>#<section>` tags in tests or sources (`git grep -l '@gs '`); a row of the gate table for the lock check and one for the orphan check.

**Working.** Four red proofs fail, rows matching `lock|orphan`: edit a criterion after its artifact was tagged (stale); cite an id that does not exist (orphan); a lock behind the spec; a tag the lock does not know. Tags are inert: tests and type check give the same results on the commit before tagging and after (a one-time comparison).

**Not machine-checkable.** That a tagged file really implements the rule (a tag can lie by omission; the lock says which version it was derived against). That an agent did not run the ratify command: the enforcement is a person's review of `docs/spec/ratifications.md` on a protected branch.

Status of the mechanism itself: design, built once on one sample project (see [coherence](/method/coherence/)). There is no reference implementation in this repository.

## 11. Co-change gate (day 7 to 30, once there is code with ids)

**Present.** A check in the commit-msg hook or in CI, and a row of the gate table for it.

**Working.** Its red proofs fail, rows matching `co-change`: a commit that changes source with no id cited, no spec change and no `refactor:` type; a `refactor:` commit whose parent's tests fail against the new source. In a clean clone with the hook installed, `fix: tweak` over a source change is rejected.

**Not machine-checkable.** That a change declared a refactor is not a behavior change at an edge no test pins (add a criterion and a test there).

## 12. Clean-clone instruction in the README

**Present.** The README has a heading containing `Fresh clone` followed by one fenced block of commands.

```bash
awk '/^#+ .*[Ff]resh clone/{f=1;next} f&&/^[`][`][`]/{c++;next} f&&c==1{print} c>=2{exit}' README.md | grep -q .
```

**Working.** Run exactly those lines in a fresh clone: exit 0 (the first command of item 5).

**Not machine-checkable.** That it works on another operating system or machine, with other installed tools. A container is a better test than your own machine, and still not "the target OS".

---

## What no program can check

Collected, so nobody mistakes a green checker for the whole job:

- **Ratification.** That a person accepted the criteria, the changes and the decisions.
- **Correctness of the spec.** A checker sees that intent is written, not that it is right.
- **Routing quality.** That a cold session finds the right slice (needs a fresh session and a judge; run twice).
- **Test quality.** That tagged tests prove anything (mutation testing and live probes address it).
- **Decision and commit quality.** That a record carries the why, that a commit is one change.
- **Server-side enforcement.** Branch protection, required review, that CI ran: settings on a server a clone cannot see.
- **Anything an agent can fake with a file.** A ratification line, a `PRESENT` row, a marker in a message.

## Machine-readable form

For a conformance checker. `machine`: `full` the item's present and working tests can run without a person; `partial` some tests need a person.

```yaml
substrate_checklist:
  version: 1
  rubric_link: https://genspec.dev/formulas/substrate-checklist/
  gate_proof: "red once (planted violation exits non-zero in a throwaway clone) and green in a clean clone (setup + one command exits 0)"
  items:
    - {id: "1",  name: sentinel-routes,        due: day1,    machine: partial, human_only: [routes to the right slice, reason for each constraint]}
    - {id: "2a", name: requirement-ids,        due: day1,    machine: full,    human_only: [requirements are right, ratified]}
    - {id: "2b", name: criterion-ids-verified, due: day1,    machine: full,    human_only: [criterion is good, ratified]}
    - {id: "3",  name: decision-records,       due: day1,    machine: partial, human_only: [carries the why, no silent rewrite]}
    - {id: "4",  name: derived-cascade,        due: day1,    machine: full,    human_only: [documents are true of the code]}
    - {id: "5",  name: tests-and-blocking-gate, due: day1,   machine: full,    human_only: [CI green on the server, test quality, --no-verify]}
    - {id: "6",  name: ratchet,                due: day1,    machine: full,    human_only: [executor cannot edit baseline (server), right numbers]}
    - {id: "7",  name: open-questions-gate,    due: day1,    machine: full,    human_only: [no marker deleted instead of decided]}
    - {id: "8",  name: criteria-coverage,      due: day1,    machine: full,    human_only: [tagged test is a good test]}
    - {id: "9",  name: typed-atomic-commits,   due: day1,    machine: partial, human_only: [atomic, says why, names right id]}
    - {id: "10", name: spec-lock,              due: day7-30, machine: full,    human_only: [tag does not lie, ratify run by a person]}
    - {id: "11", name: co-change-gate,         due: day7-30, machine: full,    human_only: [refactor hides no unpinned behavior change]}
    - {id: "12", name: readme-clean-clone,     due: day1,    machine: full,    human_only: [works on another OS or machine]}
```

## Known limits

- **Not validated.** The commands were tried on one fixture with planted defects. They carry assumptions (paths, id grammar, English tokens, a `tests/` folder, bash and GNU tools) that a real project will break.
- **Presence is easy to fake and "working" is only as strong as its red proof.** A red proof that plants a trivial violation proves the gate runs, not that it guards what matters.
- **The checklist asks for form, not value.** A project can pass every item with a thin spec. It tells you the substrate is in the condition a stateless reader needs, not that the software is right.
- **Day one is a target, not a finding.** Nothing here says how often projects reach it, or that reaching it changes defects.
- **Item 10 and 11 describe a design** with no reference implementation here.
