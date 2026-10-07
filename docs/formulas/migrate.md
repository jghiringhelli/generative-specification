---
layout: default
title: "12. Migrate"
parent: Formulas
nav_order: 12
permalink: /formulas/migrate/
description: "Two precise cases. A: move a legacy system to a new stack or architecture in a separate codebase, pinning its behavior first, recovering its spec with an inverse inventory, and proving parity on the target. B: move a project from an older Generative Specification layout to the current canon, in place, losing nothing. Prompts in English and neutral Spanish."
---

# 12. Migrate

**Status: written to the canon, not yet tested in a registered run.** Case A is the [migrate to a new stack practice page](/practice/migrate-stack/) rewritten to the canon (ids, characterization contracts, an inverse inventory, a parity table); that page's durations were never measured and this wording has no recorded run. Case B has no lab relative at all.

## What "migrate" means here

"Migrate" is overloaded; this page fixes it to two cases that differ in **where the result lives** and **what is preserved**. Everything else has another formula.

| Your situation | Use | The result lives | What must survive |
|---|---|---|---|
| The code exists, no substrate, you keep it where it is | [2. Adopt after an MVP](/formulas/adopt/) | the same repository | the code, untouched |
| **A.** A legacy system, to a **new stack or architecture** | **this page, case A** | a **separate target codebase**; the source stays as it is, on a branch with the pinning artifacts | its **observable behavior** (the contracts), not its code |
| **B.** A project that already has an **older GS layout** (a manifest, `docs/adrs/active`, use cases `UC-NNN`, `STATUS.md`, a sentinel with another name) | **this page, case B** | the same repository, files moved | every document, every id and the commit history; behavior untouched |
| An in-place dependency or framework upgrade | [Existing project](/practice/existing-project/) audit and remediation | the same repository | n/a |

**What both cases add to the other formulas.** In A, the *characterization contracts* (the behavior is pinned **before** anything is read as intent, so "parity" has an oracle that is not the new code) and the *inverse inventory* (every element of the system's public surface is listed and either claimed by an id or kept visible as `UNCLAIMED`, so a feature cannot be lost by never having been written down). In B, the *crosswalk* (every old artifact and every old id is mapped, nothing disappears without a row that says why).

---

## Case A. A legacy system to a new stack

Three steps, three prompts, **each self-contained**: A1 prepares the source (a branch of the source repository), A2 is [formula 1](/formulas/greenfield/) run in the **empty target folder**, A3 compares the two. Stop and read between them; they take sessions, not minutes (the durations on the older page were never measured).

### A1. Pin and recover (in the source)

<div class="prompt-pair" markdown="1">
<div markdown="1">

**English**

```text
Prepare this system for a migration to a new stack. The source is this folder. Work on a branch named gs-migrate-[YYYY-MM-DD], never on the main branch, and do not change production source code in this session: you may add documents, tests and scripts. First run git rev-parse HEAD and keep it as BASE; print it in the report. Follow the phases in order and stop where it says STOP.

Target stack, if I already chose: [language, framework, test tool, database | "none yet"]
My original spec, if any: [path, or "none"]

Rules for the whole session
- Never mark anything as ratified on my behalf. I ratify and I decide.
- Do not invent. Where intent is not visible in the code or my spec, write a line that starts with "OPEN:" and ask me.
- Describe what exists, not an ideal. "Done" needs evidence: the command you ran and its output; paste real outputs and exit codes, never describe one you did not see.
- One change per commit, with a Conventional Commit subject.

PHASE 1 - Read and pin. Find how to install, run and test the source, run its tests now and report the real result (do not fix anything that fails). For every behavior the system offers to the outside (each route, command, scheduled job, message handled, and each function that another system calls), write a characterization contract in docs/migration/contracts/: a small script or test named C-NNN-[slug] that runs the real thing with fixed input and checks the observable output (or records it in a file next to it). Each contract must pass on the source as it is. If a behavior cannot be pinned without changing production code, write an OPEN: line saying why.
PHASE 2 - Recover the spec and take the inverse inventory. Write docs/migration/spec/SPEC.md and one docs/migration/spec/F-NNN-[slug].md per feature, independent of the stack: behavior, entities and relationships, integrations, non-functional needs. A requirement is a heading that starts with its id (### F-001: Name; N-001 for non-functional), in its feature file only; SPEC.md lists the features in a table (id, name, file) without id headings. Criteria are one list line each, starting with its id (F-001.1, never renumbered, never reused), with MUST, SHOULD or MAY, ending with "verified by:" and the tag [observed] until I ratify. Framework-specific notes go in docs/migration/impl-notes.md, not in the spec. Then write docs/migration/inventory.md: one row for every element of the public surface you can find in the code (routes, commands, exported functions used from outside, stored tables and columns, scheduled jobs, configuration keys, message types, files read or written) with the columns element | where in the code | claimed by | contract | decision. "claimed by" is a criterion id; an element that no criterion claims stays in the table marked UNCLAIMED. Do not drop it and do not invent a criterion for it. "contract" is a C-NNN id or blank. Where my original spec and the code disagree, write an OPEN: line quoting both sides; do not choose a side.
STOP: end your reply here and do not start the next phase until I answer. Show me the inventory with its UNCLAIMED rows, the OPEN: lines and the disagreements. For each feature I will say keep, drop or modernize, choose the target stack if I have not, and ratify by id.
PHASE 3 - Apply my decisions. Fill the decision column (keep, drop, modernize). Remove nothing from the table: a dropped element stays with the word dropped and my reason. Print the number of kept elements that have no contract. Commit, and print the commit.
```

</div>
<div markdown="1">

**Español (neutro)**

```text
Prepara este sistema para migrarlo a un stack nuevo. El origen es esta carpeta. Trabaja en una rama llamada gs-migrate-[AAAA-MM-DD], nunca en la rama principal, y no cambies el código de producción en esta sesión: puedes agregar documentos, tests y scripts. Primero corre git rev-parse HEAD y guárdalo como BASE; imprímelo en el informe. Sigue las fases en orden y detente donde diga STOP.

Stack de destino, si ya lo elegí: [lenguaje, framework, herramienta de pruebas, base de datos | "todavía no"]
Mi spec original, si existe: [ruta, o "ninguna"]

Reglas para toda la sesión
- Nunca marques nada como ratificado en mi nombre. Yo ratifico y yo decido.
- No inventes. Donde la intención no se vea en el código ni en mi spec, escribe una línea que empiece con "OPEN:" y pregúntame.
- Describe lo que existe, no un ideal. "Hecho" exige evidencia: el comando que corriste y su salida; pega salidas y códigos de salida reales, nunca describas una que no viste.
- Un cambio por commit, con asunto Conventional Commit.
- Deja en inglés las palabras que lee una verificación automática: OPEN:, verified by:, UNCLAIMED, [observed], MUST, SHOULD, MAY, los nombres de columna de las tablas.

FASE 1 - Leer y fijar. Averigua cómo instalar, correr y probar el origen, corre sus tests ahora e informa el resultado real (no arregles nada de lo que falle). Para cada comportamiento que el sistema ofrece hacia afuera (cada ruta, comando, tarea programada, mensaje que atiende y cada función que otro sistema llama), escribe un contrato de caracterización en docs/migration/contracts/: un script o test pequeño llamado C-NNN-[slug] que corre la cosa real con una entrada fija y verifica la salida observable (o la guarda en un archivo al lado). Cada contrato debe pasar sobre el origen tal como está. Si un comportamiento no se puede fijar sin cambiar código de producción, escribe una línea OPEN: que diga por qué.
FASE 2 - Recuperar la spec y hacer el inventario inverso. Escribe docs/migration/spec/SPEC.md y un docs/migration/spec/F-NNN-[slug].md por funcionalidad, independientes del stack: comportamiento, entidades y relaciones, integraciones, necesidades no funcionales. Un requisito es un encabezado que empieza con su id (### F-001: Nombre; N-001 para los no funcionales), solo en su archivo de funcionalidad; SPEC.md lista las funcionalidades en una tabla (id, nombre, archivo) sin encabezados con id. Los criterios son una línea de lista cada uno, que empieza con su id (F-001.1, nunca renumerado, nunca reutilizado), con DEBE (MUST), DEBERÍA (SHOULD) o PUEDE (MAY), terminan con "verified by:" y la marca [observed] hasta que yo ratifique. Las notas propias de un framework van en docs/migration/impl-notes.md, no en la spec. Luego escribe docs/migration/inventory.md: una fila por cada elemento de la superficie pública que encuentres en el código (rutas, comandos, funciones exportadas que se usan desde afuera, tablas y columnas guardadas, tareas programadas, claves de configuración, tipos de mensaje, archivos leídos o escritos) con las columnas element | where in the code | claimed by | contract | decision. "claimed by" es un id de criterio; un elemento que ningún criterio reclama queda en la tabla marcado UNCLAIMED. No lo borres y no inventes un criterio para él. "contract" es un id C-NNN o queda vacío. Donde mi spec original y el código discrepen, escribe una línea OPEN: que cite ambos lados; no elijas uno.
STOP: termina tu respuesta aquí y no empieces la fase siguiente hasta que yo responda. Muéstrame el inventario con sus filas UNCLAIMED, las líneas OPEN: y las discrepancias. Para cada funcionalidad diré keep, drop o modernize, elegiré el stack de destino si no lo hice y ratificaré por id.
FASE 3 - Aplica mis decisiones. Llena la columna decision (keep, drop, modernize). No quites nada de la tabla: un elemento descartado queda con la palabra dropped y mi razón. Imprime cuántos elementos que se mantienen no tienen contrato. Haz commit e imprímelo.
```

</div>
</div>

### A2. Build the target (formula 1, in the empty target folder)

Open a fresh session in the **empty target folder** and run [1. Greenfield](/formulas/greenfield/) with these two brackets filled:

- **My spec:** `[absolute path of the source folder]/docs/migration/spec`, the features you marked keep or modernize, "already ratified by id; keep the ids exactly as they are; do not re-open what I ratified".
- **Stack:** the target stack you chose.

Greenfield's STOP at the end of phase 1 then becomes a quick confirmation. Copy `docs/migration/spec` and the `contracts` and `inventory.md` into the target's `docs/migration/` so the target carries its own history (a copy, with a line saying from which source commit).

### A3. Parity (in the target)

<div class="prompt-pair" markdown="1">
<div markdown="1">

**English**

```text
Check the migrated system against the source's contracts. The source is [absolute path of the source folder, on branch gs-migrate-DATE]; the target is this folder. Do not change either system's code in this session, and never mark anything as ratified on my behalf.

For each contract in [source]/docs/migration/contracts/ whose inventory row says keep or modernize: run it against the source and against the target (change only how the system is invoked, never the expected output), and write docs/migration/parity.md with one row each: contract | element | source output | target output | same | decision. For a row that is not the same, write the difference verbatim and put OPEN: in decision for me to resolve; never edit a contract or the target to make a row match. Run nothing for dropped elements. Print the table, the count same over total, and the number of kept elements that have no contract. Paste real outputs and exit codes. Finish by running the target's one command and showing exit code 0.
```

</div>
<div markdown="1">

**Español (neutro)**

```text
Verifica el sistema migrado contra los contratos del origen. El origen es [ruta absoluta de la carpeta de origen, en la rama gs-migrate-FECHA]; el destino es esta carpeta. No cambies el código de ninguno de los dos sistemas en esta sesión y nunca marques nada como ratificado en mi nombre.

Para cada contrato de [origen]/docs/migration/contracts/ cuya fila del inventario diga keep o modernize: córrelo contra el origen y contra el destino (cambia solo la forma de invocar el sistema, nunca la salida esperada), y escribe docs/migration/parity.md con una fila cada uno: contract | element | source output | target output | same | decision. Para una fila que no es igual, escribe la diferencia tal cual y pon OPEN: en decision para que yo la resuelva; nunca edites un contrato ni el destino para que una fila coincida. No corras nada para los elementos descartados. Imprime la tabla, la cuenta de iguales sobre el total y cuántos elementos que se mantienen no tienen contrato. Pega salidas y códigos de salida reales. Termina corriendo el comando único del destino y mostrando el código de salida 0.
```

</div>
</div>

### Check that it worked (case A)

1. **The source did not change.** `git diff --stat BASE..HEAD -- [production source folders]` in the source prints nothing; its tests give the same result on BASE and on the branch.
2. **Every contract passes on the source.** Run each one yourself on the branch.
3. **The inventory is complete.** Pick five things the system does that you know by heart (a route, a column, a job, a flag). Each is a row; if one is missing, the inventory is not complete. `UNCLAIMED` rows are not a failure, they are the list of things nobody wrote down.
4. **Parity is yours to read.** Re-run two contracts on both systems; the table says what you see. Every row that is not `same` carries an `OPEN:` and none was settled by editing a contract.
5. **The target has the substrate.** `node gs-check.mjs --repo [target] --strict` ([formula 13](/formulas/verify-substrate/)) reports on the twelve items.

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

- Neither case has a recorded run. Case A inherits the practice page's untested durations and its token cost; case B was written for this page and is the least tested thing in this section.
- **Parity is only as good as the contracts.** A behavior nobody pinned is not compared. The inverse inventory lists what exists; it cannot list what the code does that is not on a surface (an ordering, a side effect, a timing). Run the old and the new system side by side on real data before you switch.
- **The recovered spec records what the code does, including its mistakes.** That is why it is marked `[observed]` and why disagreements are `OPEN:` lines.
- **An inventory is as good as the reader's search.** Dynamically registered routes, reflection and generated code hide elements. Five known items checked by hand (step 3) is a sanity test, not a proof.
- A migration is a decision about the business. The prompts keep the decision with you (keep, drop, modernize; the stack); they do not make it.
- Case B maps files and ids; it does not judge whether the old ones were good, and it keeps decision records exactly as they were, including ones that no longer hold.

## Next

[13. Verify the substrate](/formulas/verify-substrate/) on the result; [4. Refine and ratify](/formulas/refine/) for the `[observed]` criteria; [8. Lock](/formulas/lock/) once there is code with ids.
