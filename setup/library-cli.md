---
layout: default
title: Library or command-line tool
parent: Set up GS
nav_order: 3
permalink: /setup/library-cli/
description: "Setting up GS on a library, package or command-line tool: what to write in the spec and which library gates apply, including the TypeScript and JavaScript set."
---

# Set up GS: library or command-line tool

For a package other code imports, or a tool run from a terminal. Read [Set up GS](/setup/) first for the three questions and the shared base. The [command-line tools guide](/domains/cli/) goes deeper on the terminal side.

## What to write in the spec

- The public surface: every function, class or command a user may call, with inputs, outputs and errors. Anything not listed is private.
- Compatibility: which versions of the language and of your dependencies are supported, and what counts as a breaking change.
- For a command-line tool: every command, flag, exit code and where output goes.
- How it is installed and how a new version is released.

## TypeScript and JavaScript gates

These gates in the library apply to TypeScript or JavaScript code. Read each file for its exact command.

**Types and imports**
- `typescript-strict-mode`, `tsc-no-emit-exits-zero`, `no-any-type`
- `node-esm-cjs-safe-imports`: the package loads under both module systems it claims to support.

**Size and structure**
- `file-length-max-300`, `function-length-max-50`, `max-function-parameters`, `cyclomatic-complexity-max-10`
- `no-circular-dependencies`, `no-unused-exports-dead-code`, `no-duplicated-code-in-diff`, `no-duplicate-string-literals`

**Tests**
- `jest-no-failed-tests`, `coverage-threshold-80`, `mutation-score-threshold`

**Documentation and hygiene**
- `jsdoc-public-functions`: every public function is documented.
- `no-console-log-production`, `npm-audit-no-high-cve`

The thresholds in the gate names are the library's defaults. Set yours deliberately, record why, and tighten them over time instead of loosening them.

## Other languages

For Python the library has `python-dependencies-pinned` only. For Java, Go, Rust, C# and others it has the gates tagged `ANY` and nothing more. Write the rules in the spec, and [propose a gate](/quality-gates/CONTRIBUTING.html) when one of them becomes a check that works.

## Next

[Refine the spec when the assistant repeats a mistake](/practice/refinement/).
