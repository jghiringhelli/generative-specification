---
layout: default
title: Refine the spec, triage first
parent: Practice
nav_order: 9
permalink: /practice/refinement/
description: "When a check fails or a rule is missing, first say which case it is: not every failure needs a spec change. The triage, the rule for a working team, and what a hook can enforce versus what only the sentinel text or a person can."
---

# Refine the spec: triage first

When a sensor fails, a defect turns up, or the agent needs a rule, a feature or a tool that the spec does not have, the reflex is to patch. That reflex has two opposite failure modes. One patches code the spec never justified, so the spec stops describing what runs. The other rewrites the spec after every bug, which is noise.

This page gives a single question that separates the two, and the rule a team can put in its sentinel so that the agent asks it before acting.

**Status: design.** The rule was checked deterministically (no LLM) on one small sample project, and run once with a real agent on that project. That is a demonstration, not a measured effect. Nothing here says how often an agent will follow it.

## The question

**Does the ratified spec already require the right behavior?**

Say the answer before acting. Then the case decides the work.

| Case | What it is | What to do | Who ratifies |
|---|---|---|---|
| **a** | The spec is right and the code deviates from it (a technical error from spec to code) | A regression test that cites the criterion it breaks. Watch it **fail against the current code**, then fix. **No spec change.** | Nobody new: the criterion was already ratified |
| **b** | The spec is silent or ambiguous and something was assumed | State the gap first: a criterion or rule with an id in the spec, or a numbered entry in a fixes file when no criterion covers it. Then the tagged test, seen failing, then the code | A person ratifies the wording |
| **c** | The spec says something other than what was intended | A change event: ask, change the spec, record the decision (an ADR), run every check again | A person ratifies |
| **d** | A tool or a sensor is missing | Add it, list it in the sentinel | A person ratifies |
| **e** | Someone found a way around a gate | Save it as a **permanent test case for the gate**. The number of these cases only goes up (a ratchet) | A person reviews |

Order in a, b and c: write the test that shows the problem, see it fail against the current code, and only then change the design. If the design changes first (for example a new interface), the test may fail to load, and that proves nothing about behavior.

Two points from experience with agents:

- **The AI can propose the refinement** in case b, and can derive the tests and gates from it. It does so when it is told to, and told to derive. A person still ratifies anything that changes behavior.
- **Case a is not a spec problem.** Forcing a spec edit for every defect trains everyone to ignore spec edits. If a defect is real but no criterion covers it, that is itself a signal that the case is b.

## The rule to put in the sentinel

A short block a team can paste and adapt. Keep the sentinel small: the whole file is loaded on every turn.

```
When something fails or is missing, say which case it is BEFORE acting.
Question: does the ratified spec already require the right behavior?
a  spec right, code deviates: regression test citing the criterion, seen failing on the current code, then fix. No spec change.
b  spec silent or ambiguous: state the gap as a criterion or numbered fix entry; a person ratifies; derive the test; red first; implement.
c  spec contradicts the intent: change event; ask; change the spec; write the ADR; rerun every check.
d  tool or sensor missing: add it under the sensors folder and list it here; a person ratifies.
e  way around a gate found: add a NEW test case for the gate. Cases are only ever added.
Never mark anything ratified on a person's behalf.
```

## What forces what

Be clear about which part of the rule is a **guide** (the text asks, the agent may ignore it) and which part a **sensor** enforces (a deterministic check fails the commit or the push). The terms are defined on [Quality gates](/method/gates/).

| Part of the rule | Guide only | Enforced by a local hook | Enforced only by a server check or a person |
|---|---|---|---|
| Choose the right case | The agent classifies | A commit of type `fix:` without a declared case is rejected. The hook cannot know that the case is the right one | |
| a: cite an existing criterion, tagged test | | The cited id must exist and a staged test must carry it | |
| a: a defect no criterion covers is not case a | | Case a citing a fix-entry id is rejected (that is case b) | |
| b: state the gap in the same commit | | A spec file or the fixes file must be staged | |
| b, c: a person ratifies | Ask before changing behavior | Not enforceable: a hook can only require a marker such as `Ratified-by:` in the message, and an agent can type it | A person |
| c: record the decision | | An ADR must be staged with the spec | |
| d: name the tool in the sentinel | | The sentinel must be staged with the sensor | |
| e: bypass becomes a permanent case | | The count of gate test cases must go up, and may never go down | |
| Red first | Write the test before the code | At push: for `fix:` commits, each new test is run against the parent's source, and a test that already passes there is rejected | |
| Every criterion has a check; ticks are claims | | A ticked criterion with no tagged check fails | |
| Hooks installed | | A prepare script sets the hooks path on install, so a fresh clone has them | |
| **Skipping the hooks** (`git commit --no-verify`) | | **Cannot be enforced locally** | A check on the shared branch, in CI or on the server |

Three consequences:

1. **Local hooks are not a wall.** One flag skips all of them. What enforces a rule is a check on the shared branch that nobody can omit from their own machine. In the sample project this server-side check was not built.
2. **Ratification is human.** No hook can verify that a person really ratified. A marker in the commit message is an audit trail, not proof.
3. **Choosing the case before acting is a guide.** A hook sees the commit, not the thinking before it. Ask for the case in the prompt and check it in review.

## One run, honestly

On a small sample project (Open Diamond, a booking app for youth baseball fields) an agent was given five audit findings and the sentinel with this rule, and no steps. One session, one model, one operator who wrote the sensors.

- For the payments defect it said **case b** before acting, wrote the gap as a numbered fix entry, marked it pending ratification, wrote a test that failed by assertion against the old code, and then fixed it. The live probe after the fix passed.
- For the gate bypasses it said **case e**, rewrote the gate as an allow-list, and added four permanent test cases (ten to fourteen, none removed).
- It stated a case for two of the five findings. For the other three it acted without naming the case.
- It stopped and asked a person before adding a new dependency, as the sentinel requires.
- It worked while the type check was already red, and the number of type errors went **up** (five to eleven). No sensor blocks a commit for a type-error count that rises. A type-error ratchet at commit (the count may not exceed the last commit's) would close it. It is a proposal, not built.

This is one observation. A different day, a different model or a longer project may behave differently, and nothing here is a rate.

## Where it fits

- [Structural gates](/practice/structural-gates/): the remediation loop there handles a finding once you know its case. This page says which case it is.
- [Remediate an existing system](/practice/remediation/): the protection (oracle tests) that case a and b assume.
- [Lifecycle and debt](/method/lifecycle/): the triage as a definition (section 4 of six), next to the debt ratchet, criteria coverage, "governed as of" and spec completeness.
