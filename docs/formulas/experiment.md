---
layout: default
title: "10. Self-experiment: before and after"
parent: Formulas
nav_order: 10
permalink: /formulas/experiment/
description: "Run the same small task on your own project twice, without and with the substrate, in fresh sessions, judged by a hidden test you wrote beforehand. An illustration for you, never a measured effect."
---

# 10. Run a small experiment on your own project

**Status: written to the canon, not yet tested in a registered run.** The pieces ran once each in the course lab (a task with and without a root file; the audit before and after adopting). The protocol below as a whole did not. **A single run is an illustration, not a rate.** Language models are not replicable: your run will resemble another, not equal it.

## When to use

You want to see, on your own project, what the substrate changed in what an assistant does with an ordinary task. The comparison is between **a commit before the substrate** and **a commit with it**. **Not for:** proving an effect to anyone else. For that, a registered design with many tasks and repetitions is needed; this is a mirror, not a measurement.

## Setup (you, not the assistant)

1. Pick **one small real task** with a rule that is easy to get wrong, for example "reject bookings more than 30 days ahead with error `TOO_FAR_AHEAD`". Write it as plain text. It must be the **same text in every run**.
2. **Before you run anything**, write the acceptance test for that rule yourself, in a folder **outside** the project (the hidden test). It decides pass or fail in every run.
3. Create two checkouts: `git worktree add ../exp-before [commit before the substrate]` and `git worktree add ../exp-after [commit with the substrate]`. Create `../runs/` for the logs.
4. Fix and write down: the assistant and the model version, the machine, the date. Use **fresh sessions** with no memory or history, one per run, and **at least two runs per arm**.

## The prompt (identical in every run)

<div class="prompt-pair" markdown="1">
<div markdown="1">

**English**

```text
[THE TASK TEXT, identical in every run]

When you finish, write a run log to ../runs/[arm]-[n].md, outside this repository, with: (1) every assumption you made without asking me, one per line; (2) every command you ran to verify, with its exit status; (3) the files you changed; (4) what you could not verify. Do not read any other file in ../runs/.
```

</div>
<div markdown="1">

**Español (neutro)**

```text
[EL TEXTO DE LA TAREA, idéntico en cada corrida]

Al terminar, escribe un registro de la corrida en ../runs/[brazo]-[n].md, fuera de este repositorio, con: (1) cada suposición que hiciste sin preguntarme, una por línea; (2) cada comando que corriste para verificar, con su código de salida; (3) los archivos que cambiaste; (4) lo que no pudiste verificar. No leas ningún otro archivo de ../runs/.
```

</div>
</div>

Do not add a pointer to the spec or the sentinel to the prompt in the "after" arm. If the substrate helps, it has to help through what the assistant finds in the project.

## What good output looks like

Per run: a run log with the assumptions listed, the verification commands, the changed files. You add what the machine cannot: whether the hidden test passes, the size of the diff (`git diff --stat`), whether the project's one command passes, the token or cost figure the tool reports, and the wall time. One row per run in a table, all runs kept, the spread visible.

## Check that it worked

1. **Same conditions.** Same task text, assistant, model version and settings in every run; each in a fresh session; each worktree started clean (`git status --short` empty).
2. **The hidden test was written first** (check its file date against the first run) and lives outside both worktrees.
3. **At least two runs per arm are recorded**, and you report all of them, including the ones that disagree.
4. **You recorded what the machine decided alone.** Count the assumptions per run (the log's item 1). What to look at: whether the arm with the substrate lists fewer silent assumptions and asks or stops where the arm without it fills the gap and says nothing. That is something to look for, not something this page predicts.
5. **No claim beyond the table.** The write-up says "in these n runs, on this task" and shows the spread. It does not give a percentage, a rate or an "effect".

## Known limits

- A single task, a single project, a single assistant: an illustration. Two runs per arm cannot separate the substrate from luck.
- Language models are not replicable. Re-running gives a different result; that is why the spread is the finding.
- The task must be small enough to finish and specific enough for a hidden test; a task you picked after seeing results is a different, weaker experiment.
- Cost: each run uses tokens; in the lab a small task cost on the order of tens of cents per session (one assistant, one model; yours will differ).
- If you wrote the substrate and the hidden test yourself, you are the experimenter and the subject. Keep the hidden test honest; ask someone else to write it if you can.

## Next

[9. Audit](/formulas/audit/) before and after the same change gives a second, coarser view. When you have a result, keep the table and the logs in the repository, and report it as an illustration.
