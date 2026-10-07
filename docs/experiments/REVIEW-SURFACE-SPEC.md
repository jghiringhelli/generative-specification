# REVIEW-SURFACE-SPEC: `gs-review-surface`, a deterministic tool that lists what a human must read in a diff

Status: **SPECIFICATION ONLY (2026-10-07, revision 2 after a first fresh-critic round, see `prereg\E2E-1-REVIEW.md`). No code exists, nothing has been run, no model was contacted.** Proposal, not frozen. Worktree: `C:\workspace\PragmaWorks\gs\gs-experiment-protocol`, branch `experiment-protocol-2026-10-02`. Where it is measured: the human-read study HR-1 (BACKLOG item B-HR) as an extension of P2; context: `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\prereg\E2E-1.md` (section 12). Sibling tools: the conformance checker `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\FX-1-CHECKER-SPEC.md` (state of a repository) and the lock tool; this tool reads a change, not a state.

## 1. Purpose and non-goals

Given a change (a diff between two commits), print the short list of places a human reviewer must still read, because no automated check in the loop can be relied on to judge them. It does not decide whether the change is correct, does not call a model, and does not replace reading; it narrows reading. A line absent from the list is not certified safe: the list is a floor on what to read, and its recall is a measured quantity (section 8), not an assumption.

Non-goals: finding bugs; scoring quality; reading semantics of code; replacing the checker, linter or tests.

## 2. Interface

- Command: `gs-review-surface --base <rev> --head <rev> [--repo <dir>] [--rules <file>] [--format text|json] [--out <file>]`.
- Inputs, all local: the git diff and the file contents at both revisions; the rules file (section 4); optionally the criterion index (section 5, rule S7). No network, no model, no clock, no randomness.
- Exit codes: 0 list printed and empty; 10 list printed with at least one MUST item; 11 list printed with only SHOULD items; 2 usage or configuration error; 3 diff unreadable. (The tool never "fails a build" on its own; a repository may wire exit 10 to a required human review.)
- Determinism: same inputs, same bytes out. Items are sorted by tier (MUST before SHOULD), then rule id, then path, then first line. The output carries the tool version, the SHA-256 of the rules file and of the diff.

## 3. Output

Each item: `rule` (id), `tier` (MUST or SHOULD), `path`, `lines` (range in the head revision, or `deleted`), `why` (one fixed sentence per rule, no free text), `evidence` (the matched pattern or the counted change, such as "test cases 14 to 11"). Summary block: number of items per rule; lines flagged over lines changed (the reading burden); files changed with no item (listed, so absence is visible).

## 4. Rules file

A single JSON file, versioned and hashed. It holds the path globs and regular expressions below, per technology stack, so the tool has no hidden defaults. A rule may be disabled but not silently: the output lists disabled rules. The default rules file ships with the tool and is the object that HR-1 measures. For every rule the rules file declares the exact detection input and the stacks supported; a rule that cannot run on a stack (no route detector, no test-framework counter) is printed as `not covered` in the output, never silently skipped.

## 5. Rules (each deterministic; the tier in brackets)

**S1 Spec and decision records changed [MUST].** Any change under the specification, cascade or decision-record paths. Report the changed criterion ids (parsed from the stable-id pattern the rules file declares), added, removed, and changed text; for a decision record: added, or edited after creation (an append-only violation), or superseded. Reason: the spec defines what correct means; a change to it is a change to the oracle.

**S2 Gate, hook, CI and checker configuration [MUST].** Any change to: git hook files or the hook installer; CI workflow files; lint, format and type-check configuration (including strictness flags and rule severity); test-runner configuration (thresholds, include and exclude lists, timeouts, retries); build and verify scripts named in the manifest; the conformance-checker configuration. Also, in added lines anywhere: suppression markers (`eslint-disable`, `@ts-ignore`, `@ts-expect-error`, `# noqa`, `# type: ignore`, `//nolint`, `#[allow(`), skip-hook flags (`--no-verify`), and edits to files the checker declares locked. Reason: weakening a gate removes the net that the other items rely on.

**S3 Ratchet and baseline changes [MUST].** Any change to a ratchet baseline or floor file. When the file format is declared, also report the direction: lowered or raised per metric; a lowered floor is MUST, a raised floor is SHOULD. Reason: the ratchet is the part the executor must not edit.

**S4 New or changed dependencies [MUST for new, SHOULD for changed].** Added packages in any manifest or lockfile; major version changes; changed licence fields where the lockfile carries them; added install, postinstall or build scripts; a registry or source URL other than the declared one. Reason: supply-chain and licence changes are decisions, and the package names themselves need a human check.

**S5 Migrations and schema [MUST].** Added or changed migration files, schema files, DDL in added lines, data-file format changes. Reason: effects on data written by the previous build are invisible to tests that start from an empty store.

**S6 Security-sensitive paths and calls [MUST for paths, SHOULD for patterns].** Changed files whose path matches the sensitive globs (authentication, session, permission, role, policy, middleware, crypto, token, secret, upload, cors, rate limit, admin); added lines matching call patterns (dynamic evaluation, shell execution, raw query construction by string concatenation, disabling certificate checks, wildcard CORS, hard-coded credentials patterns, weakened hashing); newly registered routes or handlers without any reference to a declared authorization helper in the same file. Reason: authorization logic is correct only if every route carries it, which tests rarely enumerate.

**S7 No criterion id [SHOULD].** Changed production files (not tests, not docs) for which none of these holds: the commit message cites a criterion id (the trailer or pattern the rules file declares); the file or hunk carries an annotation naming an id; the criterion index maps the file to an id. Reason: behaviour that traces to no criterion is unrequested or unspecified. Limit: file-level, heuristic; a repository without a criterion index flags every changed production file, and the tool says so instead of listing them (one summary item).

**S8 Tests deleted or loosened [MUST].** Deleted test files; a reduction in the count of declared test cases or assertions in a changed test file (counts by declared patterns per framework); added skip, only, todo, pending markers; assertions on a value replaced by a looser one (equality replaced by truthiness, an exact number replaced by a range or a wider tolerance, an expected value changed in the same commit as production code that produces it); snapshot files updated. Reason: a test changed together with the code it checks stops being an independent check. (Pattern-level detection of the last case is by co-change: expected value edited in a test file and production file in the same change.)

**S9 Configuration, secrets and environment [MUST].** Changes to environment and config files (`.env*`, settings, container and infrastructure files); added strings matching credential patterns or high-entropy tokens above the rules file's threshold; changes to default values of configuration read by the code; new environment variable reads. Reason: configuration is not exercised by unit tests and may carry secrets.

**S10 New externally visible surface [SHOULD].** Added routes, exported public API symbols, command-line flags, database tables or columns, background jobs, outbound network calls, file-system writes outside declared paths (pattern list per stack). Reason: each is behaviour a user or another system can reach.

**S11 Unusually large or unstructured change [SHOULD].** A file or hunk over the declared size threshold; generated or vendored files edited by hand; a change touching more modules than the declared limit. Reason: reading cost grows and agent-written diffs of this kind carry more unrequested change.

## 6. What the tool cannot see (stated, so that the list is not misread)

Spec-level misunderstanding that leaves the spec file untouched; subtle logic errors in files that match no rule; concurrency, performance and resource errors that appear only under load; wrong but consistent behaviour that tests written by the same agent confirm; semantic drift between a decision record and the code. For these the tool lists nothing, and the study (HR-1) is what shows whether they escape the other nets too. A repository that depends on the list for these classes is misusing it.

## 7. Tests of the tool itself

- Unit controls: for every rule, a pair of tiny diffs (fires, does not fire) and one boundary diff; expected output stored with the tool.
- Determinism: run twice, byte compare; run on a copy of the repository in another directory and with the git history rewritten to different hashes but the same content, byte compare except hashes.
- Clean-diff controls: a corpus of known-clean agent diffs (accepted and independently reviewed) for the reading burden and false positive counts.
- The rules file is hashed and frozen before any HR-1 instance is authored (section 8).

## 8. How P2 (HR-1) measures its recall

Setting: P2's reference implementations plus injected instances, extended by the added classes of the human-read taxonomy (HR-1 section in BACKLOG B-HR). Each injected instance is a diff (base: the correct reference; head: base plus the injected defect) with a manifest that records the class, the file and the line range of the defect.

1. **Order of events.** The rules file is frozen and hashed first. The people or models who author instances have not seen the rules file or the tool output. The tool is run once per instance after all instances are frozen. (This avoids tuning rules to the injected defects.)
2. **Location recall.** An instance counts as covered if at least one MUST item has the instance's file and a line range overlapping the injected lines (or `deleted` for a deleted file). SHOULD-only coverage does not count towards the headline, and recall is also reported with S7 and S11 disabled, because a rule that flags whole files covers everything trivially. Primary: location recall per class, with a Wilson 95% interval, over the classes the tool claims to cover.
3. **Rule-family recall.** Stricter: the firing rule belongs to the family expected for the class (declared in a mapping file frozen with the rules file). Reported beside location recall, because location can match for the wrong reason.
4. **Reading burden.** Median and 90th percentile of flagged lines over changed lines, and of flagged files over changed files, on (a) the injected diffs and (b) the clean-diff corpus. Reported with recall as a pair; high recall at a burden near 100% is not a result.
5. **False positives.** Items per clean diff; share of clean diffs with at least one MUST item.
6. **Escape-conditioned view (the useful one).** Among the instances that every automated net layer missed (the escapes of P2), what share does the tool list? This is the share of the human-read problem the tool narrows. Classes with low tool recall and high escape rate are the list of what a human still reads in full.
7. **Held-out set, the primary figure.** The natural escapes from E2E-1 runs (defects found by the sealed acceptance suite, the human checks or the judges that no net layer flagged in the run) are the headline test, never used to edit the rules before they are scored. Recall on the injected set is secondary: rules S2, S3 and S8 detect the very edits that injection authors write naturally (suppression markers, deleted tests), so high injected recall on mechanical classes is nearly guaranteed. Instances are authored from the class list alone by a person who has not read this specification or the rules file, and a share of instances is authored by a second independent person; the escape-conditioned view (item 6) is reported per arm of the study that produced the escapes and applies only to the nets those repositories had (in bundle arms S2 and S3 duplicate the gates). Rules edited afterwards are a new version with a new freeze.
8. **Stated targets (provisional, set before data):** location recall at least 0.80 on each of S2, S3, S5, S8 classes (mechanical ones); no target for the classes in section 6, where low recall is an expected finding; burden median at most 0.25 of changed lines on clean diffs. Missing a target is reported, not rescued by editing rules.

## 9. Open items

Per-stack pattern lists (which stacks first: the fixtures decide); how a criterion index is declared in repositories that lack one; whether S7 is useful enough to keep (HR-1 decides; it may be dropped); who authors the clean-diff corpus (a person not involved in the rules); whether a later version reads the substrate's ledger to suppress items already explained by a recorded decision (not in this version).
