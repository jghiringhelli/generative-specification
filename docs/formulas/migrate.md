---
layout: default
title: "12. Migrate"
parent: Formulas
nav_order: 12
permalink: /formulas/migrate/
description: "Two precise cases. A: existing code with no Generative Specification becomes a recovered spec plus a characterization suite, and the project then becomes a greenfield substrate built from that spec, with the observable behavior proved equal on the original and on the new code. B: move a project from an older Generative Specification layout to the current canon, in place, losing nothing. Prompts in English and neutral Spanish."
---

# 12. Migrate

**Status: written to the canon; case A rewritten on 2026-10-07 and exercised only in development runs (not evidence), case B not run.** Case A is "code becomes spec, then the project becomes a greenfield": three stages, each a fresh session, and a deterministic equivalence check at the end ([formula 13](/formulas/verify-substrate/) with `--migration`). Case B has no lab relative at all and is the least tested text in this section.

## What "migrate" means here

"Migrate" is overloaded; this page fixes it to two cases that differ in **what you start from** and **what must survive**. Everything else has another formula.

| Your situation | Use | The result lives | What must survive |
|---|---|---|---|
| The code exists, you keep it exactly as it is and want the substrate around it | [2. Adopt after an MVP](/formulas/adopt/) | the same repository, code untouched | the code |
| **A.** Existing code, **no Generative Specification**: you want the project to become a greenfield one (a spec that came from the code, a substrate built from that spec, code regenerated from it or carried) | **this page, case A** | the same repository, on a migration branch; the original stays at a base commit | its **observable behavior** (the characterization suite), not its code |
| **B.** A project that already has an **older GS layout** (a manifest, `docs/adrs/active`, use cases `UC-NNN`, `STATUS.md`, a sentinel with another name) | **this page, case B** | the same repository, files moved | every document, every id and the commit history; behavior untouched |
| An in-place dependency or framework upgrade | [Existing project](/practice/existing-project/) audit and remediation | the same repository | n/a |

**What case A adds to the other formulas.** The behavior is pinned **before** it is read as intent, by a *characterization suite* that is black-box (it runs the system from outside and never imports its code), so the very same suite can be run against the original and against the new code: "parity" has an oracle that is not the new code. Every test of the suite cites a criterion id of the recovered spec, and every criterion is cited by a test. Every element of the public surface is listed in an *inventory* and either carried (`keep`) or visibly set aside (`drop`, `defer`) with a reason in the deferred list, so a behavior cannot be lost by never having been written down. In B, the *crosswalk* (every old artifact and every old id is mapped, nothing disappears without a row that says why).

---

## Case A. Existing code becomes a spec, and the project becomes a greenfield

```
legacy code --A1--> recovered spec + characterization suite + inventory  --A2--> greenfield substrate built from the spec --A3--> equivalence checked by a program
```

Three stages, **each in a fresh session** and each self-contained; stop and read between them. They take sessions, not minutes (no duration was measured).

### A1. Recover the spec and pin the behavior (in the repository)

<div class="prompt-pair" markdown="1">
<div markdown="1">

**English**

```text
Recover the specification of this existing system from its code and pin its behavior, so that the project can then be rebuilt as a greenfield project under Generative Specification with the same observable behavior. Work on a branch named gs-migrate-[YYYY-MM-DD], never on the main branch, and do not change production source code in this session: you may add documents, tests and scripts. First run git rev-parse HEAD and keep it as BASE; print it in the report. Follow the phases in order and stop where it says STOP.

My original spec, if any: [path, or "none"]
Target stack, only if it is not the same as today: [language, framework, test tool, database | "same as today"]

Rules for the whole session
- Never mark anything as ratified on my behalf. I ratify and I decide.
- Do not invent. Where intent is not visible in the code or my spec, write a line that starts with "OPEN:" and ask me. Describe what the code does, mistakes included; the tag [observed] says so.
- "Done" needs evidence: the command you ran and its output; paste real outputs and exit codes, never describe one you did not see.
- One change per commit, with a Conventional Commit subject.

PHASE 1 - Read and run. Find how to install, run and test the system, run its tests now and report the real result (fix nothing that fails). Print what the system does, its modules and its public surface: every route, command, flag, scheduled job, message handled, environment variable, file read or written, and stored table or column.
PHASE 2 - Recover the spec and take the inventory. STOP at the end.
Write docs/spec/SPEC.md and docs/spec/F-NNN-[slug].md, independent of the framework: overview, scope, non-goals, a list "the AI must never", one requirement per feature, written as a heading that starts with its id (### F-001: Name; N-001 for non-functional) in its own feature file only (its title line does not repeat the id); SPEC.md lists the features in a table (id, name, file), without id headings; acceptance criteria one list line each, starting with its id (F-001.1, F-001.2; never renumbered, never reused), with MUST, SHOULD or MAY, ending with "verified by:" and the tag [observed] until I ratify. Use my original spec's wording where the code matches it. Where my spec and the code disagree, write an OPEN: line quoting both sides; do not choose a side.
Then write docs/migration/inventory.md: a table with the columns element | where in the code | claimed by | decision | reason, one row for every element of the public surface you listed. "claimed by" holds the criterion ids that describe the element, or UNCLAIMED when no criterion does: do not drop the row and do not invent a criterion for it. Leave decision and reason empty.
STOP: end your reply here and do not start the next phase until I answer. Show me the criteria, the inventory with its UNCLAIMED rows, the OPEN: lines and the disagreements. For each element I will say keep (the behavior is carried to the new code), drop (it is not carried, and why) or defer (not decided, not carried now, and why), and I will ratify by id.
PHASE 3 - Pin the behavior. Fill the decision and reason columns with my answers (a dropped or deferred element stays in the table). Then write the characterization suite in tests/characterization/: one test for each criterion of a kept element, with the criterion id in its name or in a comment inside the test. The suite is black-box: it runs the system only through the command in the environment variable GS_SUT_CMD, from the directory in GS_SUT_ROOT (defaults: the repository root, and the command that invokes the system in this working tree), reads only what comes out (standard output, exit code, files, HTTP responses) and never imports the system's code. To run it against another version of the system only these two variables change. If a behavior cannot be pinned without changing production code, write an OPEN: line saying why; its element becomes defer. Write docs/migration/equivalence.json as {"base": "<BASE>", "suite": "<the one command that runs the suite>", "original": {"cmd": "<how to invoke the system, relative to its root>", "setup": "<install step, optional>"}, "current": {"cmd": "<the same, for the working tree>"}}, and docs/deferred.md with a row element | reason for every dropped or deferred element (the file exists even if the only row says "none").
Prove it with real output: the suite passes on this working tree; it passes against a checkout of BASE in a temporary folder (GS_SUT_ROOT pointing there); it fails against an empty folder; and plant one change in a copy of the code (flip a comparison operator) and show the suite fail, then drop the copy. Print the counts of kept, dropped and deferred elements and the number of kept elements that have no test (it must be 0). Commit.
```

</div>
<div markdown="1">

**Español (neutro)**

```text
Recupera la especificación de este sistema existente a partir de su código y fija su comportamiento, para que luego el proyecto pueda reconstruirse como un proyecto nuevo bajo Generative Specification con el mismo comportamiento observable. Trabaja en una rama llamada gs-migrate-[AAAA-MM-DD], nunca en la rama principal, y no cambies el código de producción en esta sesión: puedes agregar documentos, tests y scripts. Primero corre git rev-parse HEAD y guárdalo como BASE; imprímelo en el informe. Sigue las fases en orden y detente donde diga STOP.

Mi spec original, si existe: [ruta, o "ninguna"]
Stack de destino, solo si no es el mismo de hoy: [lenguaje, framework, herramienta de pruebas, base de datos | "el mismo de hoy"]

Reglas para toda la sesión
- Nunca marques nada como ratificado en mi nombre. Yo ratifico y yo decido.
- No inventes. Donde la intención no se vea en el código ni en mi spec, escribe una línea que empiece con "OPEN:" y pregúntame. Describe lo que el código hace, errores incluidos; la marca [observed] lo dice.
- "Hecho" exige evidencia: el comando que corriste y su salida; pega salidas y códigos de salida reales, nunca describas una que no viste.
- Un cambio por commit, con asunto Conventional Commit.
- Deja en inglés las palabras que lee una verificación automática: OPEN:, verified by:, UNCLAIMED, [observed], MUST, SHOULD, MAY, keep, drop, defer, GS_SUT_ROOT, GS_SUT_CMD, los nombres de columna de las tablas.

FASE 1 - Leer y correr. Averigua cómo instalar, correr y probar el sistema, corre sus tests ahora e informa el resultado real (no arregles nada de lo que falle). Imprime qué hace el sistema, sus módulos y su superficie pública: cada ruta, comando, flag, tarea programada, mensaje que atiende, variable de entorno, archivo leído o escrito, y tabla o columna guardada.
FASE 2 - Recuperar la spec y hacer el inventario. STOP al final.
Escribe docs/spec/SPEC.md y docs/spec/F-NNN-[slug].md, independientes del framework: resumen, alcance, no-objetivos, una lista "la IA nunca debe", un requisito por funcionalidad, escrito como un encabezado que empieza con su id (### F-001: Nombre; N-001 para los no funcionales) solo en su archivo de funcionalidad (su línea de título no repite el id); SPEC.md lista las funcionalidades en una tabla (id, nombre, archivo), sin encabezados con id; criterios de aceptación de una línea de lista cada uno, que empieza con su id (F-001.1, F-001.2; nunca renumerado, nunca reutilizado), con DEBE (MUST), DEBERÍA (SHOULD) o PUEDE (MAY), terminan con "verified by:" y la marca [observed] hasta que yo ratifique. Usa la redacción de mi spec original donde el código coincida. Donde mi spec y el código discrepen, escribe una línea OPEN: que cite ambos lados; no elijas uno.
Luego escribe docs/migration/inventory.md: una tabla con las columnas element | where in the code | claimed by | decision | reason, una fila por cada elemento de la superficie pública que listaste. "claimed by" contiene los ids de los criterios que describen el elemento, o UNCLAIMED cuando ningún criterio lo describe: no borres la fila y no inventes un criterio para ella. Deja decision y reason vacíos.
STOP: termina tu respuesta aquí y no empieces la fase siguiente hasta que yo responda. Muéstrame los criterios, el inventario con sus filas UNCLAIMED, las líneas OPEN: y las discrepancias. Para cada elemento diré keep (el comportamiento pasa al código nuevo), drop (no pasa, y por qué) o defer (sin decidir, no pasa ahora, y por qué), y ratificaré por id.
FASE 3 - Fijar el comportamiento. Llena las columnas decision y reason con mis respuestas (un elemento descartado o diferido queda en la tabla). Luego escribe la suite de caracterización en tests/characterization/: un test por cada criterio de un elemento que se mantiene, con el id del criterio en su nombre o en un comentario dentro del test. La suite es de caja negra: corre el sistema solo mediante el comando de la variable de entorno GS_SUT_CMD, desde el directorio de GS_SUT_ROOT (valores por defecto: la raíz del repositorio y el comando que invoca el sistema en este árbol de trabajo), lee solo lo que sale (salida estándar, código de salida, archivos, respuestas HTTP) y nunca importa el código del sistema. Para correrla contra otra versión del sistema solo cambian estas dos variables. Si un comportamiento no se puede fijar sin cambiar código de producción, escribe una línea OPEN: que diga por qué; su elemento pasa a defer. Escribe docs/migration/equivalence.json como {"base": "<BASE>", "suite": "<el comando único que corre la suite>", "original": {"cmd": "<cómo invocar el sistema, relativo a su raíz>", "setup": "<paso de instalación, opcional>"}, "current": {"cmd": "<lo mismo, para el árbol de trabajo>"}}, y docs/deferred.md con una fila element | reason por cada elemento descartado o diferido (el archivo existe aunque su única fila diga "none").
Demuéstralo con salidas reales: la suite pasa en este árbol de trabajo; pasa contra una copia de BASE en una carpeta temporal (GS_SUT_ROOT apuntando allí); falla contra una carpeta vacía; y planta un cambio en una copia del código (invierte un operador de comparación) y muestra que la suite falla, luego descarta la copia. Imprime la cuenta de elementos kept, dropped y deferred y cuántos elementos kept no tienen test (debe ser 0). Haz commit.
```

</div>
</div>

### A2. Rebuild as a greenfield (formula 1 plus this addendum)

Open a **fresh session** in the same repository, on the branch A1 created. Paste [formula 1, Greenfield](/formulas/greenfield/) with its brackets filled, and **below it** the addendum. In formula 1: **My spec:** `docs/spec/` (recovered, "already ratified by id; keep the ids exactly as they are; do not re-open what I ratified"); **Stack:** the target stack of A1.

<div class="prompt-pair" markdown="1">
<div markdown="1">

**English**

```text
MIGRATION ADDENDUM. The formula above is applied to a spec recovered from existing code; where this addendum differs from it, this addendum wins.
- Repository: this one, on the branch gs-migrate-DATE that stage A1 created. The original system is the commit named "base" in docs/migration/equivalence.json; it stays there and history is never rewritten.
- Phase 1 is done: docs/spec/ was recovered from the code and I ratified it by id. Do not rewrite it and do not stop for it; check that it is there and continue. A criterion you think is missing is an OPEN: line, not an addition.
- How to build: [regenerate | carry]. regenerate: write the new implementation from the spec, in the stack named above (the original's if none is named); while writing it do not read the original source except to look up a behavior the spec leaves open, and such a case is an OPEN: line, not a silent copy. carry: keep the existing code and bring it under the substrate without changing what it does.
- tests/characterization/ and docs/migration/ are frozen: you may add tests, never edit or delete one. A characterization test that fails on the new code is a defect of the new code, or an OPEN: line for me; never a reason to change the test.
- Phase 5 becomes: implement every criterion of the kept elements until the characterization suite passes against the new code. Update "current" in docs/migration/equivalence.json to how the new code is invoked, and make the suite's defaults (GS_SUT_ROOT, GS_SUT_CMD) the new code. Then show with real output: the suite passes against a checkout of the base commit in a temporary folder; it passes against the new code; and a change planted in a copy of the new code (flip a comparison operator) makes it fail.
- With regenerate, finish by removing the original production files from the working tree with git rm, in their own commit "chore: remove the original code, kept at the base commit", after the suite has passed on the new code.
- Add docs/migration/inventory.md and docs/deferred.md to the routing table of the sentinel. In phase 6 add to the report the counts of kept, dropped and deferred elements and the three equivalence results above.
```

</div>
<div markdown="1">

**Español (neutro)**

```text
ADENDA DE MIGRACIÓN. La fórmula de arriba se aplica a una spec recuperada de código existente; donde esta adenda difiera de ella, gana esta adenda.
- Repositorio: este, en la rama gs-migrate-FECHA que creó la etapa A1. El sistema original es el commit llamado "base" en docs/migration/equivalence.json; se queda allí y el historial nunca se reescribe.
- La fase 1 está hecha: docs/spec/ se recuperó del código y yo la ratifiqué por id. No la reescribas ni te detengas por ella; comprueba que está y continúa. Un criterio que creas que falta es una línea OPEN:, no una adición.
- Cómo construir: [regenerate | carry]. regenerate: escribe la implementación nueva a partir de la spec, en el stack indicado arriba (el del original si no se indica ninguno); mientras la escribes no leas el código fuente original salvo para consultar un comportamiento que la spec deja abierto, y ese caso es una línea OPEN:, no una copia silenciosa. carry: conserva el código existente y ponlo bajo el substrato sin cambiar lo que hace.
- tests/characterization/ y docs/migration/ están congelados: puedes agregar tests, nunca editar ni borrar uno. Un test de caracterización que falla contra el código nuevo es un defecto del código nuevo, o una línea OPEN: para mí; nunca un motivo para cambiar el test.
- La fase 5 pasa a ser: implementa cada criterio de los elementos keep hasta que la suite de caracterización pase contra el código nuevo. Actualiza "current" en docs/migration/equivalence.json con cómo se invoca el código nuevo, y haz que los valores por defecto de la suite (GS_SUT_ROOT, GS_SUT_CMD) sean el código nuevo. Luego muestra con salidas reales: la suite pasa contra una copia del commit base en una carpeta temporal; pasa contra el código nuevo; y un cambio plantado en una copia del código nuevo (invierte un operador de comparación) la hace fallar.
- Con regenerate, termina quitando los archivos de producción originales del árbol de trabajo con git rm, en su propio commit "chore: remove the original code, kept at the base commit", después de que la suite haya pasado sobre el código nuevo.
- Agrega docs/migration/inventory.md y docs/deferred.md a la tabla de ruteo del centinela. En la fase 6 agrega al informe las cuentas de elementos kept, dropped y deferred y los tres resultados de equivalencia de arriba.
```

</div>
</div>

Then add the lock with [8. Lock](/formulas/lock/): the characterization tests are derived artifacts of the criteria they cite, so they take `@gs` tags like any test.

### A3. Check the equivalence (a program, not the assistant)

Run [formula 13](/formulas/verify-substrate/) with the migration switch: `node gs-check.mjs --repo [project] --strict --migration --verbose`. After E01 to E12 it prints M01 to M09: the manifest and the base commit; the suite green on the **original** (a checkout of the base commit) and red on an **empty** system; the suite green on the **new** code; a mutation probe (a few comparison operators, booleans, arithmetic signs and numbers flipped one at a time, in the original and in the new code; a suite that does not refuse most of them is not an oracle); every characterization test citing a criterion of the recovered spec and every criterion cited; the inventory's decisions and claims; the original's public surface found by pattern matching in its code compared with the inventory (independent of the assistant's list); and the deferred list.

### Check that it worked (case A)

1. **The original did not change.** `git diff --stat BASE..HEAD -- [production source folders]` shows only the removal of the original files (regenerate) or nothing (carry); `git show BASE:[file]` still works.
2. **Run the suite against both yourself.** `GS_SUT_ROOT=[a checkout of BASE] GS_SUT_CMD="[original command]" [suite command]` and the same on the new code: both exit 0. Edit a comparison in the new code: the suite exits non-zero.
3. **The inventory is complete.** Pick five things the system does that you know by heart (a route, a column, a flag, a job). Each is a row; if one is missing, the inventory is not complete. `UNCLAIMED` rows are not a failure, they are the list of things nobody wrote down. Every `drop` and `defer` has a reason in `docs/deferred.md`.
4. **The checker agrees.** `--migration` prints M01 to M09 all `PASS` and E01 to E12 as in any substrate; read M04 and M08 first.
5. **You, not the assistant, ratified.** No criterion lost its `[observed]` tag in your name and no decision was filled in without your answer.

---

## Case B. An older GS layout to the current canon

One prompt, in the same repository, no production code touched.

<div class="prompt-pair" markdown="1">
<div markdown="1">

**English**

```text
Move this project from an older Generative Specification layout to the current one, without changing what it does and without losing any document or any id. Work on a branch named gs-layout-[YYYY-MM-DD], never on the main branch. Do not change production source code: you may move and convert documents and add tests, hooks, CI, scripts and the README. First run git rev-parse HEAD and keep it as BASE; print it in the report. Follow the phases in order and stop where it says STOP.

Your instruction file (the sentinel): [CLAUDE.md | AGENTS.md (most other tools, Cursor included) | .github/copilot-instructions.md]

Rules for the whole session
- Never mark anything as ratified on my behalf. If you need a decision, write a line that starts with "OPEN:" and ask me.
- An id is never renumbered and never reused. An old id keeps meaning what it meant; a new id is added next to it in a crosswalk.
- Delete nothing without a row in docs/migration-map.md that says why. Use git mv for moves, so history follows.
- "Done" needs evidence: the command and its output; paste real outputs and exit codes.
- One change per commit, Conventional Commit subject.

PHASE 1 - Inventory (read-only). Run the tests now and keep the result as the oracle. Print a table old artifact | kind | what it holds, for every file of the old layout you find: a manifest (docs/manifest.yaml), specification or product documents in any place, use cases (UC-NNN), decision records (for example docs/adrs/active and docs/adrs/done), a status or session-continuity file, an instruction file under another name (CONSTITUTION.md and similar), per-folder context files, hooks that are not stored in the repository, CI. List every id the old files use.
PHASE 2 - Map. STOP at the end. Write docs/migration-map.md with one row per old artifact: old path | target path | action (move, convert, merge, keep, retire) | reason; and a crosswalk table old id | new id | note. The target layout is: the sentinel named above (small enough to read whole, with a tool-sequence table "gate | command | runs at | red proof", a routing table "topic | file", and the triage block below); docs/spec/SPEC.md as the root, listing the features in a table, and docs/spec/F-NNN-[slug].md per feature (a requirement is a heading that starts with its id, in its feature file only; criteria are list lines that start with their id, such as F-001.1, with MUST, SHOULD or MAY and "verified by:"); docs/decisions/NNNN-[slug].md with the headings Status, Date, Context, Decision, Consequences; docs/architecture.md, docs/data-model.md (omit if nothing is stored and say "no stored data" in architecture.md), docs/conventions.md, each starting with "Derived from:" and the spec path and ids; docs/baseline.json; docs/fixes.md; docs/deferred.md. Use cases become requirements or criteria; list which. Anything you cannot map without choosing becomes an OPEN: line. Show me the map and every OPEN: line and wait.
PHASE 3 - Move and convert. One commit per kind of artifact: first the git mv, then the conversion of its content in a second commit. A criterion with no "verified by:" in the old text gets an OPEN: line, not an invented method. Decision records keep their content and their Status as they were. Update every path that mentions a moved file.
PHASE 4 - Gates the current canon expects and the old layout lacks. Add only what is missing, each with a red proof (one shell command that plants a violation in a throwaway copy, runs the gate and exits non-zero; no pipe character in it): a commit-msg hook that rejects messages that are not Conventional Commits, and a pre-push hook that runs the one command, both stored in the repository, committed as executable (`git update-index --chmod=+x`) and installed by a setup step that runs on a fresh clone; a CI workflow on the real default branch; a check that fails while an "OPEN:" line exists in the spec files being implemented; docs/baseline.json with measured floors and ceilings and a check that fails if a value is worse or if the file lowers a floor or raises a ceiling compared with an earlier commit; a command that prints exactly one line "criteria coverage: N/M" and fails if a test cites an unknown id. A gate that fails on today's code starts advisory and is marked so. README.md with a heading "Fresh clone" and one block of exact commands.
PHASE 5 - Prove nothing changed and nothing was lost. Show: the tests give the same result at BASE and now; `git diff --stat BASE..HEAD` touches no production source file; every old path appears in docs/migration-map.md and every old id in the crosswalk; `git log --follow` on three moved files shows their history from before the move; a clone of the repository in a temporary folder runs the setup step and the one command with exit code 0.
PHASE 6 - Report: a table, one row per item, PRESENT, PARTIAL or MISSING, with the command or file that shows it: sentinel routes; requirement ids; criterion ids; decision records; derived documents; tests and a blocking gate; ratchet; open-questions check; criteria coverage N/M; typed atomic commits (BASE..HEAD); README from a fresh clone; spec lock; co-change gate (for these two write "later"). End with the OPEN: lines.

The sentinel must end with this block, unchanged:
  When something fails or is missing, say which case it is BEFORE acting.
  Question: does the ratified spec already require the right behavior?
  a  spec right, code deviates: regression test citing the criterion id, seen failing on the current code, then fix. No spec change.
  b  spec silent or ambiguous: state the gap as a criterion with an id (or a numbered entry in docs/fixes.md); a person ratifies; derive the test; red first; implement.
  c  spec contradicts the intent: change event; ask; change the spec; write the decision record; rerun every check.
  d  tool or sensor missing: add it and list it in the tool sequence; a person ratifies.
  e  way around a gate found: add a NEW test case for the gate. Cases are only ever added.
  Never mark anything ratified on a person's behalf.
```

</div>
<div markdown="1">

**Español (neutro)**

```text
Mueve este proyecto de un layout antiguo de Generative Specification al actual, sin cambiar lo que hace y sin perder ningún documento ni ningún id. Trabaja en una rama llamada gs-layout-[AAAA-MM-DD], nunca en la rama principal. No cambies el código de producción: puedes mover y convertir documentos y agregar tests, hooks, CI, scripts y el README. Primero corre git rev-parse HEAD y guárdalo como BASE; imprímelo en el informe. Sigue las fases en orden y detente donde diga STOP.

Tu archivo de instrucciones (el centinela): [CLAUDE.md | AGENTS.md (most other tools, Cursor included) | .github/copilot-instructions.md]

Reglas para toda la sesión
- Nunca marques nada como ratificado en mi nombre. Si necesitas una decisión, escribe una línea que empiece con "OPEN:" y pregúntame.
- Un id nunca se renumera ni se reutiliza. Un id antiguo sigue significando lo que significaba; el id nuevo se agrega a su lado en una tabla de equivalencias.
- No borres nada sin una fila en docs/migration-map.md que diga por qué. Usa git mv para mover, así el historial acompaña.
- "Hecho" exige evidencia: el comando y su salida; pega salidas y códigos de salida reales.
- Un cambio por commit, asunto Conventional Commit.
- Deja en inglés las palabras que lee una verificación automática: OPEN:, verified by:, Derived from:, PRESENT, PARTIAL, MISSING, later, "Fresh clone", los encabezados Status, Date, Context, Decision, Consequences y los nombres de columna de las tablas.

FASE 1 - Inventario (solo lectura). Corre los tests ahora y guarda el resultado como oráculo. Imprime una tabla old artifact | kind | what it holds, por cada archivo del layout antiguo que encuentres: un manifiesto (docs/manifest.yaml), documentos de especificación o de producto en cualquier lugar, casos de uso (UC-NNN), registros de decisión (por ejemplo docs/adrs/active y docs/adrs/done), un archivo de estado o de continuidad de sesión, un archivo de instrucciones con otro nombre (CONSTITUTION.md y similares), archivos de contexto por carpeta, hooks que no están guardados en el repositorio, CI. Lista todos los ids que usan los archivos antiguos.
FASE 2 - Mapa. STOP al final. Escribe docs/migration-map.md con una fila por artefacto antiguo: old path | target path | action (move, convert, merge, keep, retire) | reason; y una tabla de equivalencias old id | new id | note. El layout de destino es: el centinela indicado arriba (lo bastante pequeño para leerse completo, con una tabla de secuencia de herramientas "gate | command | runs at | red proof", una tabla de ruteo "topic | file" y el bloque de triage de abajo); docs/spec/SPEC.md como raíz, que lista las funcionalidades en una tabla, y docs/spec/F-NNN-[slug].md por funcionalidad (un requisito es un encabezado que empieza con su id, solo en su archivo de funcionalidad; los criterios son líneas de lista que empiezan con su id, como F-001.1, con DEBE (MUST), DEBERÍA (SHOULD) o PUEDE (MAY) y "verified by:"); docs/decisions/NNNN-[slug].md con los encabezados Status, Date, Context, Decision, Consequences; docs/architecture.md, docs/data-model.md (omítelo si no se guarda nada y escribe "no stored data" en architecture.md), docs/conventions.md, cada uno empezando con "Derived from:" y la ruta y los ids de la spec; docs/baseline.json; docs/fixes.md; docs/deferred.md. Los casos de uso pasan a ser requisitos o criterios; di cuáles. Lo que no puedas mapear sin elegir se convierte en una línea OPEN:. Muéstrame el mapa y cada línea OPEN: y espera.
FASE 3 - Mover y convertir. Un commit por tipo de artefacto: primero el git mv, luego la conversión de su contenido en un segundo commit. Un criterio sin "verified by:" en el texto antiguo recibe una línea OPEN:, no un método inventado. Los registros de decisión conservan su contenido y su Status tal como estaban. Actualiza cada ruta que mencione un archivo movido.
FASE 4 - Gates que el canon actual espera y el layout antiguo no tiene. Agrega solo lo que falte, cada uno con una prueba en rojo (un comando de shell que planta una violación en una copia desechable, corre el gate y termina con código distinto de cero; sin el carácter de tubería): un hook commit-msg que rechace los mensajes que no sigan Conventional Commits, y un hook pre-push que corra el comando único, ambos guardados en el repositorio, commiteados como ejecutables (`git update-index --chmod=+x`) e instalados por un paso de preparación que corra en un clon nuevo; un workflow de CI sobre la rama principal real; una verificación que falle mientras exista una línea "OPEN:" en los archivos de la spec que se están implementando; docs/baseline.json con pisos y techos medidos y una verificación que falle si un valor empeora o si el archivo baja un piso o sube un techo respecto de un commit anterior; un comando que imprima exactamente una línea "criteria coverage: N/M" y falle si un test cita un id desconocido. Un gate que falla con el código de hoy empieza como advisory y se marca así. README.md con un encabezado "Fresh clone" y un bloque con los comandos exactos.
FASE 5 - Demuestra que nada cambió y nada se perdió. Muestra: los tests dan el mismo resultado en BASE y ahora; `git diff --stat BASE..HEAD` no toca ningún archivo de código de producción; cada ruta antigua aparece en docs/migration-map.md y cada id antiguo en la tabla de equivalencias; `git log --follow` sobre tres archivos movidos muestra su historial anterior al movimiento; un clon del repositorio en una carpeta temporal corre el paso de preparación y el comando único con código de salida 0.
FASE 6 - Informe: una tabla, una fila por ítem, PRESENT, PARTIAL o MISSING, con el comando o archivo que lo muestra: el centinela rutea; ids de requisitos; ids de criterios; registros de decisiones; documentos derivados; pruebas y un gate bloqueante; trinquete; verificación de preguntas abiertas; cobertura de criterios N/M; commits tipados y atómicos (BASE..HEAD); README desde un clon nuevo; lock de la spec; gate de co-cambio (para estos dos escribe "later"). Termina con las líneas OPEN:.

El centinela debe terminar con este bloque, sin cambios:
  Cuando algo falle o falte, di de qué caso se trata ANTES de actuar.
  Pregunta: ¿la spec ratificada ya exigía el comportamiento correcto?
  a  la spec es correcta y el código se desvía: test de regresión que cita el id del criterio, visto fallar contra el código actual, y luego el arreglo. La spec no cambia.
  b  la spec calla o es ambigua: escribe el hueco como criterio con id (o como entrada numerada en docs/fixes.md); una persona ratifica; deriva el test; rojo primero; implementa.
  c  la spec contradice la intención: evento de cambio; pregunta; cambia la spec; escribe el registro de la decisión; corre de nuevo todas las verificaciones.
  d  falta una herramienta o un sensor: agrégalo y anótalo en la secuencia de herramientas; una persona ratifica.
  e  se encontró una forma de burlar un gate: agrega un caso de prueba NUEVO para el gate. Los casos solo se agregan.
  Nunca marques nada como ratificado en nombre de una persona.
```

</div>
</div>

### Check that it worked (case B)

1. **Nothing was lost.** Every file the old layout had is a row of `docs/migration-map.md`, and a `retire` row has a reason you accept. Count: `git ls-tree -r BASE --name-only | wc -l` against the rows of the map.
2. **Ids survive.** Every old id appears in the crosswalk; grep three of them in the new tree.
3. **Behavior did not change.** `git diff --stat BASE..HEAD -- [production source folders]` prints nothing; the tests give the same result at BASE and on the branch.
4. **History follows.** `git log --follow docs/spec/SPEC.md` (or any moved file) reaches back before the move.
5. **The target layout is true.** `node gs-check.mjs --repo . --strict` ([formula 13](/formulas/verify-substrate/)) reports the twelve items; the numbers on E02 to E04 are the ones to read first.
6. **You, not the assistant, ratified.** No decision record changed Status, and no `[observed]` or `OPEN:` line was resolved in your name.

## Known limits

- Case A was exercised in development runs (2026-10-07, not evidence) and case B not at all. Neither has a registered run.
- **Equivalence is only as good as the suite.** A behavior nobody pinned is not compared. The mutation probe (M04) shows how much of the code the suite guards, and survivors are listed; it cannot see what is not code: an ordering of concurrent events, a timing, a side effect outside the files and ports the suite looks at. Run the old and the new system side by side on real data before you switch.
- **Black-box means a process boundary.** The suite needs the system to be invoked as a command, a server or a batch over files. A library called from other code needs a thin driver script in the suite, which prints what the function returns; the driver is part of the suite and is frozen with it.
- **The recovered spec records what the code does, including its mistakes.** That is why it is marked `[observed]` and why disagreements are `OPEN:` lines. A mistake the suite pins is carried to the new code on purpose; fixing it afterwards is a [change](/formulas/change/), not a migration.
- **An inventory is as good as the reader's search.** Dynamically registered routes, reflection and generated code hide elements. M08 compares the inventory with what pattern matching finds in the original, which catches the plain cases; five known items checked by hand (step 3) are a sanity test, not a proof.
- **Regenerating is a choice with a cost.** The new code is written from the spec alone, so whatever the spec lost is lost; the suite is what notices. Carrying keeps the code and its quirks and adds the substrate around it.
- A migration is a decision about the business. The prompts keep the decision with you (keep, drop, defer; the stack); they do not make it.
- Case B maps files and ids; it does not judge whether the old ones were good, and it keeps decision records exactly as they were, including ones that no longer hold.

## Next

[8. Lock](/formulas/lock/) once there is code with ids (A2 leaves the characterization tests ready to be tagged); [13. Verify the substrate](/formulas/verify-substrate/) with `--migration` on the result; [4. Refine and ratify](/formulas/refine/) for the `[observed]` criteria.
