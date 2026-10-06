---
layout: default
title: "2. Adopt after an MVP"
parent: Formulas
nav_order: 2
permalink: /formulas/adopt/
description: "You wrote a spec, built an MVP, and now want the substrate. One prompt that adds it to the existing repository without changing what the code does, and reports honestly what the code does not match."
---

# 2. Adopt after an MVP (brownfield)

**Status: written to the canon, not yet tested in a registered run.** No recorded run of this exact wording exists. It is built from the [existing project practice page](/practice/existing-project/) and the [substrate checklist](/formulas/substrate-checklist/).

## When to use

The code exists and runs; you may or may not still have the spec you started from. You want the substrate (spec with ids, decisions, sentinel, gates, ratchet) added on top, **without changing behavior**. **Not for:** fixing what the audit finds (that is [5. Change](/formulas/change/), one finding at a time, after this); a project you only joined and may not change (use [3. Join a codebase](/formulas/join/)).

Open a **fresh session** in the project folder. Fill the `[brackets]`.

## The prompt

<div class="prompt-pair" markdown="1">
<div markdown="1">

**English**

```text
Add Generative Specification to this existing project without changing what it does. Work on a new branch named gs-adopt-[YYYY-MM-DD], never on the main branch. Do not change production source code in this session: you may add documents, tests, hooks, CI, gate configuration, package scripts and the README. Follow the phases in order and stop where it says STOP. First run git rev-parse HEAD and keep it as BASE; print it in the report.

My original spec, if any: [path, or "none"]
Your instruction file (the sentinel): [CLAUDE.md | AGENTS.md (most other tools, Cursor included) | .github/copilot-instructions.md]

Rules for the whole session
- Never mark anything as ratified on my behalf. I ratify. If you need a decision from me, ask, and continue with the rest.
- Do not invent. Where intent is not visible in the code or my spec, write a line that starts with "OPEN:" and ask me.
- "Done" needs evidence: the command you ran and its output.
- Commit each phase separately, one change per commit, with a Conventional Commit subject (feat, fix, docs, test, refactor, chore, ci).
- Paste the real output and exit code of every proof; never describe an output you did not see.
- Do not mark [observed] criteria as ratified and do not write ratification records; I do that.
- Describe what exists, not an ideal. If the code deviates from good practice, write it as [currently: X - target: Y] and leave it.

PHASE 1 - Read.
Read the code, the README, the configuration and the last 50 commits. Do not ask me what the code does. Find how to install, run and test it. Run the tests now and report the real result (do not fix anything that fails). Print: what the system does, its modules, how to run and test it, and the tests' current result.

PHASE 2 - Spec from the code. STOP at the end.
Write docs/spec/SPEC.md and docs/spec/F-001-[slug].md and so on, in this shape: overview, scope, non-goals, a list "the AI must never", one requirement per feature, written as a heading that starts with its id (### F-001: Name; N-001 for non-functional), acceptance criteria one list line each, starting with its id (F-001.1, F-001.2; never renumbered, never reused). Each criterion uses MUST, SHOULD or MAY and ends with "verified by:" test, gate, or signed review. Derive them from what the code actually does and put the tag [observed] at the END of each criterion line until I ratify it. Use my original spec's wording where the code matches it. Every place where my spec and the code disagree becomes an OPEN: line quoting both; do not choose a side.
STOP: end your reply here and do not start the next phase until I answer. Show me the criteria, the OPEN: lines and the disagreements. I will ratify by id.

PHASE 3 - Pin the behavior.
For each criterion on the main paths, write a test that cites its id (name or comment, for example F-001.2) and passes on the current code. Put the tests in a tests/ folder or in files named *.test.* or *_test.*. Do not touch production code to make a criterion testable. These tests describe today's behavior; they do not judge it. If a criterion cannot be tested without changing production code, write an OPEN: line and say why.

PHASE 4 - Decisions and derived documents.
- docs/decisions/0001-existing-architecture.md: descriptive with the headings Status, Date, Context, Decision (the architecture as it is), Consequences (what it makes easy and hard). Never prescriptive.
- docs/architecture.md, docs/data-model.md, docs/conventions.md, derived from the code; docs/fixes.md (an empty numbered list for gaps no criterion covers) and docs/deferred.md. If nothing is stored, skip data-model.md and say "no stored data" in docs/architecture.md. Start each derived document with "Derived from:" and the spec path and ids that exist in the spec. Mark unclear parts OPEN:.

PHASE 5 - Sentinel.
Write the instruction file named above, small enough to read whole (for example under 150 lines), with five parts: (1) what the system is, and what it must never do; (2) standards that apply today; (3) constraints, each with its reason; (4) tool sequence: a table "gate | command | runs at | red proof", filled in phase 6; (5) routing: a table "topic | file" covering every file from phases 2-4, and the code layout as it is. Name only paths that exist. Finish with this block, unchanged:
  When something fails or is missing, say which case it is BEFORE acting.
  Question: does the ratified spec already require the right behavior?
  a  spec right, code deviates: regression test citing the criterion id, seen failing on the current code, then fix. No spec change.
  b  spec silent or ambiguous: state the gap as a criterion with an id (or a numbered entry in docs/fixes.md); a person ratifies; derive the test; red first; implement.
  c  spec contradicts the intent: change event; ask; change the spec; write the decision record; rerun every check.
  d  tool or sensor missing: add it and list it in the tool sequence; a person ratifies.
  e  way around a gate found: add a NEW test case for the gate. Cases are only ever added.
  Never mark anything ratified on a person's behalf.

PHASE 6 - Gates, measured first.
Measure what is true today (test count and result, coverage, lint and type errors, anything the stack reports). Write the numbers to docs/baseline.json, shaped {"floors": {name: number}, "ceilings": {name: number}}: floors for what should not fall (tests, coverage), ceilings for error counts. They never get worse. Then, with the standard tools of this stack:
- One command that runs every check; the README names it.
- A commit-msg hook that rejects messages that are not Conventional Commits, stored in the repository (for example .githooks/) and installed by a setup step that runs on a fresh clone.
- A pre-push hook, stored and installed the same way, that runs the one command, so a push with a failing blocking check is refused here and not only in CI. Commits stay free.
- A CI workflow that runs the same command on every push and pull request, on the repository's real default branch.
- A check that fails while any "OPEN:" line exists in the spec files that are being implemented.
- A check that fails when a baseline number gets worse, or when docs/baseline.json lowers a floor or raises a ceiling compared with an earlier commit (read the earlier versions from git).
- A command that prints exactly one line "criteria coverage: N/M" and nothing else and fails if a test cites an id the spec does not have. Match whole ids: F-001.1 is not F-001.10.
A gate that fails on today's code starts as advisory (it reports, it does not block) and is marked advisory in the table. A blocking gate must be green now, and at least one gate must be blocking now (for example the commit hook or the criteria check). The one command exits non-zero only for blocking gates. Every row, advisory or not, still needs a red proof that exits non-zero.
Add each gate to the sentinel table; name the rows for the checks above open-questions, ratchet and coverage. Its red proof is one shell command that, run in a throwaway copy of the repository, plants a violation and runs the gate, and exits non-zero, and its failure message must name the violation, not a missing dependency (the checker runs it after the setup step). No pipe character in the command; for a longer plant, write a script and name it. Prove each blocking gate: plant one violation, show it fail with the printed exit code, remove it, show it pass. Then clone the repository to a temporary folder, run the setup step and the one command there, and show exit code 0.
README.md: under a heading "Fresh clone", one fenced block with the exact commands, one per line, that install dependencies, install the hook and run the one command from a fresh clone. They must finish by themselves (do not start a server).
Gate files, the baseline and the hook are not yours to weaken: create CODEOWNERS listing them (docs/baseline.json at least) with the placeholder owner @OWNER, which I will replace, and tell me to require owner review on the shared branch, which only I can set.

PHASE 7 - Report.
Print a table, one row per item, PRESENT, PARTIAL or MISSING, with the command or file that shows it: sentinel routes; requirement ids; criterion ids; decision records; derived documents; tests and a blocking gate; ratchet; open-questions check; criteria coverage N/M; typed atomic commits (BASE..HEAD); README from a fresh clone; spec lock; co-change gate. The lock and the co-change gate are for day 7 to 30, once there is code with ids: write "later". Then list the OPEN: lines, the [currently - target] deviations, and any test that fails today. Do not start remediation.
```

</div>
<div markdown="1">

**Español (neutro)**

```text
Agrega Generative Specification a este proyecto existente sin cambiar lo que hace. Trabaja en una rama nueva llamada gs-adopt-[AAAA-MM-DD], nunca en la rama principal. No cambies el código de producción en esta sesión: puedes agregar documentos, tests, hooks, CI, configuración de gates, scripts del gestor de paquetes y el README. Sigue las fases en orden y detente donde diga STOP. Primero corre git rev-parse HEAD y guárdalo como BASE; imprímelo en el informe.

Mi spec original, si existe: [ruta, o "ninguna"]
Tu archivo de instrucciones (el centinela): [CLAUDE.md | AGENTS.md (most other tools, Cursor included) | .github/copilot-instructions.md]

Reglas para toda la sesión
- Nunca marques nada como ratificado en mi nombre. Yo ratifico. Si necesitas una decisión mía, pregúntala y sigue con el resto.
- No inventes. Donde la intención no se vea en el código ni en mi spec, escribe una línea que empiece con "OPEN:" y pregúntame.
- "Hecho" exige evidencia: el comando que corriste y su salida.
- Haz commit de cada fase por separado, un cambio por commit, con asunto Conventional Commit (feat, fix, docs, test, refactor, chore, ci).
- Pega la salida real y el código de salida de cada prueba; nunca describas una salida que no viste.
- No marques como ratificados los criterios [observed] ni escribas registros de ratificación; eso lo hago yo.
- Describe lo que existe, no un ideal. Si el código se aparta de la buena práctica, escríbelo como [currently: X - target: Y] y déjalo así.
- Deja en inglés las palabras que lee una verificación automática: OPEN:, verified by:, Derived from:, PRESENT, PARTIAL, MISSING, later, [observed], "Fresh clone", los encabezados Status, Date, Context, Decision, Consequences y los nombres de columna de las tablas.

FASE 1 - Leer.
Lee el código, el README, la configuración y los últimos 50 commits. No me preguntes qué hace el código. Averigua cómo instalarlo, ejecutarlo y probarlo. Corre ahora los tests e informa el resultado real (no arregles nada de lo que falle). Imprime: qué hace el sistema, sus módulos, cómo ejecutarlo y probarlo, y el resultado actual de los tests.

FASE 2 - Spec a partir del código. STOP al final.
Escribe docs/spec/SPEC.md y docs/spec/F-001-[slug].md y así sucesivamente, con esta forma: resumen, alcance, lo que queda fuera, una lista "la IA nunca debe", un requisito por funcionalidad, escrito como un encabezado que empieza con su id (### F-001: Nombre; N-001 para los no funcionales), criterios de aceptación de una línea de lista cada uno, que empiece con su id (F-001.1, F-001.2; nunca se renumeran ni se reutilizan). Cada criterio usa DEBE (MUST), DEBERÍA (SHOULD) o PUEDE (MAY) y termina con "verified by:" test, gate o revisión firmada. Derívalos de lo que el código hace de verdad y pon la etiqueta [observed] al FINAL de la línea de cada criterio hasta que yo lo ratifique. Usa las palabras de mi spec original donde el código coincida con ella. Cada lugar donde mi spec y el código discrepen se convierte en una línea OPEN: que cite a ambos; no elijas un lado.
STOP: termina tu respuesta aquí y no empieces la fase siguiente hasta que yo responda. Muéstrame los criterios, las líneas OPEN: y las discrepancias. Yo ratifico por id.

FASE 3 - Fijar el comportamiento.
Para cada criterio de los caminos principales, escribe un test que cite su id (en el nombre o en un comentario, por ejemplo F-001.2) y que pase con el código actual. Pon los tests en una carpeta tests/ o en archivos llamados *.test.* o *_test.*. No toques el código de producción para hacer testeable un criterio. Estos tests describen el comportamiento de hoy; no lo juzgan. Si un criterio no se puede probar sin cambiar el código de producción, escribe una línea OPEN: y explica por qué.

FASE 4 - Decisiones y documentos derivados.
- docs/decisions/0001-existing-architecture.md: descriptivo con los encabezados Status, Date, Context, Decision (la arquitectura tal como es), Consequences (lo que facilita y lo que dificulta). Nunca prescriptivo.
- docs/architecture.md, docs/data-model.md, docs/conventions.md, derivados del código; docs/fixes.md (una lista numerada vacía para huecos que ningún criterio cubre) y docs/deferred.md. Si no se guarda nada, omite data-model.md y escribe "no stored data" en docs/architecture.md. Empieza cada documento derivado con "Derived from:" y la ruta y los ids que existan en la spec. Marca OPEN: lo que no esté claro.

FASE 5 - Centinela.
Escribe el archivo de instrucciones indicado arriba, lo bastante pequeño para leerse completo (por ejemplo menos de 150 líneas), con cinco partes: (1) qué es el sistema y qué nunca debe hacer; (2) estándares que rigen hoy; (3) restricciones, cada una con su razón; (4) secuencia de herramientas: una tabla "gate | command | runs at | red proof", que llenarás en la fase 6; (5) ruteo: una tabla "topic | file" que cubra todos los archivos de las fases 2-4, y la estructura del código tal como es. Nombra solo rutas que existan. Termina con este bloque, sin cambios:
  Cuando algo falle o falte, di de qué caso se trata ANTES de actuar.
  Pregunta: ¿la spec ratificada ya exigía el comportamiento correcto?
  a  la spec es correcta y el código se desvía: test de regresión que cita el id del criterio, visto fallar contra el código actual, y luego el arreglo. La spec no cambia.
  b  la spec calla o es ambigua: escribe el hueco como criterio con id (o como entrada numerada en docs/fixes.md); una persona ratifica; deriva el test; rojo primero; implementa.
  c  la spec contradice la intención: evento de cambio; pregunta; cambia la spec; escribe el registro de la decisión; corre de nuevo todas las verificaciones.
  d  falta una herramienta o un sensor: agrégalo y anótalo en la secuencia de herramientas; una persona ratifica.
  e  se encontró una forma de burlar un gate: agrega un caso de prueba NUEVO para el gate. Los casos solo se agregan.
  Nunca marques nada como ratificado en nombre de una persona.

FASE 6 - Gates, primero medir.
Mide lo que es verdad hoy (cantidad de tests y resultado, cobertura, errores de lint y de tipos, lo que reporte el stack). Escribe los números en docs/baseline.json, con la forma {"floors": {nombre: número}, "ceilings": {nombre: número}}: pisos para lo que no debe bajar (tests, cobertura), techos para los conteos de errores. Nunca empeoran. Luego, con las herramientas estándar de este stack:
- Un comando que corra todas las verificaciones; el README lo nombra.
- Un hook commit-msg que rechace los mensajes que no sigan Conventional Commits, guardado en el repositorio (por ejemplo .githooks/) e instalado con un paso de preparación que corra en un clon nuevo.
- Un hook pre-push, guardado e instalado de la misma manera, que corra el comando único, para que un push con una verificación bloqueante en rojo se rechace aquí y no solo en CI. Los commits quedan libres.
- Un workflow de CI que corra el mismo comando en cada push y pull request, sobre la rama principal real del repositorio.
- Una verificación que falle mientras exista alguna línea "OPEN:" en los archivos de spec que se están implementando.
- Una verificación que falle cuando un número del baseline empeore, o cuando docs/baseline.json baje un piso o suba un techo respecto de un commit anterior (lee las versiones anteriores desde git).
- Un comando que imprima exactamente una línea "criteria coverage: N/M" y nada más y que falle si un test cita un id que la spec no tiene. Compara ids completos: F-001.1 no es F-001.10.
Un gate que falla con el código de hoy empieza como aviso (informa, no bloquea) y se marca como aviso en la tabla. Un gate bloqueante debe estar en verde ahora, y al menos un gate debe ser bloqueante ahora (por ejemplo el hook de commits o la verificación de criterios). El comando único termina con código distinto de cero solo por gates bloqueantes. Cada fila, sea aviso o no, necesita igualmente una prueba en rojo que termine con código distinto de cero.
Agrega cada gate a la tabla del centinela; llama a las filas de las verificaciones anteriores open-questions, ratchet y coverage. Su prueba en rojo es un comando de shell que, corrido en una copia desechable del repositorio, planta una violación, corre el gate y termina con código distinto de cero, y su mensaje de fallo debe nombrar la violación, no una dependencia faltante (quien verifique lo corre después del paso de preparación). Sin el carácter de tubería en el comando; para un plant largo, escribe un script y nómbralo. Demuestra cada gate bloqueante: planta una violación, muestra que falla con el código de salida impreso, quítala, muestra que pasa. Luego clona el repositorio en una carpeta temporal, corre allí el paso de preparación y el comando único, y muestra el código de salida 0.
README.md: bajo un encabezado "Fresh clone", un bloque de código con los comandos exactos, uno por línea, que instalen las dependencias, instalen el hook y corran el comando único desde un clon nuevo. Deben terminar solos (no levantes un servidor).
Los archivos de gates, el baseline y el hook no son tuyos para debilitar: crea un CODEOWNERS que los liste (al menos docs/baseline.json) con el dueño provisional @OWNER, que yo reemplazaré y dime que exija la revisión de los dueños en la rama compartida, algo que solo yo puedo configurar.

FASE 7 - Informe.
Imprime una tabla, una fila por ítem, PRESENT, PARTIAL o MISSING, con el comando o archivo que lo muestra: el centinela rutea; ids de requisitos; ids de criterios; registros de decisiones; documentos derivados; pruebas y un gate bloqueante; trinquete; verificación de preguntas abiertas; cobertura de criterios N/M; commits tipados y atómicos (BASE..HEAD); README desde un clon nuevo; lock de la spec; gate de co-cambio. El lock y el gate de co-cambio son para el día 7 al 30, cuando ya haya código con ids: escribe "later". Luego lista las líneas OPEN:, las desviaciones [currently - target] y cualquier test que hoy falle. No empieces ninguna remediación.
```

</div>
</div>

## What good output looks like

- A branch `gs-adopt-DATE` whose diff touches no production source file. Check it with the command below.
- A spec whose criteria are tagged `[observed]` until you ratified them, and an honest `OPEN:` list that includes every place your original spec and the code disagree.
- Tests that cite criterion ids and pass on the code as it is, so "green" means "unchanged".
- A baseline of today's numbers, and gates that are either green now (blocking) or marked advisory.
- A report with `PARTIAL` and `MISSING` rows. A report that says everything is `PRESENT` on an old MVP deserves suspicion.

## Check that it worked

1. **Behavior did not change.** `git diff --stat BASE..HEAD -- [your production source folders]` prints nothing (BASE is the commit printed in the report). The tests that existed before give the same result: run them on BASE and on the branch and compare; tests that failed on BASE may still fail.
2. **Disagreements are visible.** Pick two features where you remember the code drifted from your spec. Each appears as an `OPEN:` line quoting both sides.
3. **Routes and ids resolve; gates fail when they should; a clean clone works.** Run the same five checks as in [1. Greenfield](/formulas/greenfield/#check-that-it-worked), or the machine-readable version in the [substrate checklist](/formulas/substrate-checklist/). For commits, check only `BASE..HEAD`: the old history will not conform.
4. **The baseline is true.** Re-run the commands that produced its numbers: they match.
5. **You, not the assistant, ratified.** Every criterion you did not ratify still carries `[observed]`.

## Known limits

- Not run in a registered run. The closest lab relatives (an audit and a remediation variant on a sample project) each ran once; one assistant, one observation, not a rate.
- The spec comes from the code, so it records what the code does, including its mistakes. That is why you ratify by id and why disagreements become `OPEN:` lines, not choices.
- Characterization tests pin today's behavior, bugs included. A test that passes proves the behavior is unchanged, not that it is right.
- The prompt does not fix anything. The deviations it lists are the input to [5. Change](/formulas/change/); the [free audit](/formulas/audit/) shows where to look first.
- A hook can be skipped with `git commit --no-verify`; only a check on the shared branch stops that, and a clone cannot show you the server's settings.
- Large codebases will not fit one session. Say "continue from phase N" and keep each phase's files as the handoff; do not paste summaries.

## Next

[4. Refine and ratify](/formulas/refine/), then [9. Audit](/formulas/audit/) to see the letters, and [5. Change](/formulas/change/) for each finding.
