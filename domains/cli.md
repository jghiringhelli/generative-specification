---
layout: default
title: CLI Tools
parent: Domain Guides
nav_order: 5
description: "GS methodology for command-line tools, developer utilities, and terminal applications"
---

# GS for CLI Tools

## Why This Domain Is Different

CLI tools have strict **contract obligations** that web services do not: exit codes must be predictable, stdout must be machine-parseable when requested, interactive prompts must be suppressed in non-interactive (CI) mode, and `--help` text is part of the public API.

A CLI tool that prompts for input when run in a pipeline, or exits 0 on error, will silently corrupt automated workflows.

## Relevant Tag

`CLI` — activates CLI-specific gates and verification strategies.

## Active Quality Gates

| Gate | Why it matters here |
|---|---|
| [conventional-commits](../quality-gates/gates/conventional-commits.yaml) | CLI tools installed globally; users need reliable changelog for upgrade decisions |
| [no-hardcoded-secrets](../quality-gates/gates/no-hardcoded-secrets.yaml) | API keys embedded in CLI binaries are a common leak vector |
| [environment-variables-config](../quality-gates/gates/environment-variables-config.yaml) | Endpoints, timeouts, output formats must be configurable via env |
| [coverage-threshold-80](../quality-gates/gates/coverage-threshold-80.yaml) | Business logic in CLI tools is pure and highly testable |

### Domain-Specific Gates Needed (Contribution Targets)

| Gate ID (proposed) | GS Property | Description |
|---|---|---|
| `exit-code-contract` | Verifiable | All non-zero exit codes are documented; tests assert correct codes per error type |
| `no-interactive-in-ci` | Defended | `process.stdin.isTTY` checked before any prompt; `--no-interactive` flag exists |
| `json-output-parseable` | Verifiable | `--json` flag output passes `JSON.parse()` on all exit paths |
| `help-text-complete` | Complete | Every command and flag has non-empty description in `--help` output |
| `smoke-test-pty` | Executable | node-pty / pexpect harness runs the binary end-to-end in a pseudo-terminal |

## Verification Strategy

CLI tools are verifiable through multiple mechanisms:

| What to verify | How |
|---|---|
| Exit codes | Unit tests that assert `process.exitCode` for each error path |
| Output format | Snapshot tests on `--json` output; schema validation |
| Interactive behavior | node-pty or pexpect harness: spawn, send input, assert output |
| Non-interactive safety | Assert that no `readline` or similar is called when `isTTY === false` |
| Help text | Parse `--help` output; assert all registered commands have descriptions |
| Install integrity | `npx <package>@latest --version` in CI after publish |

## `node-pty` Smoke Test Pattern

```typescript
import * as pty from 'node-pty';

it('accepts input and exits 0', (done) => {
  const term = pty.spawn('node', ['dist/cli.js', '--interactive'], {
    name: 'xterm-color',
    cols: 80,
    rows: 24,
  });
  let output = '';
  term.onData((data) => { output += data; });
  term.onExit(({ exitCode }) => {
    expect(exitCode).toBe(0);
    expect(output).toContain('Done');
    done();
  });
  // Simulate user input after prompt appears
  setTimeout(() => term.write('my-project\r'), 200);
});
```

This is the CLI equivalent of Playwright: spawn the real binary in a real terminal, interact, assert.

## Spec Patterns

A GS PRD for a CLI tool must include:

1. **Command inventory** — all commands and subcommands with their purpose
2. **Exit code table** — which error conditions produce which codes (0 = success, 1 = general error, 2 = usage error is a minimum starting point)
3. **Output contracts** — which commands support `--json`, what the schema is
4. **Interactive vs non-interactive** — which commands prompt, and what happens when stdin is not a TTY
5. **Distribution method** — `npx`, global install, Homebrew tap, binary download; affects packaging constraints

## Contribute a Gate

Most underrepresented GS properties for CLI: **Executable** (pty-based smoke test) and **Complete** (help text coverage).

See [CONTRIBUTING.md](../quality-gates/CONTRIBUTING.md).
