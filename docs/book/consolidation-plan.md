# GS Book — Consolidation Plan

**Purpose:** Map every existing source document onto the 14-section book bible, assess draft
status, flag gaps and staleness, and recommend a writing order. This is a project map, not prose.
Do not draft chapters from this file — draft from the bible + the mapped sources it points to.

**Canonical spec:** [`gs-book-bible.md`](gs-book-bible.md) (14 sections; sections 13–14 are
authorship guides, not reader chapters → **12 content chapters**).

**Structural decision required before drafting (read first):** Two chapter models are in play.
- **Bible (canonical, six-tier):** one "Six-Tier Cascade" chapter (T1–T6); the harness/verification
  is a *cross-cutting capability*, not a tier.
- **Scaffolding book (`gs-methodology-book`, four-tier):** splits tiers across ch05 (T1), ch06 (T2),
  ch07 (T3/T4); elevates a standalone **"Verification Layer"** chapter (ch04) and an **"Eight Recipes"**
  chapter (ch11); glossary/references still say "four deployment tiers T1–T4."

The scaffolding is an *earlier* derivation. **Adopt the bible's six-tier model as canonical** and
re-map the scaffolding chapters onto it (see the map). Do not carry the four-tier framing forward.

---

## 1. Chapter-by-Chapter Map

Sources keyed as: **WP** = White Paper, **CO** = Compendium, **PP** = Practitioner Protocol,
**FG** = Field Guide, **SCAF** = `gs-methodology-book` scaffolding chapter, **FW** = Foreword,
**EXP** = experiments dir, **BIBLE** = prose already written inside the bible itself.

| # | Bible Chapter | Primary source(s) — specific sections | Secondary sources | Draft status | Notes |
|---|---|---|---|---|---|
| 1 | The Problem | SCAF ch01 *the-diagnosis* (full 84-line draft); WP §1 (Stateless Reader), §3.1 concept map | CO Prologue ($327M Mars) + §1 Intro + §3 Theoretical Gap; FG §1 "reader is stateless" | **Partially drafted** | SCAF ch01 is a strong, near-final draft. Assembly + citation hookup. |
| 2 | The Core Inversion | SCAF ch02 *the-inversion*; FW "The inversion"; WP §2 (Discipline of Removal), §2.2 Phase Collapse, §4.2 Cost Inversion | CO §2 Abstraction Ladder, §4 (The Principle); FG "Restriction is activation" | **Partially drafted** | Cost-inversion + phase-collapse are the load-bearing ideas. SCAF sim `cost-inversion` exists. |
| 3 | The Specification Stack | BIBLE §3 (5 artifacts, canonical); PP Parts II–VI (5 memory types) | CO §6 Artifact Grammar; FG §2 sentinel tree; SCAF ch03 | **Partially drafted** | Reconcile bible's **5 artifacts** with PP's **5 memory types** (they are two lenses on one stack — state the mapping explicitly). Bible-only content: UI/UX contracts + GoF→property table. |
| 4 | The Six-Tier Cascade | BIBLE §4 (canonical six-tier + Generative-X lexicon); PP Part I "Obligation Cascade"; CO §4 + §7.9 Meta-Application | SCAF ch05/06/07 (four-tier — **re-map, don't copy**); CO §7.7 (T2+T3 platform) | **Partially drafted / reconciliation-heavy** | **Highest reconciliation cost.** SCAF and PP/CO use legacy tier numbering; bible footnote confirms `t4-signal`/`check_t4` retain legacy "t4"=Production. Normalize every tier number before pulling. |
| 5 | The Seven GS Properties | BIBLE §5 (canonical: failure-mode-first, score progression, calibration anchors); SCAF ch08 (165-line draft) | WP §3 + §3.1 concept map; FG "seven properties"; ForgeCraft 14-pt rubric | **Partially drafted — richest** | Bible §5 is the fullest spec in the whole bible; SCAF ch08 the fullest scaffolding draft. Most source-ready chapter. |
| 6 | The Tool Kit | BIBLE §6 (near-final: ForgeCraft, CodeSeeker, Chronicle, Loom) | CO §7.3 (ForgeCraft), PP Part IX Toolchain; SCAF ch09 | **Partially drafted** | Bible text nearly publishable. Verify tool versions/numbers at draft time (see staleness). |
| 7 | The Closed Loop | BIBLE §7 (complete narrative prose) | PP Part VII Operating Protocols; FG "retrieve→generate→verify"; SCAF ch04 *verification-layer* | **Partially drafted (bible near-final)** | SCAF's standalone "Verification Layer" chapter folds in here (loop) + into §4 (cascade). Cascade-gate + conventional-commits mechanics live here. |
| 8 | Documentation Just-In-Time | BIBLE §8 (complete prose: brownfield strategies, 3-flow table) | PP Part III (Procedural); CO §7.1 Takeover / §7.2 Brownfield case studies | **Partially drafted (bible near-final)** | No dedicated scaffolding chapter. Consolidation-ready from bible. |
| 9 | Case Studies | CO §7.1–§7.9 (8 studies: SafetyCorePro, Invellum, ForgeCraft, Conclave, BRAD, Shattered Stars, regulated platform, meta-app); EXP dir (AX/BX/CX/RX/EX/KX/MX/RND-1) + ALX | BIBLE §9 (CodeSeeker, COMPASS); SCAF ch10; WP §5 Evidence | **Partially drafted + placeholders** | CO §7 is the master case bank — select, don't reproduce all. COMPASS T2/T3 is `[EXPAND on milestone]` (see Gaps). *(The controlled practitioner study is retired — excluded from the book.)* |
| 10 | The Formal Underpinning | BIBLE §10 (Hoare, Curry-Howard, Rust, Loom — drafted); SCAF ch12 | CO §5 Related Work + formal lineage; Loom docs (350 BCE→2011 lineage) | **Partially drafted** | Keep practitioner-accessible per bible note. Loom lineage doc is the depth source. |
| 11 | The Biological Isomorphisms | BIBLE §11 (BIOISO mapping table + prose — the only prose that exists) | ALX experiments (`loom/experiments/alx/bioiso-*.loom/.rs`); **BioIso paper (not in mapped set)** | **Bible-spec-only → needs authorship** | Only the bible carries this. BioIso paper + ALX evidence are external and must be pulled in for depth/citations. Highest original-writing need among content chapters. |
| 12 | The Research Horizon | BIBLE §12 (T5/T6, Loom proof, BIOISO proof); SCAF ch13 *research-horizon* (122-line draft) | CO §9 Convergence/Forward Extension, §11 Onwards | **Partially drafted** | T5/T6 are honest forward statements — largely original, evidence-light by design. Keep the proved/designed/agenda line sharp. |
| 13 | Voice and Tone Guide | — (BIBLE §13) | `the-threads.md` (primary voice calib., referenced not read) | **Meta — not a reader chapter** | Authorship guide. No consolidation; use to gate every draft. |
| 14 | Book Positioning | — (BIBLE §14) | — | **Meta — not a reader chapter** | Authorship guide (audience, comps, promise). No consolidation. |

**Orphan scaffolding chapters (no 1:1 bible home):**
- SCAF **ch04 Verification Layer** → dissolve into Bible §7 (Closed Loop) + §4 (Cascade, harness as cross-cutting). Do not keep as its own chapter.
- SCAF **ch11 Eight Recipes** → maps to PP Part X + brownfield strategies (Bible §8) + Case Studies (§9). The "recipes/entry-point" packaging is *not* in the bible TOC — decide whether to add it as an appendix/practitioner chapter or fold into §8. **Open decision.**

---

## 2. Gaps — topics the bible calls for that no source covers (need original writing)

- **COMPASS T2/T3 case study** — bible §9 + tier proofs are explicitly `[EXPAND when COMPASS ships/reaches milestone]`. In-progress; no completed source. Original writing gated on real milestone.
- **Biological Isomorphisms depth (§11)** — only the bible has prose; the BioIso paper is **not** in the mapped source set. Needs original authorship + evidence pulled from ALX `bioiso-*` runs.
- **UI/UX behavioral contracts (§3 subsection)** — the four presentation-layer pathologies + design-token/component-library artifacts appear **only** in the bible. WP/FG/PP don't cover them. Original writing.
- **GoF-pattern → GS-property table (§3)** — bible-only; no corroborating source.
- **T5/T6 (§12, and cascade §4)** — architecturally specified, not demonstrated. Original forward-statement writing; keep evidence status explicit.
- **"Eight Recipes" practitioner packaging** — exists in scaffolding, absent from bible TOC. Needs an authorship decision (adopt / fold / drop) before it can be written.
- **Judgment layer (§4)** — rich in the bible; thin elsewhere. Mostly original from bible prose.

---

## 3. Overlaps / Dedup — one base per topic

| Topic (appears in many sources) | Where it repeats | **Best base** |
|---|---|---|
| Stateless reader / the problem | SCAF ch01, WP §1, CO §1+Prologue, FG §1, bible §1 | **SCAF ch01** (best prose) + WP §1 for citable framing |
| Cost inversion / phase collapse | WP §2.2 + §4.2, CO §2, SCAF ch02, SCAF sim | **WP §4.2** (citable) narrated via SCAF ch02 |
| Specification stack / artifact grammar | bible §3, PP Parts II–VI, CO §6, FG §2 | **Bible §3** (5 artifacts) reconciled with PP memory-type lens |
| Seven properties | bible §5, SCAF ch08, WP §3, FG, CO | **Bible §5** (deepest: failure-mode-first + score anchors); SCAF ch08 second |
| Closed loop / cascade gate / conv. commits | bible §7, PP Part VII, FG | **Bible §7** (complete) |
| Brownfield / doc-JIT / takeover | bible §8, PP Part III, CO §7.1–7.2 | **Bible §8** for method; CO §7.1–7.2 for worked cases |
| Case studies | CO §7.1–7.9, bible §9, SCAF ch10, WP §5 | **CO §7** (master bank — select subset) |
| Formal lineage | bible §10, CO §5, SCAF ch12, Loom lineage | **Bible §10** for accessibility; Loom lineage for depth |
| Tiers/cascade | bible §4, PP Part I, CO §4/§7.9, SCAF ch05/06/07 | **Bible §4** (six-tier); others re-mapped |

**Rule:** the bible is authoritative for *numbers and tier framing*; scaffolding/WP/CO supply *prose and evidence*. When they conflict, bible wins.

---

## 4. Recommended Writing Order

### Consolidation-ready (sources exist; mostly assembly + reconciliation)

**Start here — top 3 (foundational + most source-ready):**
1. **Ch 1 — The Problem** — opens the book; SCAF ch01 is a near-final draft; unblocks everything.
2. **Ch 2 — The Core Inversion** — foundational premise; SCAF ch02 + FW + WP already cover it.
3. **Ch 5 — The Seven Properties** — conceptual core of the whole book; richest source (bible §5 full spec + SCAF ch08); referenced by nearly every later chapter.

**Then (bible already carries near-final prose — fast assembly):**
4. **Ch 7 — The Closed Loop** — bible §7 essentially written; also settles where the SCAF "verification layer" content lives.
5. **Ch 8 — Documentation Just-In-Time** — bible §8 essentially written; standalone.
6. **Ch 6 — The Tool Kit** — bible §6 near-final; just version-check the numbers.
7. **Ch 3 — The Specification Stack** — sources rich; needs the 5-artifacts ↔ 5-memory-types reconciliation and the bible-only UI/UX + GoF material.
8. **Ch 10 — The Formal Underpinning** — bible §10 drafted; keep it practitioner-accessible.
9. **Ch 9 — Case Studies** — CO §7 is a rich bank; work = selection + trimming; leave COMPASS as an honest in-progress section.

### Needs original authorship / heaviest reconciliation (do after the core settles)
10. **Ch 4 — The Six-Tier Cascade** — do *after* Ch 5/7 so the harness-as-cross-cutting framing is stable. Biggest reconciliation job (four-tier scaffolding + legacy numbering → six-tier). High value, high cost.
11. **Ch 11 — Biological Isomorphisms** — only the bible has prose; requires pulling in the BioIso paper + ALX evidence. Mostly original.
12. **Ch 12 — The Research Horizon** — mostly original forward statements (T5/T6); write last so the proved/designed/agenda boundary is set by the finished earlier chapters.

**Not chapters:** §13 Voice & Tone and §14 Positioning are authorship guides — apply them continuously; never draft as reader chapters.

---

## 5. Staleness Flags — fix before pulling content

1. **PP old property scale** — Practitioner Protocol uses the legacy **6-property / "12/12"** rubric. Current canon = **7 properties / 14 points, threshold 11/14**. Re-map any PP scoring before quoting.
2. **Tier numbering (pervasive)** — Bible = **six-tier T1–T6, harness cross-cutting**. Stale in: SCAF book ("four deployment tiers T1–T4", glossary + references + index), PP Part I "Obligation Cascade", CO §4/§7 (earlier seven-tier). Also **operational artifact names** (`t4-signal`, `check_t4`, `t4-signals.json`) retain legacy "t4"=Production per bible footnote — read as **T3** conceptually; don't "fix" the code strings in prose, just annotate.
3. **SCAF glossary/references drift** — "four deployment tiers", "Loom 15 formally verified properties", "23 milestones/634 tests" — reconcile against bible appendix numbers (Loom: 634 tests, 23 milestones, 5 emission targets; lineage 350 BCE→2011).
4. **ForgeCraft version drift** — Bible: v1.5.0, 116 template blocks, 24 tags, 6 assistants. WP references "treatment v7"; PP references older versions. Normalize to bible appendix at draft time.
5. **Scaffolding chapter model** — SCAF ch04 (Verification Layer) and ch05/06/07 (per-tier) encode the superseded four-tier split. Treat SCAF tier chapters as *prose donors*, not structure.
6. **Case-study consistency** — CO §7.4 "Conclave" (greenfield) must align with bible's Axon/Conclave = **T5 synthesis**; check framing before reuse.
7. **Controlled practitioner study — RETIRED.** Excluded from the book and scrubbed from public materials (conducted at the author's employer). Practitioner-transfer evidence = the McBrokers observational cohort only.

---

*Source inventory: bible (2,425 ln) + foreword; WP (~9 §), CO (~11 § incl. 8 case studies §7.1–7.9),
PP (Parts I–X + appendices, partly stale), FG (4 §); scaffolding book (13 partial chapters +
glossary/references/sims); experiments AX/BX/CX/RX/DX/EX/KX/MX/RND-1 + ALX (loom).*
