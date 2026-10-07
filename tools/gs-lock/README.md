# gs-lock: the reference spec lock and co-change gate

Three files, Node 18+, no dependencies, no model, no network, MIT (see `../LICENSE`). Copy them into a project **unchanged**, side by side (`tools/gs-lock/`): `gs-cochange.mjs` and `gs-redproof.mjs` import `gs-lock.mjs`.

**Status: written to the canon; tested only by its own suite (75 tests, below); not yet used in a registered run on a model-written project.** The design is the one verified once on one sample project in the lab (35 scenarios, `DIVERGENCE-SENSORS.md`); this is the first single-file implementation of it that is not tied to that project.

## What it is

A lockfile for the link between a spec and what was derived from it.

- **The tag**, one comment line in any file that derives from the spec: `@gs <id> <spec-path>#<section>`, for example `// @gs F-001.2 docs/spec/F-001-hive.md#f-001-register-a-hive`. No hash in the code, so a spec change never forces a code edit. The section is the GitHub-style anchor of a heading (lowercase, spaces to hyphens, punctuation removed, `-1` for a repeated heading) and covers the heading's text **up to the next heading of the same or a higher level**. For the older layout also accepted: a bold label (`**Rules**`), `rule-N`, `criterion-N`.
- **`docs/spec.lock`**: `S <spec-path>#<section> <hash>` and `A <artifact> <id> <spec-path>#<section> <hash>` lines, sorted, LF. The hash is 16 hex of the SHA-256 of the section text with `* _ \``, list markers, tick state and whitespace removed.
- **`docs/ratifications.md`**: append only; one line per ratification: when, who (git identity), artifact, id, section, old and new hash, reason.

## Commands

```
node tools/gs-lock/gs-lock.mjs init [--prune]                       first lock from the tags; later: add new tags (existing hashes untouched)
node tools/gs-lock/gs-lock.mjs check [--json] [--require-coverage]  exit 1 on UNLOCKED STALE LOCK-BEHIND DANGLING MISSING-SOURCE MISMATCH MALFORMED CONFLICT NOLOCK
node tools/gs-lock/gs-lock.mjs ratify <file>|--all [--id <id>] --reason "<15+ chars>"
node tools/gs-lock/gs-lock.mjs resolve                              after a git merge conflict in the lock
node tools/gs-lock/gs-lock.mjs commit-check                         pre-commit: no forged hash, a moved hash has its record, the record only grows
node tools/gs-lock/gs-lock.mjs diff <base> <head>                   report for the person who signs
node tools/gs-lock/gs-cochange.mjs --msg-file <file>                commit-msg hook
node tools/gs-lock/gs-cochange.mjs --range <base>..<head>           CI (also --commit <rev>, --pre-push)
node tools/gs-lock/gs-redproof.mjs stale|uncited|breaking-refactor  the red proofs, one command each: plant in a throwaway clone, run the gate, exit with the gate's code
```

`UNCOVERED` (a spec id that no tag points at) is **reported**; it fails only with `--require-coverage`, because a spec written before its code would otherwise keep the gate red.

Optional `.gs.json` at the root: `specDirs`, `specRoots`, `testCmd`, `testPattern`, `sourcePattern`.

### Wiring (the project's hooks and the one command)

```sh
# .githooks/pre-commit  (committed executable: git update-index --chmod=+x)
node tools/gs-lock/gs-lock.mjs check && node tools/gs-lock/gs-lock.mjs commit-check
# .githooks/commit-msg
node tools/gs-lock/gs-cochange.mjs --msg-file "$1"
# .githooks/pre-push
node tools/gs-lock/gs-cochange.mjs --pre-push
```

and `node tools/gs-lock/gs-lock.mjs check` plus `node tools/gs-lock/gs-cochange.mjs --range origin/main..HEAD` in the one command and in CI. In CI use `fetch-depth: 0`.

## The co-change gate

A commit that changes source (code files outside tests, `docs/`, `scripts/`, `tools/`, hooks and config files) must **cite an id the spec defines** in its message, or **stage a change to a spec file**, or be typed `refactor:`. A refactor must pass the **parent commit's tests, unchanged**, against the new source (a temporary git worktree; edits to test files in the same commit are ignored). A refactor that changes a spec is refused. A cited id whose letters the spec uses but that the spec does not define is refused (`UTF-8` in a message is not an id). `Waiver: <reason>` lets an uncited change through, printed; a refactor waiver also needs `Ratified-by:`.

## What it does not detect

- **A WRONG spec.** It detects that spec and artifact diverged, never that the spec is right.
- **A tag that lies by omission**: a file tagged with a rule it never implements stays current. The lock says which version it was derived against; the tests say whether it satisfies it.
- **A refactor at an edge no test pins** passes as a refactor (scenario P25). The remedy is a criterion and a test at that edge.
- **A refactor that moves a file the tests import** fails the proof (known false positive, N35): type it as a change that cites an id, or use `Waiver` plus `Ratified-by`.
- **`ratify` run by an agent.** It is a command; the trace stays (who, when, why) but a local hook can be skipped. The real enforcement is a person reviewing `docs/ratifications.md` on a protected branch (CODEOWNERS on the lock and the record) and CI on the server, which a clone cannot show.
- **A typo fix is a change**: it stales the artifacts and needs a ratification. Positional ids (`criterion-3`) shift when a criterion is inserted; explicit ids (`F-001.3`) do not.
- The refactor proof needs a test command (`.gs.json` `testCmd`, or `npm test`, or pytest); without one the gate refuses with exit 2 instead of passing.

## The E10 probe fix (so a checker can verify the lock)

The development loop of 2026-10-06 found the "an unlocked edit is accepted" probe ill posed: it appended a trailing section to the **same** spec file. With nested sections (or with a lock that treats the whole file as one unit) that edit lands **inside** a locked section, so a block cannot tell a lock from a frozen spec. The fix, implemented in `tools/gs-check/gs-check.mjs`:

1. **Drift probe**: edit one sentence **inside** the tagged section, in the working tree of a throwaway clone; `check` must exit non-zero and name `STALE`.
2. **Twin (control)**: add a **new spec file** (never inside any locked section); `check` must exit 0. A tool that rejects every spec edit fails the twin.
3. **Ratify path**: `ratify --reason` refused without a reason; with one, `check` exits 0 again and `docs/ratifications.md` grows by one line; `commit-check` accepts the staged result and refuses the same lock change without the record.
4. **Wiring**: the same drift, committed, is blocked by a commit or push hook (default mode may also credit a script; strict mode does not).

## Tests

```
node --test tools/gs-lock/test/gs-lock.test.mjs      # 75 tests, about 30 s on Windows, 10 s in a Linux container
```

`P1` to `P35` are the 35 scenarios of the lab divergence self-test (lock, ratify, commit check, record, UNLOCKED, DANGLING, orphans as MISSING-SOURCE and MISMATCH, tag neutrality, intent diff, the refactor proof and its limit, the cascade); `N1` to `N40` are new edge cases (CRLF and BOM, conflict markers and `resolve`, fenced tags, comment styles, heading anchors and nesting, Spanish anchors, the twin of the drift probe, no lock, first commit, hooks end to end, range, pre-push, the red proofs against a good and a neutered gate). Two ports are reinterpretations, said plainly: the lab's inverse inventory of routes and exported symbols (S4, stack specific) is replaced by `UNCOVERED` (P32 to P35, spec side); the lab's `covers` tags (S1) are replaced by MISSING-SOURCE and MISMATCH on `@gs` tags (P16 to P19). Everything runs without a model and without the network; no test depends on the Windows or POSIX shell.
