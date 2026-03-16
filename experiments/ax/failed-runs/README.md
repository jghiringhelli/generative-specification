# Failed / Aborted Experiment Runs

All runs are preserved here for full transparency and disclosed in RESULTS.md §11.

---

## `control-run1-no-strict-mcp/`

**Date**: 2026-03-13  
**Session ID**: a3a3a91b-9d98-4b09-9bd8-809b6ed33eba  
**Runner flags at time of run**: `--tools "" --print --output-format json`  
**Missing flag**: `--strict-mcp-config`

**Failure mode**: The runner disabled Claude's built-in file-write tools (`--tools ""`),
but did NOT disable workspace-registered MCP servers. The `forgecraft-mcp` server
was registered globally in `~/.claude/settings.json`. The model detected ForgeCraft MCP
tools starting at prompt 2 and began responding with refusals and scaffolding summaries
instead of code.

**Partial results**:
| Prompt | Size | Code blocks | Status |
|--------|------|-------------|--------|
| 01-auth | 32.4 KB | 14 | ✅ Good |
| 02-profiles | 1.5 KB | 0 | ❌ MCP-confused summary |
| 03-articles | 30.5 KB | 7 | ✅ Good (context window still had P01 momentum) |
| 04-comments | 16.3 KB | 7 | ✅ Good |
| 05-tags | 0.7 KB | 0 | ❌ MCP-confused summary |
| 06-integration | 2.7 KB | 0 | ❌ MCP-confused summary |
| 07-tests | 0.8 KB | 0 | ❌ MCP-confused summary |

**Root cause**: `forgecraft-mcp` globally registered → model saw `add_module`,
`setup_project` tools → decided it was in agentic context → refused to output raw code.

**Fix applied**:
1. Removed `forgecraft-mcp` from `~/.claude/settings.json` (global)
2. Added it to `forgecraft-mcp/.claude/settings.json` (project-local only)
3. Added `--strict-mcp-config` flag to runner — suppresses all workspace MCP servers

---

## `treatment-run1-summary-mode/`

**Date**: 2026-03-13  
**Session ID**: cd260003-0e7b-4545-b09f-4a19ead4800e  
**Runner flags at time of run**: no `--tools ""`, no `--strict-mcp-config`

**Failure mode**: Claude Code 2.1.70 in `--print` mode with piped stdin attempted to use
file-write tools for every response. Tool permission prompts cannot be answered in
non-interactive/piped mode, so no files were ever written and each response was a
work-summary (~900 chars, 0 code blocks).

**All 6 prompts**: short summaries (860–4916 chars, 0 TypeScript code blocks). Run
output discarded; output directory cleared before rerun.

**Fix applied**: Added `--tools ""` to runner args to disable all built-in tools,
forcing the model to output code in fenced code blocks as directed by system prompt.

---

## `treatment-run2-missing-strict-mcp/`

**Date**: 2026-03-13  
**Session ID**: 241716d3-9a0a-4522-8697-4ea533e45c2f  
**Runner flags at time of run**: `--tools ""` (no `--strict-mcp-config`)

**Failure mode**: Same as control-run1. `forgecraft-mcp` still globally registered at
time of this run. Prompts 1–2 produced real code (145s, 112s) but P3–P6 collapsed
into MCP-confused summaries once the model fully explored its tool context.

**Partial results**:
| Prompt | Size | Code blocks | Status |
|--------|------|-------------|--------|
| 01-auth | 36.5 KB | 15 | ✅ Good |
| 02-profiles | 25.9 KB | 10 | ✅ Good |
| 03-articles | 1.4 KB | 0 | ❌ MCP-confused summary |
| 04-comments | 0.7 KB | 0 | ❌ MCP-confused summary |
| 05-tags | 0.5 KB | 0 | ❌ MCP-confused summary |
| 06-integration | 0.9 KB | 0 | ❌ MCP-confused summary |

Run output discarded; output directory cleared before final rerun.

**Fix applied**: Same as control-run1 (removed global registration + `--strict-mcp-config`).
