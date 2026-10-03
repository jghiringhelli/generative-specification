# PREREG-HOWTO: registering SDX-0 and SDX-1 (checklist for JC)

2026-10-02. Repository (worktree of this branch): `C:\workspace\PragmaWorks\gs\gs-experiment-protocol`. Canonical location after merge: `C:\workspace\PragmaWorks\gs\generative-specification\docs\experiments\PREREG-HOWTO.md`. Protocol section 4 (what each mechanism proves): `C:\workspace\PragmaWorks\gs\generative-specification\docs\experiments\EXPERIMENT-PROTOCOL.md`. Registration files: `C:\workspace\PragmaWorks\gs\generative-specification\docs\experiments\prereg\SDX-0.md`, `SDX-1.md`, `SDX-1-ARMS.md`.

## 0. The sequence before freeze day (JC decision 2026-10-02: budget is no object, refine longer, vendor-diverse critics)

Role definitions, what each independent person or model does and sees: `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\ROLES.md`. Runbooks: `COPILOT-CRITIC-RUNBOOK.md`, `COPILOT-PRACTITIONER-RUNBOOK.md`, `PRACTITIONER-HANDLING.md`, `HUMAN-PRACTITIONER-BRIEF.md`, all in `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\`.

1. **Vendor-diverse critic rounds** on SDX-1 and SDX-1-ARMS (at least 3 vendors per round, at least 2 not Anthropic, fresh stateless sessions, the fixed prompt in the critic runbook; outputs in `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\critiques\`). After each round: adjudicate every finding (ACCEPTED, ACCEPTED-AS-DECLARED-LIMIT, REJECTED with written refutation, DEFERRED), revise, commit, new round.
2. **Practitioner artifacts**: human A6 then A5, then the L appendix and flat file; model-authored A5-m1 and A5-m2 per non-Anthropic vendor; **leak checks** (M1: independent human plus a different-vendor judge) and **strength checks** (M2).
3. **SDX-0 pilot** (harness validity, cost and variance). Needs JC's budget approval.
4. **SESOI and n fixed** from SDX-0, with the written justification (SDX-1 section 13 items 4 and 5).
5. **Final critic round** on the complete package (values filled, artifacts, manifest, probe rule output). No accepted BLOCKER may remain.
6. **Freeze**: commit, tag `prereg/SDX-1-v1`, push, build the zip, **OSF registration of record, Zenodo mirror** (JC has both accounts), log everything; only then the first main-run session.

**Refinement stop rule.** The critic phase before SDX-0 ends when two consecutive vendor-diverse rounds each leave no ACCEPTED BLOCKER. A structural change (an arm, hypothesis, readout, oracle or probe rule, decision-table row) resets the count; wording changes do not. Maximum four rounds before SDX-0; if round four still has an accepted BLOCKER, stop and JC chooses: freeze with the blocker written verbatim in the threats section, reduce to Core, or shelve (a fifth round needs a written reason). The final round (step 5) is separate and mandatory: one round, at most one targeted re-review of the changed parts if it finds an accepted BLOCKER, and any material change after it voids it. Full text in `ROLES.md` section 6.

## 1. Who does what

| The assistant can do alone | Only JC can do |
|---|---|
| Write and revise the registration files; run stateless Claude critics; adjudicate every critic finding in a written log (JC decides contested items); run the deterministic checks on practitioner texts; commit with atomic messages | Create and own the OSF and/or Zenodo account (the assistant must not create accounts) |
| Create the annotated tag `prereg/<ID>-v<N>` and push branch and tag to the public repo (when JC says push) | Press the final Register / Publish button at OSF or Zenodo, and choose public vs embargo |
| Build the frozen archive and its SHA-256 with `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\scripts\build-frozen-package.js`; run the hash dry check before each run batch | **Name the external practitioner** (author of A5) and the **independent reviewer**; both must be neither JC nor an agent |
| Fill the logbook after JC pastes the DOI/URL, date and confirmation | Drive the Copilot sessions on the second PC (one fresh chat per model: critics, then practitioner variants m1 and m2) and paste the exact model id strings; provide API access for a different-vendor judge (M1) or name a person to run it |
| Draft the OSF form answers and the Zenodo description text for JC to paste | **Approve the budget** and choose scope, Core or Full (SDX-1 section 11, 13) |
| Run the pilot SDX-0 once JC approves its budget | **The freeze decision** for SDX-0 and for SDX-1; the registration is irreversible |

Nothing below runs a real experiment. SDX-0 needs JC's budget approval first. SDX-1 needs SDX-0 closed (pass criteria V1 to V13 each passed, failed with action, or waived by JC with a reason).

## 2. Recommended default

**Register on OSF Registries as the registration of record, and also deposit the same zip on Zenodo as an archive mirror (optional, 10 minutes).** Why OSF first: it is a registry with a template; OSF help says that once submitted you cannot edit the registration or its files, and that public registrations get a DOI automatically, which is the reading reviewers and journals recognize as "preregistered". Zenodo alone is a repository; its own help says files can be added, removed or modified by you for 45 days after publishing (metadata at any time), so it is a weaker immutability signal unless you never touch it and cite the version DOI and the hash. Use Zenodo as the mirror because it gives a version-pinned DOI for the exact zip. Do not embargo (an embargoed registration has no DOI until public, and proof reaches readers only later). SDX-0 (no hypothesis tested) needs only the git tag; register SDX-0 externally only if you want the harness record public.

Order for SDX-1 on freeze day: finish files, commit, tag, push, build the zip, OSF registration, Zenodo mirror, record everything, then (and only then) start the first main-run session.

## 3. Freeze-day steps (both registries)

1. In the worktree, confirm the open items in SDX-1 section 13 are closed or consciously waived (practitioner and reviewer named, A5 text and its attestation present, M1 and M2 results committed, budget approved, scope chosen, SESOI and n filled, model ids filled), and that the sequence of section 0 is complete: the stop rule was met (counter and round log in `SDX-REVIEW.md`), the final critic round shows no accepted BLOCKER, SDX-0 is closed.
2. Write the file list `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\prereg-frozen\SDX-1-v1.list.txt`, one repo-relative path per line (directories allowed): the five prereg files (`docs/experiments/prereg/SDX-1.md`, `SDX-1-ARMS.md`, `SDX-0.md`, `SDX-REVIEW.md`, and the deviations-log file, empty), `docs/experiments/ROLES.md`, the whole `docs/experiments/critiques/` folder (rejected findings included), `experiments/sdx1/practitioner/` (human and model texts, attestations, deletion-check and judge outputs, `meta.json` files), the protocol, change texts, scaffold and its hash, oracle and manifest and tolerance rules, content manifest with G and L tags and parity and leak results, frozen A5 text plus attestation, A1 appendix, flat file, substrate, detector and analysis scripts, model id and CLI version file.
3. Commit everything. Tag: `git tag -a prereg/SDX-1-v1 -m "SDX-1 registration v1"`. Push: `git push origin <branch>` and `git push origin prereg/SDX-1-v1` (assistant, on JC's word).
4. Build: `node C:\workspace\PragmaWorks\gs\gs-experiment-protocol\scripts\build-frozen-package.js build --id SDX-1 --version 1 --root C:\workspace\PragmaWorks\gs\gs-experiment-protocol --list C:\workspace\PragmaWorks\gs\gs-experiment-protocol\prereg-frozen\SDX-1-v1.list.txt --out C:\workspace\PragmaWorks\gs\gs-experiment-protocol\prereg-frozen`. It refuses a dirty tree. It writes `SDX-1-v1-registration.zip`, `.zip.sha256` and `.MANIFEST.json`. The zip is deterministic: the same inputs give the same hash (tested). Build once, on the committed tree, on one machine; line-ending conversion by git on another machine would change bytes.
5. Registration of record at OSF (below), then Zenodo mirror (below).
6. Record in `C:\workspace\PragmaWorks\gs\generative-specification\docs\experiments\LOGBOOK\README.md` and the SDX-1 entry: tag, commit hash, OSF DOI or URL, Zenodo version DOI and concept DOI, date, archive SHA-256, and the manifest path. Tier becomes A only if both the external record and the tag predate the first main-run session and the independence conditions (named practitioner, different-vendor judge) were met; otherwise state which condition is missing.
7. Dry check before every run batch: `node C:\workspace\PragmaWorks\gs\gs-experiment-protocol\scripts\build-frozen-package.js verify --manifest C:\workspace\PragmaWorks\gs\gs-experiment-protocol\prereg-frozen\SDX-1-v1-registration.MANIFEST.json --root C:\workspace\PragmaWorks\gs\gs-experiment-protocol`. A nonzero exit means do not run.
8. Anything changed before outcome data: new version `prereg/SDX-1-v2` with a changelog line (protocol section 5). After outcome data: deviations log only.

## 4. OSF Registries steps

Verified 2026-10-02 from OSF help pages (help.osf.io articles 330 "Welcome to Registrations", 768 "OSF Projects Transition: Registration Questions and Use Cases", and a search-surfaced "Start a Registration" article; I could not open the Start-a-Registration page itself, so button wording below is from the 768/330 text and a search summary):

1. Sign in at osf.io (JC's account). Optional: create an OSF project and upload the zip and prereg files; registration pulls files from the project (up to 5 GB).
2. Go to OSF Registries, My Registrations, click **Add a Registration**.
3. Answer whether you have content in an existing OSF project: Yes, then pick the project (you need admin permission), or No to start from scratch.
4. Choose the template. OSF says it recommends none; **OSF Preregistration** or **Open-Ended Registration** fit; for an experiment with this much structure use OSF Preregistration and paste the SDX-1 sections into its fields, and attach the zip (and the five files) as supporting files.
5. A draft is created and a link emailed; fill in metadata (title, contributors, description), the template answers, and the files. Cite in the description: the git tag, commit hash, repository URL, and the zip's SHA-256.
6. Submit with **no embargo** (public registrations get the DOI automatically). After submission nothing can be edited; later changes are via a separate "update" process that links additions, and withdrawal is irreversible and removes the content.

Not verified: exact labels on the final confirmation screen, whether a moderation or approval step applies to your account, whether the Projects Transition (article 768) has changed the project-to-registration flow since the pages were written, any fee (no page mentions one; COS materials describe OSF as free). Do the registration once with a throwaway draft (do not submit) to see the screens before freeze day.

## 5. Zenodo deposit steps

Verified 2026-10-02 from help.zenodo.org (deposit "create new upload" and "manage versions" pages):

1. Sign in at zenodo.org (JC's account). Click the plus icon in the header, **New upload**.
2. **Upload files** (up to 100 files, 50 GB): the zip, its `.sha256`, and the `.MANIFEST.json`.
3. Fill the required fields (red stars): resource type (Dataset or Other), title, publication date, creators (ORCID helps). Put in the description: experiment id and version, git tag, commit hash, repository URL, the OSF registration DOI, and the zip SHA-256. Click **Get a DOI now!** to reserve the DOI if you want to cite it in the OSF entry first (deleting the draft loses it).
4. **Save draft**, set file visibility to public, **Preview**, then **Publish** and confirm.
5. Afterwards: metadata can be edited any time; per Zenodo help, files can be added, removed or modified by you within 45 days of publishing, so do not touch them and treat the published version as final. Real file changes are a new version (new version DOI, same concept DOI, old version intact).

Alternative, GitHub integration: connect GitHub in Zenodo (profile menu, GitHub, **Sync now**, toggle the repository), then publishing a GitHub release of tag `prereg/SDX-1-v1` makes Zenodo archive the repository source as a zip with a DOI. Secondary sources agree; I could not open the primary "archive a release" page. It archives the repository, not your frozen package, so prefer the manual upload with the hash for this purpose.

Note on an earlier statement: protocol section 4 says files change after publication only through a new version. Zenodo's current help adds the 45-day modify window. The protocol text should be corrected to say so (a deliberate follow-up, not changed here).

## 6. Registered Report (optional)

For a flagship you can submit the stage-1 design to a Registered Reports track (MSR or ESEM with EMSE). Dates for 2027 were not verified. If you go this route, still do the tag and OSF registration first; they do not conflict.

## 7. What to record after registering (the logbook line)

`SDX-1 v1: tag prereg/SDX-1-v1; commit <hash>; OSF <DOI/URL>; Zenodo <version DOI> (concept <DOI>); registered <date>; archive SHA-256 <hex>; manifest <path>; scope <Core|Full>; practitioner <name or role>; reviewer <name or role>; judge vendor <name or "owed">; first main-run session <date, must be later>.`

## 8. Independent replicators (role e; added 2026-10-02, DRAFT)

After a registration is frozen, an independent replicator may rerun it from the package. Role definition: `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\ROLES.md` section 5b. Terms, recruiting text, candidate profile, deliverables, credit and contradiction handling: `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\REPLICATOR-BRIEF.md` (Spanish: `REPLICATOR-BRIEF.es.md`).

What this changes in the registration mechanics:
1. **The package must be replicable**: build it with `build-frozen-package.js`, include the oracle and runner, the arm artifacts with hashes, the data schema, the deviations-log template and the pre-stated ranges. State the license of the package in the README of the archive. A replication runbook is owed after SDX-0 produces a working harness.
2. **Generation and scoring are separable** in the harness (a replicator timestamps their own analysis plan between them). Build that separation into the SDX-0 harness.
3. **The replicator registers separately**: their analysis plan on OSF or equivalent, referencing our tag and archive SHA-256. Their record, not ours, sets their tier.
4. **Logbook**: after a replication, add a dated note to the original entry and a new entry `<id>-R<n>`; log it with the line format of section 7 plus `replicator <name or group>; variant <direct|conceptual>; COI form <path>; plan registered <date>; first scoring <date, must be later>`.
5. **Recruiting can start before the freeze; delivery cannot.** Recruit as soon as the first model-only registration (SDX-1, or SDX-5 Part A if it freezes first) has a freeze date.

## 9. Registering the follow-on experiments SDX-3 to SDX-7 (DRAFT)

Proposals and order: `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\BACKLOG.md`, section "Added 2026-10-02, second pass"; hypotheses: `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\HYPOTHESES-2026-10-02.md`. Practical rules:
1. One registration per experiment, each with its own tag `prereg/<ID>-v<N>`, OSF record and Zenodo mirror; none of them is part of the SDX-1 package, because adding arms or readouts to SDX-1 is a structural change (critic counter resets).
2. If SDX-3, SDX-5 or SDX-6 intends to reuse SDX-1 chains (archived snapshots and transcripts), register its analysis plan before SDX-1 is unblinded; after that it is tier C.
3. The data-capture requirement for SDX-1 (per-session tool-use and token breakdown, snapshots archived) is the one thing to settle before the SDX-1 freeze.
4. SDX-5 Part A and the SDX-4 pilot can be frozen and run before SDX-1 data exist (they depend on SDX-0, not on SDX-1).
