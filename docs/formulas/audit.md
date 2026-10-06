---
layout: default
title: "9. Audit: the free scorecard"
parent: Formulas
nav_order: 9
permalink: /formulas/audit/
description: "A first look at a project against the seven properties: one letter per property with its evidence, and a task list. The audit prompt itself stays canonical at pragmaworks.dev; this page tells you how to run it and how to check the result."
---

# 9. Audit your project: the free scorecard

**Status: written to the canon, not yet tested in a registered run (the follow-up prompt and the checks below).** The audit prompt itself is not on this page: **the canonical text lives at [pragmaworks.dev/audit](https://pragmaworks.dev/audit)** and stays there until a coordinated release aligns it. This page references it and does not copy it, so there is one text to keep true. In the course lab, the letters part of the published audit ran three times on a sample project, with a neutral setup; the other parts were not run (one assistant, one observation each, not a rate).

## When to use

A first look at a project, before and after [2. Adopt](/formulas/adopt/), or before you decide what to fix first. You get **one letter (A to F) for each of the seven properties**, each with the evidence behind it, and a prioritized task list. **Not for:** a governance claim, a compliance statement or an overall grade. The scorecard is coarse by design. A paid assessment is finer and lives at [pragmaworks.dev](https://pragmaworks.dev).

## How to run it

1. Open a **fresh session** in the project folder, with no history. Do not run it in the session that built the project.
2. Paste the audit prompt from [pragmaworks.dev/audit](https://pragmaworks.dev/audit) exactly as it is.
3. If the answer includes an overall grade, ignore it: the canon has one letter per property and no overall grade. If it scores Executable on a project with no formal behavioral contract to run, record Executable as N/A, not F.
4. Then paste this follow-up in the same session.

## The follow-up prompt

<div class="prompt-pair" markdown="1">
<div markdown="1">

**English**

```text
Check your own report. For each letter, is the evidence a file and line, or a command you ran and its output? List every letter that rests on neither, and lower it to what the evidence supports. Mark Executable N/A if there is no formal behavioral contract to run. Add a snapshot line: date, commit (git rev-parse --short HEAD) and spec version. Do not give an overall grade. End with the task list in priority order, at most seven items. Change no files.
```

</div>
<div markdown="1">

**Español (neutro)**

```text
Revisa tu propio informe. Para cada letra, ¿la evidencia es un archivo y línea, o un comando que corriste y su salida? Lista cada letra que no se apoye en ninguna de las dos y bájala a lo que la evidencia sostiene. Marca Ejecutable como N/A si no existe un contrato de comportamiento formal para correr. Agrega una línea de foto: fecha, commit (git rev-parse --short HEAD) y versión de la spec. No des una nota general. Termina con la lista de tareas en orden de prioridad, como máximo siete ítems. No cambies archivos.
```

</div>
</div>

## What good output looks like

- Seven rows, one letter each, each with one finding and a `file:line` or a command and its output, plus one concrete step to raise it a letter.
- Executable graded only if a formal contract exists; otherwise N/A.
- A snapshot line with date, commit and spec version, so the report can be dated and compared.
- A short task list. No overall grade, and no number that sums the letters.

## Check that it worked

1. **No letter without evidence.** Open three of the cited `file:line` references or rerun three of the quoted commands: each says what the report claims.
2. **Run it twice.** A second fresh session gives letters within one grade of the first for each property. Report the range, for example "Verifiable B to C", never one value. If a property differs by more than one letter, the evidence behind it is what to inspect.
3. **The snapshot line is real.** `git rev-parse --short HEAD` equals the commit in the report, and the report names the spec file and version it read.
4. **Nothing changed.** `git status --short` is clean.
5. **The tasks are yours to rank.** Take the top two and run them through [5. Change](/formulas/change/); re-run this audit afterwards and compare ranges, not single values.

## Known limits

- The grader is an inferential reader: it tells you where to look, it does not measure exactly, and an assistant can grade a thin spec generously. That is why two runs and evidence are required.
- A letter raised by satisfying the letter of a check without the property behind it is the failure the rubric exists to catch; read the evidence, not the letter.
- Letters are a snapshot against the spec in force at one commit. They age with every commit; a report states how many commits it is behind head.
- The live audit page may differ from the canon described here (an overall grade, a different Executable rule, no snapshot line) until the coordinated release aligns it. Where they differ, follow this page and record the difference.
- "Governed" means level 4 on all seven properties, enforced with no silent way around. A scorecard letter is not that claim.

## Next

[5. Change](/formulas/change/) for the findings, one at a time; [10. Self-experiment](/formulas/experiment/) to compare before and after.
