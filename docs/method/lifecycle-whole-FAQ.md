---
layout: default
title: The whole lifecycle, five hard objections
parent: The Method
nav_order: 11
nav_exclude: true
permalink: /method/lifecycle-whole/faq/
description: "The five hardest objections an executive or a skeptical engineer would raise to the proposed whole-lifecycle structure, with honest answers."
---

# The whole lifecycle: five hard objections

Companion to [the whole lifecycle](lifecycle-whole.md). Status: proposal, design only. The answers say what is known, what is not, and what would change the answer.

## 1. "This is spec-first, CI gates and an audit log with new names."

At the level of the names, yes. The five functions are not novel and the page does not claim they are. A critic given only the Compendium said the same: each function maps to known practice (spec-driven tools, CI gates, decision records, governance reporting, human approval).

What is distinct is not the list but four constraints the list leaves out unless you state them: the checker is a program the executor cannot edit and not the model that wrote the code; the executor has no write access to the acceptance criteria or the gates; the record is tied to the spec version that produced each artifact (the lock); and the baseline only moves in one direction. Whether those constraints change outcomes is not shown. The evidence is small, one author and mostly one model family. If the constraints turn out to add nothing over disciplined use of the known tools, this structure is a checklist, and should be called one.

## 2. "You added two functions when the first version had holes. That is fitting, not discovering."

Fair. The first set of three was tested and failed: ratifying and reporting state were missing, and "stop" bundled finding things with blocking them. Five came from that failure, and a second round of two critics rated it "pass with changes" (one counted about 56% of 84 mechanisms mapping cleanly to one function, 83% with no forced fit). A set that grows by absorbing its leftovers can be over-fitted to the one text it was built from.

What would show it is wrong: a mechanism in the Compendium that fits none of the five or the two invariants, or evidence that merging two functions loses no distinct failure. The structure names that test. The critics so far are one model family; a vendor-diverse repeat is owed and is not done.

## 3. "Does it cover the whole lifecycle? Your own table says disposal and keeping the lights on are not covered."

No. The method's own lifecycle table marks keeping the lights on and disposal as not covered, post-mortem and auditability as partly covered. The matrix gives each a proposed cell and says "design only". It does not claim coverage; it says where an artifact and a check would go. Most business-side cells (KPIs, release-to-KPI, due diligence, retirement) have no formula, no tool and no evidence. A literature check found no existing framework that covers due diligence readiness, technical debt as a lifecycle object, or retirement of AI-generated systems either. That makes the gap real, not a reason to say it is filled.

## 4. "What does this cost, and when is it not worth it?"

The substrate has to be built and kept true: specification upkeep, ratifications (including trivial ones), tagging, gate waits and failed-gate loops. In one early experiment the structured run cost about 2.9 times an unstructured one per generation, and 1.4 times an expert prompt, with no return on the single-shot measures. Ratifying a text is not understanding the code. The author's expectation, a hypothesis, is that it pays for long-lived, multi-contributor or audit-sensitive work and not for spikes, prototypes or short-horizon tasks, and that a disciplined expert doing the same things by hand may match it at small scale. The page's own rule is minimal-sufficient: most cells are empty on purpose, and any added artifact has to earn its place. An executive deciding whether to adopt should start with the three cells chosen for building next and stop if they do not pay.

## 5. "Who accepts these artifacts: an auditor, a buyer, a regulator?"

Unknown. The claim that change governance is satisfied by construction, and that a snapshot line is useful evidence, are design only and untested with any auditor or regime. The free scorecard is coarse and read by a model, so it is not a governance claim, and "governed" is reserved for a defined snapshot with its evidence, never "certified". The due-diligence bundle is a list of existing files assembled for a reviewer, not a verdict. What can be said is narrower: the information an auditor or a buyer's reviewer would ask for (what was decided and why, what changed between two dates, which checks ran and what they showed) is kept in files, not in people's heads. Whether that is enough is for them to say, and for a test with a real reviewer to find out.
