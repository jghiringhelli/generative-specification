---
layout: default
title: "8. Lock and co-change gate"
parent: Formulas
nav_order: 8
permalink: /formulas/lock/
description: "Day 7 to 30, once there is code with ids: install the reference lock tool, tag the derived artifacts with the spec section they came from, write the first lock, wire the co-change gate and prove each one red then green. A deterministic tool with its own tests; the prompt only installs and wires it."
---

# 8. Add the lock and the co-change gate (day 7 to 30)

**Status: written to the canon, not yet tested in a registered run.** The mechanism is now a reference implementation: `gs-lock.mjs`, `gs-cochange.mjs` and `gs-redproof.mjs` in `tools/gs-lock/` of this repository (Node, no dependencies, no model, MIT), with 75 tests of its own, the 35 scenarios of the lab self-test among them. That shows it detects what it is defined to detect. It has **not** been run on a model-written project in a registered run, and no effect on defects was measured. In the development loop of 2026-10-06 the earlier wording (the assistant writes the scripts) reached a complete working lock in 1 of 3 side-probe runs (development, not evidence), which is why this version installs a tool instead of asking for one. Definitions: [coherence between spec and code](/method/coherence/).

## When to use

A week or more in, when the project has **code with ids**: criteria in `docs/spec/`, tests and sources that derive from them, and the one command and CI already working ([1](/formulas/greenfield/) or [2](/formulas/adopt/), and one gate proven with [7](/formulas/gate/)). The lock answers "from which version of the intent did this artifact come?"; the co-change gate answers "did this commit say why it changed behavior?". **Not for:** day one. Without ids and a working gate there is nothing to lock.

Open a **fresh session** in the project folder. Fill the `[brackets]`: the tool files are the ones in `tools/gs-lock/` of this repository (give the path of your copy, or the URL). The assistant copies them; it does not write them.

## The prompt

<div class="prompt-pair" markdown="1">
<div markdown="1">

**English**

```text
Add the spec lock and the co-change gate to this project with the reference tool I give you. Work on a branch named gs-lock-[YYYY-MM-DD]. Follow the steps in order.

Reference tool, three files you copy and never edit: [path or URL of gs-lock.mjs, gs-cochange.mjs and gs-redproof.mjs]
Default branch of this repository: [main | master | other]

Rules for the whole session
- Never run `ratify`, and never write a line in docs/ratifications.md. A person ratifies a spec change that is meant; I do it.
- Do not write or edit the tool files or docs/spec.lock by hand. If the tool cannot do what is needed, stop and tell me.
- Do not change what the code does. Paste the real output and exit code of every command; never describe an output you did not see.
- One change per commit, Conventional Commit subject, and cite the id it serves where there is one.

Precondition: criteria with ids exist under docs/spec/, at least one test or source file derives from them, the project's one command runs green, and Node 18 or later is installed. If not, stop and tell me what is missing.

1. Install. Copy the three files unchanged to tools/gs-lock/. Run `node tools/gs-lock/gs-lock.mjs check` and show it say NOLOCK: the tool runs here.
2. Tag. Give each living derived artifact (a test, or a source file that implements a criterion) one comment line: @gs [criterion-id] [spec-path]#[section], where [section] is the GitHub-style anchor of the heading that holds the criterion (lowercase, spaces to hyphens, punctuation removed; for example docs/spec/F-001-x.md#f-001-register-a-hive). The tag has no hash, so a spec change never forces a code edit. Add tags to the existing tests and to the sources that implement a criterion. Show that the tests and the type check give the same results before and after tagging.
3. Init. Run `node tools/gs-lock/gs-lock.mjs init` once and show docs/spec.lock; then `check` must exit 0. Commit the lock and the .gitattributes the tool wrote. From now on only a person's `ratify` moves an artifact hash.
4. Wire, with the project's own hook mechanism (hooks stored in the repository, committed as executable, installed by the setup step that already exists):
   - pre-commit: `node tools/gs-lock/gs-lock.mjs check` and then `node tools/gs-lock/gs-lock.mjs commit-check`
   - commit-msg: `node tools/gs-lock/gs-cochange.mjs --msg-file "$1"`
   - pre-push: `node tools/gs-lock/gs-cochange.mjs --pre-push`
   - the one command and CI: `node tools/gs-lock/gs-lock.mjs check`, and in CI also `node tools/gs-lock/gs-cochange.mjs --range origin/[default branch]..HEAD` with the full history fetched.
   If the project's tests do not run with `npm test` or pytest, put the command in .gs.json as {"testCmd": "..."}.
5. Sentinel. Route from the sentinel every file you add in this session (a decision record, a note), and add three rows to the tool-sequence table (gate | command | runs at | red proof): spec-lock | `node tools/gs-lock/gs-lock.mjs check` | pre-commit, CI | `node tools/gs-lock/gs-redproof.mjs stale`; co-change | `node tools/gs-lock/gs-cochange.mjs --msg-file` | commit-msg, pre-push, CI | `node tools/gs-lock/gs-redproof.mjs uncited`; refactor-proof | `node tools/gs-lock/gs-cochange.mjs --msg-file` | commit-msg, CI | `node tools/gs-lock/gs-redproof.mjs breaking-refactor`.
6. Prove each one red, then green. Run each red proof and show that it exits non-zero and names the violation. Then, on a scratch branch with the hooks installed, do each for real and show it refused: write a sentence inside a tagged section of the spec and commit; change a source file and commit as `feat: tweak`; commit a change typed `refactor:` whose source breaks a test, with a test edited in the same commit. Undo each. Finally clone the repository to a temporary folder, run the setup step and the one command, show exit code 0, and repeat one refusal there.
7. Report in a table what each check catches, and list what these checks cannot see.
```

</div>
<div markdown="1">

**Español (neutro)**

```text
Agrega el lock de la spec y el gate de co-cambio a este proyecto con la herramienta de referencia que te doy. Trabaja en una rama llamada gs-lock-[AAAA-MM-DD]. Sigue los pasos en orden.

Herramienta de referencia, tres archivos que copias y nunca editas: [ruta o URL de gs-lock.mjs, gs-cochange.mjs y gs-redproof.mjs]
Rama principal de este repositorio: [main | master | otra]

Reglas para toda la sesión
- Nunca corras `ratify` ni escribas una línea en docs/ratifications.md. Una persona ratifica un cambio de la spec que sea intencional; lo hago yo.
- No escribas ni edites a mano los archivos de la herramienta ni docs/spec.lock. Si la herramienta no puede hacer lo que hace falta, detente y dímelo.
- No cambies lo que hace el código. Pega la salida real y el código de salida de cada comando; nunca describas una salida que no viste.
- Un cambio por commit, asunto Conventional Commit, y cita el id al que sirve cuando exista.
- Deja en inglés las palabras que lee una verificación automática: ratify, @gs, STALE, UNLOCKED, los nombres de comandos y los nombres de columna de las tablas.

Precondición: existen criterios con ids bajo docs/spec/, al menos un test o archivo fuente deriva de ellos, el comando único del proyecto corre en verde y Node 18 o posterior está instalado. Si no, detente y dime qué falta.

1. Instalar. Copia los tres archivos sin cambios a tools/gs-lock/. Corre `node tools/gs-lock/gs-lock.mjs check` y muestra que dice NOLOCK: la herramienta corre aquí.
2. Etiquetar. Da a cada artefacto derivado vivo (un test, o un archivo fuente que implementa un criterio) una línea de comentario: @gs [id-del-criterio] [ruta-de-la-spec]#[sección], donde [sección] es el ancla estilo GitHub del encabezado que contiene el criterio (minúsculas, espacios a guiones, sin signos de puntuación; por ejemplo docs/spec/F-001-x.md#f-001-registrar-una-colmena). La etiqueta no lleva hash, así un cambio en la spec nunca obliga a editar código. Agrega etiquetas a los tests existentes y a las fuentes que implementan un criterio. Muestra que los tests y la verificación de tipos dan los mismos resultados antes y después de etiquetar.
3. Init. Corre `node tools/gs-lock/gs-lock.mjs init` una sola vez y muestra docs/spec.lock; luego `check` debe terminar con código 0. Haz commit del lock y del .gitattributes que escribió la herramienta. Desde ahora solo el `ratify` de una persona mueve el hash de un artefacto.
4. Conectar, con el mecanismo de hooks del propio proyecto (hooks guardados en el repositorio, commiteados como ejecutables, instalados por el paso de preparación que ya existe):
   - pre-commit: `node tools/gs-lock/gs-lock.mjs check` y luego `node tools/gs-lock/gs-lock.mjs commit-check`
   - commit-msg: `node tools/gs-lock/gs-cochange.mjs --msg-file "$1"`
   - pre-push: `node tools/gs-lock/gs-cochange.mjs --pre-push`
   - el comando único y el CI: `node tools/gs-lock/gs-lock.mjs check`, y en el CI además `node tools/gs-lock/gs-cochange.mjs --range origin/[rama principal]..HEAD` con el historial completo descargado.
   Si los tests del proyecto no corren con `npm test` ni con pytest, pon el comando en .gs.json como {"testCmd": "..."}.
5. Centinela. Rutea desde el centinela cada archivo que agregues en esta sesión (un registro de decisión, una nota), y agrega tres filas a la tabla de secuencia de herramientas (gate | command | runs at | red proof): spec-lock | `node tools/gs-lock/gs-lock.mjs check` | pre-commit, CI | `node tools/gs-lock/gs-redproof.mjs stale`; co-change | `node tools/gs-lock/gs-cochange.mjs --msg-file` | commit-msg, pre-push, CI | `node tools/gs-lock/gs-redproof.mjs uncited`; refactor-proof | `node tools/gs-lock/gs-cochange.mjs --msg-file` | commit-msg, CI | `node tools/gs-lock/gs-redproof.mjs breaking-refactor`.
6. Demuestra cada uno en rojo y luego en verde. Corre cada prueba en rojo y muestra que termina con código distinto de cero y nombra la violación. Luego, en una rama de pruebas con los hooks instalados, haz cada una de verdad y muestra que se rechaza: escribe una frase dentro de una sección etiquetada de la spec y haz commit; cambia un archivo fuente y haz commit como `feat: tweak`; haz commit de un cambio de tipo `refactor:` cuya fuente rompe un test, con un test editado en el mismo commit. Deshaz cada una. Por último clona el repositorio en una carpeta temporal, corre el paso de preparación y el comando único, muestra el código de salida 0 y repite allí un rechazo.
7. Informa en una tabla qué detecta cada verificación y lista lo que estas verificaciones no pueden ver.
```

</div>
</div>

## What good output looks like

- `tools/gs-lock/` with the three files, byte for byte as given; `docs/spec.lock`, `.gitattributes` and tags in the comments of tests and sources.
- Three sentinel rows whose red proofs are one command each (`gs-redproof.mjs stale`, `uncited`, `breaking-refactor`), hooks stored as executable, and a CI step.
- Three refusals pasted from a real commit attempt and a green fresh clone.
- A before/after comparison of test and type-check results showing the tags changed nothing.
- No `docs/ratifications.md` yet, unless you ran `ratify` yourself.

## Check that it worked

Run these yourself, ideally in a clean clone; the assistant's table is a claim.

1. **The tool is the reference.** `git diff --no-index [your copy]/gs-lock.mjs tools/gs-lock/gs-lock.mjs` prints nothing (same for the other two files).
2. **The lock is current.** `node tools/gs-lock/gs-lock.mjs check` exits 0 and prints `all current`. If it prints `UNCOVERED` lines, those are spec ids no artifact carries a tag for: reported, not failing (`--require-coverage` makes them fail).
3. **Stale is caught.** `node tools/gs-lock/gs-redproof.mjs stale` exits non-zero and prints `STALE`. Edit a sentence in a tagged criterion yourself: `check` fails naming the artifacts derived from it; revert: green.
4. **Uncited and behavior-changing changes are caught.** `node tools/gs-lock/gs-redproof.mjs uncited` and `... breaking-refactor` exit non-zero; `git commit -m "fix: tweak"` over a source change is rejected by the hook.
5. **Only a ratification moves a hash.** `node tools/gs-lock/gs-lock.mjs ratify --all` without `--reason` is refused; with a reason, `docs/ratifications.md` gains a line and `check` passes. (Run it only for a spec change you meant; the record is append only.)
6. **Machine check.** `node gs-check.mjs --repo . --strict --only E10,E11` ([formula 13](/formulas/verify-substrate/)) drifts a sentence inside a locked section, ratifies it, plants a behavior-changing refactor and reports for itself.

## Known limits

- Design status for the effect, implementation status for the tool. It detects that a spec and an artifact **diverged**; it does **not** detect that the spec is **wrong** (that is the [triage](/practice/refinement/), cases b and c).
- The tag carries no hash, so it can lie by omission: a file tagged with a rule it never implements stays current. The lock says which version it was derived against, not that it satisfies it. That is the work of the tests.
- A typo fix in a criterion is a change and needs a ratification: the tool cannot tell a typo from a change of intent. Use explicit, stable ids (the prompt does) so inserting a criterion does not shift the others.
- The refactor proof is only as strong as the tests: an edge no test pins passes as a refactor, and a refactor that moves a file the tests import fails it. A project without a test command gets an error, not a pass.
- `ratify` is a command an assistant could run. The record keeps who, when and why; the enforcement is a person's review of `docs/ratifications.md` and the lock on a protected shared branch, and CI on the server. A clone cannot show you those settings, and `git commit --no-verify` skips every local hook.
- The lock merges worse than a dependency lockfile: two branches editing neighbouring sections conflict in it; `resolve` keeps both sides. The record merges without conflict (`merge=union`, written by `init`).
- Tested on Windows and in a Linux container with Node 22; not on macOS. The tool needs `git` on the path.

## Next

[9. Audit](/formulas/audit/) to see where the substrate is thin; [13. Verify the substrate](/formulas/verify-substrate/) to check all twelve items with a program; [10. Self-experiment](/formulas/experiment/) to see what it did on your own project.
