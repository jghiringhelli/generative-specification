---
layout: default
title: "13. Verify the substrate"
parent: Formulas
nav_order: 13
permalink: /formulas/verify-substrate/
description: "A post-hoc prompt that makes an assistant run one deterministic checker on a project and report, for each of the twelve items of the substrate, whether it is present and working, with the raw tool output pasted and no judgment by reading. What a program cannot check is listed apart, for a person."
---

# 13. Verify the substrate (post-hoc, deterministic)

**Status: written to the canon, not yet tested in a registered run.** The checker, `gs-check.mjs`, is a prototype: tuned on hand-built control projects and on 24 development runs, with 13 defects found and fixed along the way, and **not validated by independent controls**. This prompt is the thin layer that makes an assistant run it honestly. Its output is evidence about the project's form, not about the software being right.

## When to use

After [1. Greenfield](/formulas/greenfield/), [2. Adopt](/formulas/adopt/), [12. Migrate](/formulas/migrate/) or [8. Lock](/formulas/lock/), or any time you want to know whether the twelve items of the [substrate checklist](/formulas/substrate-checklist/) are really there and really work, **without trusting the assistant that built them**. The assistant that wrote the substrate is the wrong judge of it; this prompt takes judgment away from the assistant and gives it to a program whose output it must paste.

Open a **fresh session** (not the one that built the project). The checker runs the project's install step, tests and hooks: use a disposable environment (a container) for a project you did not write yourself.

## The prompt

<div class="prompt-pair" markdown="1">
<div markdown="1">

**English**

```text
Verify this project's substrate with the checker I give you. The only evidence is the output of the command below. Do not judge by reading the project's files, and do not tell me whether anything "looks fine".

Checker: [path of gs-check.mjs]
Project: [absolute path of the project folder]
Report file (outside the project): [absolute path, for example a temporary folder]
Extra switch: [--migration if this project was migrated with formula 12 (it has docs/migration/equivalence.json), otherwise nothing]

1. Run, from outside the project folder, exactly this command and paste its full output and its exit code:
   node [checker] --repo [project] --strict --verbose [extra switch] --out [report file]
   It clones the committed state and does not modify the project. Run it a second time and say whether every item has the same status as the first time. Do not edit the checker, its configuration or the project to change a result. If a command fails to start, paste the error and stop.
2. Report one block per item, E01 to E12, in order, and with --migration also M01 to M09 after them. Each block: the item name; its status exactly as printed (PASS = present and working, PARTIAL = present but not fully working, ABSENT = not present, UNDETERMINABLE = the checker could not decide); and the lines the checker printed for that item, pasted verbatim in a code block. Add nothing to a block.
3. Then the checker's summary line and the exit code, verbatim, and the sha256 of the report file.
4. Do not fix anything and do not propose fixes unless I ask. If the exit code is not 0, write "not all PASS", and nothing more.
5. Finish with a section "Not checked by a program, for a person", with these lines, each marked "not checked": that the sentinel routes a cold session to the right slice; that the spec is right and complete and that a person ratified it; that tests are good tests; that decision records carry the real reason and commits are atomic and say why; that the derived documents are true of the code; that CI ran green on the server, that branch protection and required review exist, and what stops `git commit --no-verify`; who may edit the gate files and the baseline; that a tag in the lock does not lie by omission and that `ratify` was run by a person.
```

</div>
<div markdown="1">

**Español (neutro)**

```text
Verifica el substrato de este proyecto con el verificador que te doy. La única evidencia es la salida del comando de abajo. No juzgues leyendo los archivos del proyecto y no me digas si algo "se ve bien".

Verificador: [ruta de gs-check.mjs]
Proyecto: [ruta absoluta de la carpeta del proyecto]
Archivo de informe (fuera del proyecto): [ruta absoluta, por ejemplo en una carpeta temporal]
Switch adicional: [--migration si este proyecto se migró con la fórmula 12 (tiene docs/migration/equivalence.json), si no, nada]

Deja en inglés las palabras que imprime el verificador: PASS, PARTIAL, ABSENT, UNDETERMINABLE, not all PASS.

1. Corre, desde fuera de la carpeta del proyecto, exactamente este comando y pega su salida completa y su código de salida:
   node [verificador] --repo [proyecto] --strict --verbose [switch adicional] --out [archivo de informe]
   Clona el estado commiteado y no modifica el proyecto. Córrelo una segunda vez y di si cada ítem tiene el mismo estado que la primera. No edites el verificador, su configuración ni el proyecto para cambiar un resultado. Si un comando no arranca, pega el error y detente.
2. Informa un bloque por ítem, E01 a E12, en orden, y con --migration también M01 a M09 después. Cada bloque: el nombre del ítem; su estado exactamente como se imprimió (PASS = presente y funcionando, PARTIAL = presente pero no del todo funcional, ABSENT = no presente, UNDETERMINABLE = el verificador no pudo decidir); y las líneas que el verificador imprimió para ese ítem, pegadas tal cual en un bloque de código. No agregues nada a un bloque.
3. Luego la línea de resumen del verificador y el código de salida, tal cual, y el sha256 del archivo de informe.
4. No arregles nada ni propongas arreglos salvo que yo lo pida. Si el código de salida no es 0, escribe "not all PASS", y nada más.
5. Termina con una sección "No verificado por un programa, para una persona", con estas líneas, cada una marcada "no verificado": que el centinela lleva a una sesión en frío a la porción correcta; que la spec es correcta y completa y que una persona la ratificó; que los tests son buenos tests; que los registros de decisión llevan la razón real y que los commits son atómicos y dicen por qué; que los documentos derivados son ciertos respecto del código; que el CI corrió en verde en el servidor, que existen protección de rama y revisión obligatoria, y qué detiene `git commit --no-verify`; quién puede editar los archivos de gates y el baseline; que una etiqueta del lock no miente por omisión y que `ratify` lo corrió una persona.
```

</div>
</div>

## What good output looks like

- Twelve blocks, each with a status and a verbatim excerpt of the tool's lines for that item (reasons, and with `--verbose` the probe flags), the summary line, an exit code and a hash.
- No adjectives and no advice. A project that fails items produces a report that says which items and quotes why, nothing else.
- A last section that lists, apart, what no program checked.

## Check that it worked

1. **Run the same command yourself** (it is in the prompt) in a clean environment. The statuses match the report; times and temporary paths will differ. If the assistant's blocks contain a status or a line you cannot find in your own output, the report was not faithful.
2. **Two runs agree.** The checker is deterministic: repeated on the same commit, the same statuses and the same reasons. A flip is a bug in the checker or in the environment (a port left open, no network), to be reported.
3. **See both modes.** `node gs-check.mjs --repo . --both` prints the default column (a failing package script counts as a gate) and the `--strict` column (only a commit or push hook that refuses a planted violation counts). The prompt uses `--strict` because nothing runs a package script unless a person does.
4. **Calibrate once.** On a copy of your project delete the pre-push hook and commit: the enforcement items (E05 to E07) must drop. A checker that stays green after you remove a gate is not checking it.
5. **Uncommitted work is ignored.** The report says how many uncommitted changes it ignored. Commit first.

## Known limits

- **A prototype, not a validated instrument.** Hand-built controls and development runs by its author found 13 defects, mostly false negatives; independent controls and a held-out audit are owed. Expect false positives and negatives on the first real repository, especially on stacks it has not met (Python gates are found only through hooks).
- **It judges form, not value.** A project can pass all twelve with a thin spec. `PASS` means the artifact exists and a planted violation is refused, not that the software is right.
- **The probes run code.** Install scripts, hooks and tests of the project execute inside throwaway clones. A project that needs the network, a database or a secret gives `UNDETERMINABLE`; that is the honest answer, not a pass.
- **It cannot see the server.** CI results, branch protection and review rules are outside a clone; `--no-verify` skips every local hook.
- **The assistant can still lie in the prose around the pasted output.** The check above (run it yourself) is the defence; so is the rule that it adds nothing to a block.
- **Items 10 and 11** are verified for real only when the project carries the [reference lock tool](/formulas/lock/); with a lock written ad hoc the checker falls back to behavioral probes through the project's own hooks.

## Next

Fix what the report quotes one finding at a time with [5. Change](/formulas/change/); for the lock and the co-change gate, [8](/formulas/lock/); for a first look at quality rather than form, [9. Audit](/formulas/audit/).
