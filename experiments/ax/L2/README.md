---
nav_exclude: true
---

# L2 — + Harness (Tests as an Executable Gate)

Ablation rung **L2 = L1 + a verification harness: tests written as an executable gate.**

## What this rung isolates

L1 derives the whole system from the complete specification but says nothing about
verification. L2 adds exactly ONE thing: the **tests-as-gate discipline**. The model is
told to write tests as the executable definition of done — unit tests for pure logic,
integration tests for every endpoint (success, validation, auth, not-found), a coverage
floor — and to treat a passing suite, not a plausible-looking implementation, as the
completion criterion.

The marginal delta L2 - L1 isolates the value of the **verification loop** (the harness),
holding spec, model, flags, and derivation style constant.

## Honest scope note (pre-registered)

The generation runs with no file/shell tools (`--tools ""`), so the model cannot itself
execute the test suite inside the loop. At L2 the harness is therefore the tests-as-gate
**discipline specified in the prompt**, not a model-executed verify loop. What is measured
is whether specifying the gate changes the artifact the model emits — test count,
integration coverage, and executed coverage when `measure.cjs` runs the suite against a
live Postgres afterwards. The executed verify loop (model runs tests, reads failures,
repairs) is a distinct, tools-on condition, out of scope for this stateless-emit ladder.

## What to Build

Conduit, as in L1, from the complete specification — but with tests as the gate.
Node.js + TypeScript.
