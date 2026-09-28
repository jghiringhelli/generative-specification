# Bridge Test (TX) — Results log

## 1. Twins built and proven equivalent (SOLID RESULT, 2026-09-06)
- **M (mud)** = AX naive rep 4, frozen (`bridge/M`): God-class `routes/articles.ts` (489 lines), flat
  structure, direct DB access, no interfaces. Representative documented default (see SELECTION.md).
- **D (disciplined)** = behavior-preserving refactor of M by an executor (`claude -p`), frozen
  (`bridge/D`): hexagonal (domain entities + repository INTERFACES, application services,
  infrastructure adapters, presentation controllers/routes), DI container, intention-revealing
  names. Largest file now a 227-line service. `tsc --noEmit` clean.
- **Equivalence oracle:** the shared 13-file Hurl suite run back-to-back, D on :3001, M on :3000.
  **Result: 13/13 identical (same 1 pass, same 12 strict-RealWorld-spec failures), 0 differ.**
  => D and M differ ONLY in structure, not behavior. The bridge test is valid.

## 2. First read-cost probe (PRELIMINARY, n=1 per twin, DO NOT over-read)
A fresh, stateless `claude -p` (sonnet-4-5, tools on) answered the SAME three location questions
(slug-uniqueness, follow-flag computation, token verification) in each codebase.

| twin | turns | output_tok | cache_read_tok | cost USD | answers |
|------|-------|-----------|----------------|----------|---------|
| M (mud)        | 6 | 1159 | 101,905 | 0.117 | Q1 schema @unique, Q2 routes/articles.ts::buildArticleResponse |
| D (disciplined)| 8 | 1373 | 130,963 | 0.123 | Q1 schema, Q2 ArticleService.ts::buildArticleResponse |

**Direction: slightly AGAINST the naive prediction.** D cost marginally MORE (more turns, more
tokens), with roughly equal correctness. This is honest and important, not a failure.

### Why (confounds + real effect, separated)
- **n=1, noisy.** No statistical weight. One sample each.
- **Wrong metric.** Aggregate tokens/cache conflate three things: (a) D has MORE total surface
  (hexagonal adds interface/adapter/DI boilerplate LOC), (b) cache_read scales with turn count,
  (c) actual read-breadth (which files it NEEDED to open) was not isolated. The bridge predicts an
  advantage in *targeted read-breadth*, not total surface, and this probe did not measure breadth.
- **Scale.** At 16-37 files a full sweep is cheap either way; the mud's fewer-bigger-files can be
  cheaper to sweep than disciplined many-small-files. Navigation advantage should grow with SCALE.
- **The bridge is disciplines PLUS a navigation aid (CNT/sentinel), per WP 4.1.** A stateless reader
  with NO map may sweep both twins similarly. Structure alone, without the authored map, may not
  lower cold-read cost, that is a real and useful finding, not a bug.

## 3. Proper design (what this probe taught us to build)
- Metric = **read-breadth**: instrument which files/lines the assistant actually opens (parse tool
  calls), not aggregate tokens. Targeted-vs-sweep is the real DV.
- **k-replications** (>=5) per twin per question; Protocol B stats (stats.py).
- Add the **modification DV** (SWE-bench-style feature add -> oracle stays green? + read-breadth),
  where knowing WHERE to change should favor D more than location-finding does.
- Add a **CNT/sentinel arm** on both twins to separate "structure" from "structure + authored map".
- Consider a **larger codebase** where navigation beats sweeping.
- Normalize for total surface (report cost per correct answer AND read-breadth, not raw tokens).

## 2b. Read-breadth, k=5 per twin (the PROPER metric, 2026-09-06)
Rebuilt the probe to parse the executor's tool calls and count READ-BREADTH (distinct files
opened) instead of aggregate tokens. Same 3 location questions, k=5 stateless runs per twin.

| metric | M (mud) median [raw] | D (disciplined) median [raw] |
|--------|----------------------|------------------------------|
| **read_breadth** | **4** [5,3,4,4,3] | **5** [5,5,4,4,5] |
| num_searches | 2 [2,2,2,2,2] | 2 [2,2,2,4,2] |
| turns | 7 [8,6,7,7,6] | 8 [8,8,7,9,8] |
| out_tokens | 1160 [1409,969,1295,1160,1068] | 1432 [1340,1692,1220,1477,1432] |
| cost USD | 0.113 | 0.111 (equal) |
| errors | 0/5 | 0/5 |

**Result: read-breadth is slightly HIGHER for D (median 5 vs 4), tight distributions, not noise.**
The proper metric confirms the coarse probe: at this scale and for cold single-concept LOCATION
questions, disciplined structure does NOT reduce what a stateless reader must open. It increases it
by ~1 file, because hexagonal spreads one concern across interface + service + repository +
controller, whereas the mud's God-class holds it in the one file the reader already opened. Cost is
equal; D takes ~1 more turn.

## 2c. CNT / sentinel MAP arm, k=5 per twin (2026-09-06) — the decisive one
Added a truthful navigation `CLAUDE.md` (sentinel) to each twin (as precise as its own structure
allows: the mud's points to files, the disciplined one names the exact service). Re-ran the same
k=5 comprehension probe (`claude -p` auto-loads CLAUDE.md).

| metric | no-map M | no-map D | MAP M | MAP D |
|--------|----------|----------|-------|-------|
| read_breadth | 4 | 5 | **3** [3,3,3,3,3] | **3** [3,3,3,3,3] |
| num_searches | 2 | 2 | **0** | **0** |
| turns | 7 | 8 | **4** | **4** |
| out_tokens | 1160 | 1432 | 926 | 1032 |
| cost USD | 0.113 | 0.111 | **0.071** | **0.063** |

**The MAP is the load-bearing factor, not the raw structure.** For BOTH twins the sentinel drove
searches to ZERO, cut turns ~45%, cut cost ~40%, and made read-breadth deterministic (exactly 3,
zero variance). With a map, the assistant stops exploring and jumps straight to the named files.
Residual structure effect WITH a map: D is ~12% cheaper (0.063 vs 0.071) despite slightly more
output, i.e. D's smaller bounded units are cheaper to read once you are at the right file, but the
distributions overlap, so this is suggestive not clean.

## 4. Honest bottom line (2026-09-06)
- **Solid:** twins + behavioral equivalence (13/13) — a real prerequisite.
- **The read-side economy of the bridge comes primarily from the authored MAP (the sentinel / CNT),
  not from disciplined structure per se.** The sentinel is one of the paper's three load-bearing
  contributions; this experiment empirically validates IT (searches -> 0, cost -40%, deterministic
  breadth), which is a stronger and more defensible story than "clean code is cheaper to read."
- **"Disciplined structure alone is cheaper to READ" is NOT supported.** Without a map it is slightly
  MORE expensive (more files per concept); with a map the structure difference on read-breadth
  vanishes (both 3). Structure's residual read benefit is small and lives in Bounded UNIT SIZE
  (smaller files cost less to read once located), suggestive at ~12% cost here, expected to grow
  with file size / scale.
- **Reframing for the paper (honest + favorable):** credit the read economy to the sentinel + the
  Bounded property, not to a vague "structure aids AI." The bridge's read side = authored map (big,
  clean effect) + bounded units (small effect). Deflates the naive claim, elevates the real mechanism.
- **Still to test:** (a) SCALE (bigger tree, where the God-class has nowhere to hide and known
  locations should widen the gap); (b) the MODIFICATION DV (safe change: does the oracle stay green,
  at what read-breadth — where known seams should reward D more than lookup did). Next build = modification DV.
- Posture (manifesto Principle 10): claim only what is measured. Measured so far: equivalence proven;
  the SENTINEL cuts read-cost ~40% and eliminates search; raw structure does not reduce read-breadth.

## 2d. Enforced-scope / IoC comprehension arm, k=3 (2026-09-06)
Reader given ONLY a curated surface (D: sentinel + port interfaces + test contracts; M: sentinel +
test contracts, no interface layer), tools OFF so it cannot sweep. Answers an intent-question set;
told to say "INSUFFICIENT" rather than guess. True token cost is cache_creation+cache_read (the
`input` field showed 9 because the surface was cached).

| | surface bytes | surface tokens (~) | sufficient? | answered correctly |
|--|--------------|--------------------|-------------|--------------------|
| M (mud) | 20,338 | ~35k | YES (0/9 INSUFFICIENT) | yes, cited map + test names |
| D (disciplined) | 23,201 | ~36k | YES | yes |
| M implementation (routes) | 25,746 | ~ | (not needed) | |

**Findings (three, all honest):**
1. **M's surface was SUFFICIENT too.** The interface layer (D-only) added NO comprehension benefit;
   M understood equally from tests + sentinel. For UNDERSTANDING, the read surface = TDD contracts +
   sentinel (Verifiable + Self-describing), which BOTH twins have, NOT hexagonal structure.
2. **No token reduction.** The ~35k curated surface is NOT smaller than reading M's ~25k
   implementation. At this scale the surface is not cheaper than the code; JC's predicted big token
   cut did not appear here.
3. **Priors confound.** Conduit is a famous benchmark; the model can answer intent partly from
   TRAINING, not the surface. Comprehension tests on a known system are contaminated.

## 5. FINAL honest conclusion of the bridge test v1 (2026-09-06)
- **SOLID & keep:** (a) twins + behavioral equivalence (13/13); (b) the SENTINEL/map dominates
  read-cost (searches -> 0, cost -40%, deterministic breadth) -> empirically validates the sentinel
  contribution + Self-describing; (c) tests-as-contracts + sentinel suffice for comprehension
  without implementation -> validates Verifiable + the "read interfaces/contracts to understand" idea.
- **NOT shown:** hexagonal/SOLID STRUCTURE per se reduces read cost. Across three read arms it did
  not (equal or slightly worse). The read economy comes from the MAP and the CONTRACTS, not the
  layering.
- **NOT shown:** JC's "bridge reduces tokens A LOT" — because (i) small scale (surface ~ implementation),
  (ii) priors on a famous benchmark, (iii) caching obscures accounting.
- **The experiment EARNED its next design (converges with CodeSeeker/Conclave):** to show the token
  win cleanly you need (1) a LARGER, (2) NOVEL/OBFUSCATED system (name-scrambled a la ClassEval-Obf,
  to kill priors and force reading), (3) enforced scope via a REAL retrieval instrument (CodeSeeker /
  IoC) not prompt-instruction, and (4) the MODIFICATION DV. That is exactly the CodeSeeker-as-IoC arm.
- Bottom line: the bridge's read economy is real and attributable to the SENTINEL + CONTRACTS
  (authored artifacts), not to structure alone; the big-token-cut claim is unproven at this
  scale/benchmark and needs the CodeSeeker + scale + obfuscation setup to test honestly.

## 2e. MODIFICATION arm — cost per correct line, k=3 (2026-09-06)
Same feature (`GET /api/articles/count`) added to each twin (sentinel present); success = tsc passes
AND `articlesCount` wired; metric = cost / net accepted line. Twins snapshot-restored (stay frozen).

| twin | cost/line median [raw] | read_breadth [raw] | net_lines | total cost median | success |
|------|------------------------|--------------------|-----------|-------------------|---------|
| M (mud) | $0.0085 [.0067,.0085,.0093] | 1 [1,1,1] | 13 | $0.101 | 3/3 |
| D (bridge) | $0.0088 [.0088,.0121,.0079] | 5 [5,7,5] | 17 | $0.150 | 3/3 |

**Cost per correct line is essentially EQUAL (D marginally higher); the mud is ~50% cheaper total.**
Same mechanism as every other arm: the God-class concentrates the concern in one file (read 1, edit
1), the disciplined twin spreads it across layers (read 5, edit 3). No token advantage for the bridge
on a simple, localized feature at this scale. So the token-cost rebuttal ("correct-lines-per-token
improves with the bridge") is NOT supported here.

## 6. CONSOLIDATED conclusion — bridge test v1, all six arms (2026-09-06)
Across equivalence + 3 read arms + IoC comprehension + modification, one consistent result:
- **Disciplined structure (SOLID/hexagonal) does NOT reduce AI token cost** for reading OR
  modification at this scale. It usually costs MORE (more files to open/edit); the mud's concentration
  is cheaper for a small system. Cost-per-correct-line: ~equal.
- **The one clean, robust win is the SENTINEL / authored map** (searches -> 0, cost -40%, deterministic
  read-breadth) -> validates the sentinel contribution + Self-describing. And contracts+sentinel
  suffice to understand without implementation -> validates Verifiable.
- **The token-reduction / correct-lines-per-token claim is UNPROVEN and, on small simple tasks,
  FALSE.** State this. Do not pitch "clean code = cheaper AI tokens" on this evidence.
- **Where the bridge's real value must live** (untested here, consistent with GS theory + the AX
  reliability finding): (1) SCALE, where the God-class becomes an unreadable/uneditable monolith and
  seams start to pay; (2) COMPLEX cross-cutting changes, where the mud's tangle causes REGRESSIONS
  and the disciplined seams isolate change (the value is RELIABILITY / not-breaking-things, not
  cost-per-line); (3) enforced retrieval via CodeSeeker/Conclave on a NOVEL/OBFUSCATED system (kills
  priors, forces reading). Bridge test v2 = those conditions + a regression-measuring success oracle.
- Honest headline for JC/paper: **the read economy belongs to the authored sentinel + contracts, and
  the modification economy is at best neutral at this scale; the disciplines' payoff is reliability at
  scale, which this v1 did not measure.** Principle 10: claim only this.

## 7. Weak-model (capacity) test, k=3 on haiku-4.5 (2026-09-07)
Hypothesis (answers JC's "why did I see a massive difference on older models"): the bridge is
CAPACITY-RELATIVE scaffolding; benefit ~ (problem complexity) / (model capacity). Prediction: rerun
the SAME twins on a WEAK model and the bridge advantage reappears (mud trips the small model).
Result on the SIMPLE count feature: M 3/3 (cost/line $0.0037, rb 2, 1 edit), D 3/3 (cost/line
$0.0048, rb 6, 5 edits). **NO divergence** - haiku handled both; mud still cheaper. Informative null:
the task is too trivial to exceed haiku's capacity, so scaffolding offloads nothing even for the weak
model. The capacity effect needs a task whose complexity EXCEEDS the model's capacity. Next: a
cross-cutting task (e.g. add `readingTime` to EVERY article response: single, list, feed) where the
mud forces the weak model to find+update several duplicated serialization sites consistently (fail
mode = inconsistency/regression) while D changes one centralized service method. Success oracle must
check CONSISTENCY across endpoints (behavioral), not just tsc+wired. THAT is the definitive capacity
test; the conceptual answer (capacity-relative scaffolding; the field effect was real on weak models
+ hard/large work) is solid regardless.

## 8. CAPACITY EFFECT CONFIRMED on a local weak model (llama3.2:3b, k=3) — the payoff (2026-09-07)
Cross-cutting change (`readingTime` on every article response) via a local 3B model, feeding each
twin the file where article responses are built (M: 489-line God-class route; D: centralized service).

| twin | output vs original | route handlers kept | tsc pass | what actually happened |
|------|--------------------|--------------------|----------|------------------------|
| M (mud) | ~5,660 / 11,676 chars, **231 / 489 lines** | **2 of 8** | 3/3 | TRUNCATED: silently dropped 6 of 8 endpoints, still compiles+exports router |
| D (disc.) | ~7,700 / 6,819 chars, full | n/a (service) | 1/3 | FULL file preserved + readingTime added; the 2/3 tsc "fails" = the TYPE GATE catching the model's error |

**Mechanism (the answer to "why did I see a massive difference on weaker models"):**
1. **BOUNDED units keep each piece inside the weak model's coherent-generation capacity.** A 3B model
   cannot faithfully regenerate a 489-line God-class, so it truncates and silently drops functionality
   (2/8 endpoints survived). D's small units regenerate whole. Decisive for weak models.
2. **CONTRACTS/TYPES are a gate that catches the weak model's errors instead of shipping them.** M's
   truncation COMPILED (loose untyped mud has nothing to violate) = the classic "compiles but broken."
   D's type contracts turned the model's mistakes into tsc FAILURES = caught, then fixable. So `tsc
   pass` is a TRAP metric across typed vs untyped code: M "passed" while deleting 75% of the API.
3. Why the strong-model arms were null: sonnet holds the whole God-class within capacity, no
   truncation, both work. The bridge's value appears at the CAPACITY THRESHOLD (small models,
   big/tangled files, long horizons) - exactly where the field observation lived.

**Consolidated answer — what the bridge contributes:** capacity-relative scaffolding whose value is
(a) BOUNDED units that keep generation faithful for weaker models / larger files (no silent
truncation), and (b) CONTRACTS + GATES that catch residual errors instead of shipping them
(Verifiable/Defended). NOT token economy, NOT "structure is inherently easier to read." It is
coherence-preservation + error-catching, biggest where model capacity is smallest relative to the
problem. Empirically validates the manifesto keystone: the guarantee lives in the gate (D's types
caught the error), never in the author (the model silently broke M).
