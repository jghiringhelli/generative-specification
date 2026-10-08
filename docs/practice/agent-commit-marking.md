---
layout: default
title: Agent commit marking and signed ratification
parent: Practice
nav_order: 10
permalink: /practice/agent-commit-marking/
description: "How a team marks commits made with an AI assistant, who may ratify a protected change, how ratifications are signed, a three-level adoption, and what no hook can see. Design, tools tested, not yet in a registered run."
---

# Agent commit marking and signed ratification

**Status: design, tools tested, not yet in a registered run.** The tools (`tools/gs-decide/`: `gs-decide.mjs`, `gs-decide-hook.mjs`, `gs-attribution-hook.mjs`, `gs-decide-ci.mjs`) pass their own suite (57 tests on Windows and in a Linux container, no model). Nobody has yet run this rule set on a model-written project and registered what happened. Read the limits first; they decide how much to adopt.

## The problem

An assistant that commits to your repository leaves two questions the history does not answer: **which commits did an agent write**, and **who took responsibility for the changes that matter** (the spec, the gates, the ratchet floor, a waiver). A plain `git log` answers neither. The decisions log of [gs-decide](/method/functions-map/) already records that a named identity gave a reason; this page adds marking of agent work and a signature on the reason.

## Prior art this follows

- The Linux kernel's `Documentation/process/coding-assistants.rst` (added 2025-12-23) defines the trailer `Assisted-by: AGENT_NAME:MODEL_VERSION [TOOLS]`, forbids an AI agent from adding `Signed-off-by`, and keeps accountability with the human who submits. (Verified by a web search on 2026-10-08.) Apache and Fedora are reported to follow comparable rules; that was seen only in search summaries and is not checked.
- Claude Code adds `Co-Authored-By` trailers to commits it makes.
- Git can sign commits with an SSH key (`gpg.format=ssh`, since git 2.34) and verify them against an `allowed_signers` file: the private key signs, the public key verifies. `ssh-keygen -Y sign` and `-Y verify` do the same for any text, which is how the decisions log signs its entries.

## The rule set

1. **Who may ratify.** Only a person who holds a role in `docs/decision-roles.json` for the class of the change (spec, gate, ratchet, waiver). An assistant never ratifies. It proposes: it prints the exact `gs-decide add` command with a draft reason and stops.
2. **Keys.** Each person has an SSH key listed in the same file under `keys`. An assistant that needs to sign anything gets its own key, listed under an identity with the role `agent`. An entry signed by an agent key is a note. It is never a ratification.
3. **How agent commits are marked.** A commit made with an agent carries `Assisted-by: AGENT:MODEL [TOOLS]` (for example `Assisted-by: claude-code:claude-sonnet-5-5`) or the tool's own `Co-Authored-By: Name <email>`. A person may add the line, or the tool the person runs may.
4. **No agent sign-off.** An agent never adds `Signed-off-by`. A commit whose `Signed-off-by` names an agent identity is refused.
5. **Protected paths.** A marked commit that touches a protected path (see `gs-decide.mjs protected`) needs a ratification entry, in the same or an earlier commit, that is signed, verifies, and comes from a non-agent key held by a person with an allowed role.
6. **Server side.** The same checks run in CI over the range of commits, because a local hook can be skipped.

## What the hook enforces, and what it cannot

| Enforced (when on) | Where |
|---|---|
| A1 an agent `Signed-off-by` is refused | commit-msg, pre-push, CI |
| A2 a malformed `Assisted-by` or AI `Co-Authored-By` is refused | same |
| A3 a commit under an agent identity with no marking is refused | same |
| A4 an agent environment variable (such as `CLAUDECODE`) is set and the message has no marking: refused (heuristic) | commit-msg only |
| A5 a marked commit on a protected path with no verified human ratification is refused | same |
| An unsigned or tampered ratification entry does not count | decide hook, `verify`, CI |
| A commit on a protected path without a good signature of a listed, non-agent key is refused (optional) | `--commit`, `--range`, pre-push, CI |

**What no hook can see, said plainly.**

- **An agent session that writes no marking**, under a person's identity, with no agent environment variable, is indistinguishable from the person's own commit. Marking is a practice; a tool cannot compel a liar or an oblivious tool.
- **A signature proves custody of a key, not human intent.** An agent running with a person's unlocked key (loaded in an agent, or no passphrase) can sign as that person. A key that needs a physical touch (a FIDO2 security key) raises the bar, because an agent cannot touch the device. Whether that holds in your workflow is **to be verified in practice**; it has not been tested here.
- **`git commit --no-verify` skips every local hook.** CI must re-check on the shared branch (`gs-decide-ci.mjs --base origin/main`) and the check must be a required status check. GitHub's branch-protection setting named **Require signed commits** makes GitHub refuse commits it does not consider verified; it uses GitHub's own notion of verified, so it complements the roles mapping and does not replace it. Protect the workflow files and `docs/decision-roles.json` with CODEOWNERS and required review.
- **The reviewer may not have read the diff.** A ratification records responsibility, not understanding.

## Three levels of adoption

A small team should not carry all of this at once. Move up when the lower level has been boring for a while.

| Level | What you do | What it costs | What it buys |
|---|---|---|---|
| **L0 Trailers only** | The team agrees on `Assisted-by` or `Co-Authored-By` for agent work, and never `Signed-off-by` from an agent. No tool. | Nothing. | The history can be filtered for agent work. Nothing is checked. |
| **L1 Trailers plus the hook** | Install `gs-decide` and `gs-attribution-hook` (`attribution.enabled: true`) as commit-msg and pre-push hooks; protected paths need a gs-decide entry (unsigned, a named identity). | An hour; a ratification entry when a protected file changes. | A malformed or missing marking and an agent sign-off are refused locally; protected changes need a recorded reason. A person can still skip the hook. |
| **L2 Signed ratifications plus CI** | Keys and roles in `docs/decision-roles.json`; `decide.requireSigned: true`; `gs-decide-ci.mjs` as a required check; optionally `requireSignedCommits`. | Key management; every person signs ratifications; a lost key is a ratified change. | A protected change needs an entry that verifies against a key a person holds, and an agent key never counts; skipping a local hook is caught on the server. |

## Setting it up and proving each level

The formula in [`docs/formulas-drafts/agent-commit-marking.md`](/docs/formulas-drafts/agent-commit-marking/) (English and neutral Spanish) tells an assistant how to install the tools at the level you choose, how to prove each rule red and then green on a throwaway branch, and how the assistant itself must behave. It is a draft and has not been run in a registered experiment.

## Where it fits

In the [functions map](/method/functions-map/) this belongs to **Decide** (the person who ratifies, the roles, the signature) with **Check** at the hook and in CI (the refusal, the range re-check). It is the first implementation of the "ratification record with a required-marker hook" that the map ranks as the top gap in Decide, plus its signed form. See also [the whole lifecycle](/method/lifecycle-whole/).
