---
layout: default
title: "1. Greenfield: spec to substrate and code"
parent: Formulas
nav_order: 1
permalink: /formulas/greenfield/
description: "You wrote the spec. One prompt that turns it into the full substrate (ids, decisions, derived documents, sentinel, gates) and the first feature, in the same session, with a stop for your ratification."
---

# 1. Greenfield: from your spec to the substrate and the code

**Status: written to the canon, not yet tested in a registered run.** No recorded run of this exact wording exists. It is built from the [new project practice page](/practice/new-project/) and the [substrate checklist](/formulas/substrate-checklist/).

## When to use

You have a spec you wrote (a page of notes is enough) and an empty or almost empty folder, and you want the substrate and the first code to arrive together instead of retrofitting the substrate after an MVP. **Not for:** a project that already has code (use [2. Adopt after an MVP](/formulas/adopt/)); a spike you will throw away.

Open a **fresh session** of your assistant **in the project folder**. Any assistant that reads and writes files and runs commands will do. Fill the `[brackets]`.

## The prompt

<div class="prompt-pair" markdown="1">
<div markdown="1">

**English**

```text
Set up this project under Generative Specification from the spec I already wrote, then build its first feature. Work in this folder. Follow the phases in order and stop where it says STOP.

My spec: [paste it here, or give its path]
Stack, only if my spec does not say: [language, framework, test tool, database]
Your instruction file (the sentinel): [CLAUDE.md | AGENTS.md (most other tools, Cursor included) | .github/copilot-instructions.md]

Rules for the whole session
- Never mark anything as ratified on my behalf. I ratify. If you need a decision from me, ask, and continue with the rest.
- Do not invent. Where my spec is silent or ambiguous, write a line that starts with "OPEN:" and ask me. Do not implement anything that depends on an OPEN: line.
- "Done" needs evidence: the command you ran and its output.
- Keep every file you create small and single-purpose.
- Commit each phase separately, one change per commit, with a Conventional Commit subject (feat, fix, docs, test, refactor, chore, ci). Run git init first if there is no repository.
- Paste the real output and exit code of every proof; never describe an output you did not see.

PHASE 1 - Spec. STOP at the end.
Write docs/spec/SPEC.md from my spec: overview, scope, non-goals, a list "the AI must never", and one requirement per feature, written as a heading that starts with its id (### F-001: Name; N-001 for non-functional). Put each feature in docs/spec/F-001-[slug].md, which holds the only heading that starts with that id (its title line does not repeat the id); SPEC.md stays the root and lists the features in a table (id, name, file), without id headings. Under each requirement write acceptance criteria, one list line each, starting with its id (F-001.1, F-001.2). An id is never renumbered and never reused. Each criterion uses MUST, SHOULD or MAY and ends with "verified by:" test, gate, or signed review. Define each criterion once, in its feature file. A criterion you cannot say how to verify becomes an OPEN: line, and an OPEN: line never starts with an id. I will resolve each OPEN: line (it loses the marker) or defer it (it moves to docs/deferred.md, and no feature may depend on it).
STOP: end your reply here and do not start the next phase until I answer. Show me the criteria and every OPEN: line. I will ratify by id.

PHASE 2 - Decisions and derived documents.
- docs/decisions/0001-[slug].md: the stack and architecture and why as ## headings Status, Date, Context, Decision, Consequences (Status is Proposed until I ratify it). One more record per other non-obvious choice.
- docs/architecture.md (modules, responsibilities, dependency direction), docs/data-model.md (skip if nothing is stored), docs/conventions.md (naming, where each kind of file goes, commit format), docs/fixes.md (an empty numbered list for gaps no criterion covers), docs/deferred.md. If nothing is stored, say "no stored data" in docs/architecture.md.
- Start each with "Derived from:" and the spec path and ids that exist in the spec.

PHASE 3 - Sentinel.
Write the instruction file named above, small enough to read whole (for example under 150 lines), with five parts: (1) what the system is, and what it must never do; (2) standards; (3) constraints, each with its reason; (4) tool sequence: a table "gate | command | runs at | red proof", filled in phase 4; (5) routing: a table "topic | file" covering every file from phases 1-2. Name only paths that exist. Finish with this block, unchanged:
  When something fails or is missing, say which case it is BEFORE acting.
  Question: does the ratified spec already require the right behavior?
  a  spec right, code deviates: regression test citing the criterion id, seen failing on the current code, then fix. No spec change.
  b  spec silent or ambiguous: state the gap as a criterion with an id (or a numbered entry in docs/fixes.md); a person ratifies; derive the test; red first; implement.
  c  spec contradicts the intent: change event; ask; change the spec; write the decision record; rerun every check.
  d  tool or sensor missing: add it and list it in the tool sequence; a person ratifies.
  e  way around a gate found: add a NEW test case for the gate. Cases are only ever added.
  Never mark anything ratified on a person's behalf.

PHASE 4 - Gates. Use the standard tools of this stack.
- Tests, and one command that runs every check: [name it in the README].
- A commit-msg hook that rejects messages that are not Conventional Commits. Store it in the repository (for example .githooks/), committed as executable (`git update-index --chmod=+x`, since git skips a hook that is not), and install it from a setup step that runs on a fresh clone (for example a prepare script or `make setup`).
- A pre-push hook, stored and installed the same way, that runs the one command, so a push with a failing check is refused here and not only in CI. Commits stay free, so a red test can be committed first.
- A CI workflow that runs the same command on every push and pull request, on the repository's real default branch.
- A check that fails while any "OPEN:" line exists under docs/spec/.
- docs/baseline.json with measured floors (for example test count, coverage), shaped {"floors": {name: number}, "ceilings": {name: number}}, and a check that fails if a current value is below a floor or above a ceiling, or if docs/baseline.json lowers a floor or raises a ceiling compared with an earlier commit (read the earlier versions from git). Floors only go up, ceilings only go down.
- A command that prints exactly one line "criteria coverage: N/M" and nothing else (criterion ids cited by at least one test, over all criteria) and fails if a test cites an id the spec does not have. Match whole ids: F-001.1 is not F-001.10.
Add each gate to the sentinel table; name the rows for the checks above open-questions, ratchet and coverage. Its red proof is one shell command that, run in a throwaway copy of the repository, plants a violation and runs the gate, and exits non-zero, and its failure message must name the violation, not a missing dependency (the checker runs it after the setup step). No pipe character in the command; for a longer plant, write a script and name it.
Prove each gate: plant one violation, show it fail, remove it, show it pass. Then clone the repository to a temporary folder, run the setup step and the one command there, and show exit code 0.
README.md: under a heading "Fresh clone", one fenced block with the exact commands, one per line, that install dependencies, install the hook and run the one command from a fresh clone. They must finish by themselves (do not start a server).
Gate files, the baseline and the hook are not yours to weaken: create CODEOWNERS listing them (docs/baseline.json at least) with the placeholder owner @OWNER, which I will replace, and tell me to require owner review on the shared branch, which only I can set.

PHASE 5 - First feature.
Implement F-001, only the criteria I ratified. When the tests exist, re-measure docs/baseline.json, raise the floors to the new numbers and commit. For each criterion write a test that cites its id (name or comment, for example F-001.2), run it and show it fail for the right reason, then implement, then show everything green. Make small commits; each message is typed (feat, test, docs, ci) and names the id it serves.

PHASE 6 - Report.
Print a table, one row per item, PRESENT or MISSING, with the command or file that shows it: sentinel routes; requirement ids; criterion ids; decision records; derived documents; tests and a blocking gate; ratchet; open-questions check; criteria coverage N/M; typed atomic commits; README from a fresh clone; spec lock; co-change gate. The lock and the co-change gate are for day 7 to 30, once there is code with ids: write "later" and do not build them now. End with what you could not verify and the decisions you need from me.
```

</div>
<div markdown="1">

**Español (neutro)**

```text
Configura este proyecto con Generative Specification a partir de la spec que ya escribí y luego construye su primera funcionalidad. Trabaja en esta carpeta. Sigue las fases en orden y detente donde diga STOP.

Mi spec: [pégala aquí o indica su ruta]
Stack, solo si mi spec no lo dice: [lenguaje, framework, herramienta de pruebas, base de datos]
Tu archivo de instrucciones (el centinela): [CLAUDE.md | AGENTS.md (most other tools, Cursor included) | .github/copilot-instructions.md]

Reglas para toda la sesión
- Nunca marques nada como ratificado en mi nombre. Yo ratifico. Si necesitas una decisión mía, pregúntala y sigue con el resto.
- No inventes. Donde mi spec calle o sea ambigua, escribe una línea que empiece con "OPEN:" y pregúntame. No implementes nada que dependa de una línea OPEN:.
- "Hecho" exige evidencia: el comando que corriste y su salida.
- Mantén cada archivo que crees pequeño y con un solo propósito.
- Haz commit de cada fase por separado, un cambio por commit, con asunto Conventional Commit (feat, fix, docs, test, refactor, chore, ci). Corre git init primero si no hay repositorio.
- Pega la salida real y el código de salida de cada prueba; nunca describas una salida que no viste.
- Deja en inglés las palabras que lee una verificación automática: OPEN:, verified by:, Derived from:, PRESENT, MISSING, later, "Fresh clone", los encabezados Status, Date, Context, Decision, Consequences y los nombres de columna de las tablas.

FASE 1 - Spec. STOP al final.
Escribe docs/spec/SPEC.md a partir de mi spec: resumen, alcance, lo que queda fuera, una lista "la IA nunca debe" y un requisito por funcionalidad, escrito como un encabezado que empieza con su id (### F-001: Nombre; N-001 para los no funcionales). Pon cada funcionalidad en docs/spec/F-001-[slug].md, que contiene el único encabezado que empieza con ese id (su línea de título no repite el id); SPEC.md sigue siendo la raíz y las lista en una tabla (id, nombre, archivo), sin encabezados con id. Bajo cada requisito escribe criterios de aceptación, una línea de lista cada uno, que empiece con su id (F-001.1, F-001.2). Un id nunca se renumera ni se reutiliza. Cada criterio usa DEBE (MUST), DEBERÍA (SHOULD) o PUEDE (MAY) y termina con "verified by:" test, gate o revisión firmada. Define cada criterio una sola vez, en su archivo de funcionalidad. Un criterio cuya verificación no sepas describir se convierte en una línea OPEN:, y una línea OPEN: nunca empieza con un id. Yo resolveré cada línea OPEN: (pierde la marca) o la aplazaré (pasa a docs/deferred.md, y ninguna funcionalidad puede depender de ella).
STOP: termina tu respuesta aquí y no empieces la fase siguiente hasta que yo responda. Muéstrame los criterios y cada línea OPEN:. Yo ratifico por id.

FASE 2 - Decisiones y documentos derivados.
- docs/decisions/0001-[slug].md: el stack y la arquitectura elegidos y por qué como encabezados ## Status, Date, Context, Decision, Consequences (Status es Proposed hasta que yo lo ratifique). Un registro más por cada otra decisión no obvia.
- docs/architecture.md (módulos, responsabilidades, dirección de las dependencias), docs/data-model.md (omítelo si no se guarda nada), docs/conventions.md (nombres, dónde va cada tipo de archivo, formato de commits), docs/fixes.md (una lista numerada vacía para huecos que ningún criterio cubre), docs/deferred.md. Si no se guarda nada, escribe "no stored data" en docs/architecture.md.
- Empieza cada uno con "Derived from:" y la ruta y los ids de la spec.

FASE 3 - Centinela.
Escribe el archivo de instrucciones indicado arriba, lo bastante pequeño para leerse completo (por ejemplo menos de 150 líneas), con cinco partes: (1) qué es el sistema y qué nunca debe hacer; (2) estándares; (3) restricciones, cada una con su razón; (4) secuencia de herramientas: una tabla "gate | command | runs at | red proof", que llenarás en la fase 4; (5) ruteo: una tabla "topic | file" que cubra todos los archivos de las fases 1-2. Nombra solo rutas que existan. Termina con este bloque, sin cambios:
  Cuando algo falle o falte, di de qué caso se trata ANTES de actuar.
  Pregunta: ¿la spec ratificada ya exigía el comportamiento correcto?
  a  la spec es correcta y el código se desvía: test de regresión que cita el id del criterio, visto fallar contra el código actual, y luego el arreglo. La spec no cambia.
  b  la spec calla o es ambigua: escribe el hueco como criterio con id (o como entrada numerada en docs/fixes.md); una persona ratifica; deriva el test; rojo primero; implementa.
  c  la spec contradice la intención: evento de cambio; pregunta; cambia la spec; escribe el registro de la decisión; corre de nuevo todas las verificaciones.
  d  falta una herramienta o un sensor: agrégalo y anótalo en la secuencia de herramientas; una persona ratifica.
  e  se encontró una forma de burlar un gate: agrega un caso de prueba NUEVO para el gate. Los casos solo se agregan.
  Nunca marques nada como ratificado en nombre de una persona.

FASE 4 - Gates. Usa las herramientas estándar de este stack.
- Pruebas, y un solo comando que corra todas las verificaciones: [ponle nombre en el README].
- Un hook commit-msg que rechace los mensajes que no sigan Conventional Commits. Guárdalo en el repositorio (por ejemplo .githooks/), commiteado como ejecutable (`git update-index --chmod=+x`, porque git ignora un hook que no lo es), e instálalo con un paso de preparación que corra en un clon nuevo (por ejemplo un script prepare o `make setup`).
- Un hook pre-push, guardado e instalado de la misma manera, que corra el comando único, para que un push con una verificación en rojo se rechace aquí y no solo en CI. Los commits quedan libres, así que un test en rojo se puede commitear primero.
- Un workflow de CI que corra el mismo comando en cada push y pull request, sobre la rama principal real del repositorio.
- Una verificación que falle mientras exista alguna línea "OPEN:" bajo docs/spec/.
- docs/baseline.json con pisos medidos (por ejemplo cantidad de tests, cobertura), con la forma {"floors": {nombre: número}, "ceilings": {nombre: número}}, y una verificación que falle si un valor actual queda bajo un piso o sobre un techo, o si docs/baseline.json baja un piso o sube un techo respecto de un commit anterior (lee las versiones anteriores desde git). Los pisos solo suben, los techos solo bajan.
- Un comando que imprima exactamente una línea "criteria coverage: N/M" y nada más (ids de criterios citados por al menos un test, sobre todos los criterios) y que falle si un test cita un id que la spec no tiene. Compara ids completos: F-001.1 no es F-001.10.
Agrega cada gate a la tabla del centinela; llama a las filas de las verificaciones anteriores open-questions, ratchet y coverage. Su prueba en rojo es un comando de shell que, corrido en una copia desechable del repositorio, planta una violación, corre el gate y termina con código distinto de cero, y su mensaje de fallo debe nombrar la violación, no una dependencia faltante (quien verifique lo corre después del paso de preparación). Sin el carácter de tubería en el comando; para una plantación larga, escribe un script y nómbralo.
Demuestra cada gate: planta una violación, muestra que falla, quítala, muestra que pasa. Luego clona el repositorio en una carpeta temporal, corre allí el paso de preparación y el comando único, y muestra el código de salida 0.
README.md: bajo un encabezado "Fresh clone", un bloque de código con los comandos exactos, uno por línea, que instalen las dependencias, instalen el hook y corran el comando único desde un clon nuevo. Deben terminar solos (no levantes un servidor).
Los archivos de gates, el baseline y el hook no son tuyos para debilitar: crea un CODEOWNERS que los liste (al menos docs/baseline.json) con el dueño provisional @OWNER, que yo reemplazaré y dime que exija la revisión de los dueños en la rama compartida, algo que solo yo puedo configurar.

FASE 5 - Primera funcionalidad.
Implementa F-001, solo los criterios que yo ratifiqué. Cuando existan los tests, vuelve a medir docs/baseline.json, sube los pisos a los números nuevos y haz commit. Para cada criterio escribe un test que cite su id (en el nombre o en un comentario, por ejemplo F-001.2), córrelo y muestra que falla por la razón correcta, luego implementa y muestra todo en verde. Haz commits pequeños; cada mensaje lleva tipo (feat, test, docs, ci) y nombra el id al que sirve.

FASE 6 - Informe.
Imprime una tabla, una fila por ítem, PRESENT o MISSING, con el comando o archivo que lo muestra: el centinela rutea; ids de requisitos; ids de criterios; registros de decisiones; documentos derivados; pruebas y un gate bloqueante; trinquete; verificación de preguntas abiertas; cobertura de criterios N/M; commits tipados y atómicos; README desde un clon nuevo; lock de la spec; gate de co-cambio. El lock y el gate de co-cambio son para el día 7 al 30, cuando ya haya código con ids: escribe "later" y no los construyas ahora. Termina con lo que no pudiste verificar y las decisiones que necesitas de mí.
```

</div>
</div>

## What good output looks like

- `docs/spec/SPEC.md` plus one `docs/spec/F-NNN-*.md` per feature, every requirement and every criterion with an id, and an `OPEN:` list you can read in a minute.
- `docs/decisions/0001-*.md`, `docs/architecture.md`, `docs/conventions.md` (and `docs/data-model.md` if data is stored), each starting with a `Derived from:` line.
- A sentinel under about 150 lines whose routing table names files that exist, with the triage block at the end.
- A hook, a CI workflow, `docs/baseline.json`, the open-questions check and the coverage command, all listed in the sentinel's gate table with a red proof.
- Tests that cite criterion ids, a short commit history with typed messages, and a final table you can compare with the checklist.

The text will differ from run to run. Judge the files and the checks, not the wording.

## Check that it worked

Do not take the assistant's table as proof. Run the checks yourself, ideally in a clean clone. The same commands, in a form a program can run, are in the [substrate checklist](/formulas/substrate-checklist/).

1. **Routes resolve.** Every path the sentinel names exists, and every file under `docs/` is reachable from it.
2. **Ids resolve.** Criteria ids are unique and well formed; the coverage command prints `N/M` and exits 0.
3. **The gates fail when they should.** In a throwaway clone: add a line `OPEN: test` to a spec file and run the one command, it must fail; delete one test and run it, the ratchet check must fail because the test count fell below its floor (the floors were raised at the end of phase 5); run `git commit --allow-empty -m "fixed stuff"`, the hook must reject it.
4. **A clean clone works.** `git clone . "$(mktemp -d)/check"` and `cd` into it (only committed work is cloned, so commit first), run the README's commands, expect exit 0, then repeat step 3's commit test there (this proves the hook installed itself).
5. **A person ratified.** The criteria you read at the STOP are the ones in the file, and none you did not ratify carries a ratified mark.

## Known limits

- Not run in a registered run. The closest lab relatives (course practicals on spec-first work and on a gate broken on purpose) each ran once on a sample project, one assistant, one observation, not a rate.
- A hook is not a wall: `git commit --no-verify` skips it. Only a check on the shared branch (CI, protected branch) stops that, and a clone cannot show you the server's settings.
- The criteria are only as good as your spec. The prompt asks for `OPEN:` lines instead of guesses, but an assistant can still miss a silence. Run [4. Refine and ratify](/formulas/refine/) on the result.
- The lock and the co-change gate are not built here on purpose. They belong to [8. Lock and co-change gate](/formulas/lock/), once there is code with ids.
- The prompt asks for a lot. If your assistant stops halfway, tell it the phase number to continue from; each phase leaves files the next one reads.

## Next

[4. Refine and ratify](/formulas/refine/) the spec once, then [5. Change](/formulas/change/) for every feature, fix and refactor after this.
