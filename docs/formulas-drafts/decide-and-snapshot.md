---
layout: default
title: "Draft: decide and snapshot"
published: false
description: "Draft of two paste-in prompts for the formulas page: install the decisions log with its hook and the snapshot generator, prove the hook red then green; and a companion DECIDE prompt in which the assistant proposes decisions and never ratifies. Not tested in a registered run."
---

# Draft: install gs-decide and gs-snapshot, and decide without the assistant ratifying

**Status: written to the canon, not yet tested in a registered run.** A draft for the formulas folder, kept out of the site (`published: false`) until the tools are merged beside `gs-check` and `gs-lock` and a run has been registered. The tools are `tools/gs-decide/` (the decisions log and its hook; 38 tests of its own) and `tools/gs-snapshot/` (the dated snapshot; 19 tests of its own). Both are Node, no dependencies, no model, MIT.

**gs-decide is a tool, not a prompt.** It is a log the program appends to and a hook that refuses a commit. The prompts below only install it, prove it, and tell the assistant to **propose** decisions and **stop**. The person who runs `gs-decide add` under their own git identity is the one who takes responsibility for the decision: the entry carries their name, role, reason, scope and expiry. The log proves that a named identity recorded a reason; it cannot prove that a human acted (an agent can run the command under a person's identity), which is why the prompts forbid it and why the real enforcement is a person reviewing the log on a protected branch and the `--range` check in CI.

## When to use

After [8. Lock](/formulas/lock/) (or any project with a working one-command check and hooks stored in the repository), when you want (a) a record of who accepted what, enforced at commit, and (b) a dated report of where the project stands. Open a **fresh session** in the project folder. `gs-check` and `gs-lock` should already be installed (`tools/gs-check/`, `tools/gs-lock/`); the snapshot uses them when present and says so when not.

## A. Install both tools and prove the hook red, then green

<div class="prompt-pair" markdown="1">
<div markdown="1">

**English**

```text
Install the decisions log with its hook, and the snapshot generator, in this project, using the reference tools I give you. Work on a branch named gs-decide-[YYYY-MM-DD]. Follow the steps in order.

Reference tools, files you copy and never edit: [path of tools/gs-decide/gs-decide.mjs and gs-decide-hook.mjs, tools/gs-snapshot/gs-snapshot.mjs and tools/LICENSE]
Default branch of this repository: [main | master | other]
My name for the log (I will sign under it): [name and e-mail from my git configuration]

Rules for the whole session
- You never run `gs-decide add`, never write or edit docs/decisions.log.md, never pass `--agent` to hide that you are an agent, never use `--no-verify`, and never invent a KPI or an audit result. A decision is recorded by me, under my identity, with my reason. When one is needed, print the exact command with the reason as a draft, say "needs a person", and stop until I say it is done.
- Do not write or edit the tool files. If a tool cannot do what is needed, stop and tell me. Paste the real output and exit code of every command; never describe an output you did not see.
- One change per commit, Conventional Commit subject.

Precondition: Node 18 or later; the project's one command runs green; hooks are stored in the repository and installed by a setup step that already exists. If not, stop and tell me what is missing.

1. Install. Copy gs-decide.mjs and gs-decide-hook.mjs to tools/gs-decide/, gs-snapshot.mjs to tools/gs-snapshot/ and LICENSE to tools/ (unchanged). Run `node tools/gs-decide/gs-decide.mjs protected` and paste it. Run `node tools/gs-decide/gs-decide.mjs verify` and show that it says there is no log yet.
2. Wire (the hook files are written now and activated after step 3, because they are themselves protected):
   - commit-msg: `node tools/gs-decide/gs-decide-hook.mjs --msg-file "$1"`
   - pre-push: `node tools/gs-decide/gs-decide-hook.mjs --pre-push`
   - the one command: `node tools/gs-decide/gs-decide.mjs verify`; CI on the shared branch, with the full history fetched: `node tools/gs-decide/gs-decide-hook.mjs --range origin/[default branch]..HEAD`
   Add three rows to the sentinel's tool-sequence table (gate | command | runs at | red proof): decisions-log | `node tools/gs-decide/gs-decide.mjs verify` | the one command, CI | an edited log entry; decisions-hook | `node tools/gs-decide/gs-decide-hook.mjs --msg-file` | commit-msg, pre-push, CI | a protected file changed with no entry; snapshot | `node tools/gs-snapshot/gs-snapshot.mjs` | by hand or on a schedule | two runs give the same bytes. Route from the sentinel every file you add.
3. Adopt the current state. List the protected files that exist now (`verify --require-ratified` shows them). Then STOP: print this command for me to run myself, and wait. Do not run it.
   node tools/gs-decide/gs-decide.mjs add --kind baseline --role "[my role]" --covers-protected --why "[my reason: adopting gs-decide, accepting the current protected files]"
   When I say it is done, run `node tools/gs-decide/gs-decide.mjs verify --require-ratified` and paste it: it must exit 0. Commit the tools, the hook files and docs/decisions.log.md together. Only now activate the hooks with the project's existing setup step.
4. Prove the hook RED. On a throwaway branch gs-decide-proof-[YYYY-MM-DD] change one line of a protected file (for example the comment line of the ratchet floor file or a hook), stage it and run `git commit`. Paste the refusal and the exit code: it must name the file and say there is no ratification entry. Do not bypass it.
5. Prove it GREEN. STOP and print the command for me, with the changed file as `--covers` and a draft reason. When I say it is done, stage docs/decisions.log.md and commit again; paste that it is accepted. Then show the tamper check: change one word inside an old entry of the log, run `node tools/gs-decide/gs-decide.mjs verify`, paste the CHAIN-BROKEN line and the exit code, and restore the file with `git checkout`. Then delete the throwaway branch.
6. Snapshot. Run `node tools/gs-snapshot/gs-snapshot.mjs --date [YYYY-MM-DD]` (it runs the checker in strict mode when it finds it, which takes minutes; add `--no-check` only if I say so, and the report will say the checker was skipped). Paste the printed line. Run it again with the same date and show that `git diff --stat docs/snapshots` is empty (same bytes). Do not pass `--kpi` or `--audit` unless I give you the file. Commit docs/snapshots on its own.
7. Report: the steps done with their pasted output, and a section "Not proven by this", with these lines, each marked "not checked": that a human, and not an agent, ran `add`; that the reasons in the log are true; that the spec is right; that the audit grade of any property (it comes from a separate, non-deterministic audit); that `git commit --no-verify` is blocked (only CI and a protected branch do that); that the CI job exists and runs on the shared branch.
```

</div>
<div markdown="1">

**Español (neutro)**

```text
Instala en este proyecto el registro de decisiones con su hook y el generador de snapshot, con las herramientas de referencia que te doy. Trabaja en una rama llamada gs-decide-[AAAA-MM-DD]. Sigue los pasos en orden.

Herramientas de referencia, archivos que copias y nunca editas: [ruta de tools/gs-decide/gs-decide.mjs y gs-decide-hook.mjs, tools/gs-snapshot/gs-snapshot.mjs y tools/LICENSE]
Rama por defecto de este repositorio: [main | master | otra]
Mi nombre para el registro (firmaré con él): [nombre y correo de mi configuración de git]

Reglas para toda la sesión
- Tú nunca corres `gs-decide add`, nunca escribes ni editas docs/decisions.log.md, nunca pasas `--agent` para ocultar que eres un agente, nunca usas `--no-verify`, y nunca inventas un KPI ni un resultado de auditoría. Una decisión la registro yo, con mi identidad y mi razón. Cuando haga falta una, imprime el comando exacto con la razón como borrador, di "requiere una persona" y detente hasta que yo diga que está hecho.
- No escribas ni edites los archivos de la herramienta. Si una herramienta no puede hacer lo que se necesita, detente y avísame. Pega la salida real y el código de salida de cada comando; nunca describas una salida que no viste.
- Un cambio por commit, asunto en Conventional Commits.

Precondición: Node 18 o superior; el comando único del proyecto corre en verde; los hooks están guardados en el repositorio y los instala un paso de preparación que ya existe. Si no, detente y dime qué falta.

1. Instala. Copia gs-decide.mjs y gs-decide-hook.mjs a tools/gs-decide/, gs-snapshot.mjs a tools/gs-snapshot/ y LICENSE a tools/ (sin cambios). Corre `node tools/gs-decide/gs-decide.mjs protected` y pégalo. Corre `node tools/gs-decide/gs-decide.mjs verify` y muestra que dice que todavía no hay registro.
2. Conecta (los archivos de hook se escriben ahora y se activan después del paso 3, porque ellos mismos están protegidos):
   - commit-msg: `node tools/gs-decide/gs-decide-hook.mjs --msg-file "$1"`
   - pre-push: `node tools/gs-decide/gs-decide-hook.mjs --pre-push`
   - el comando único: `node tools/gs-decide/gs-decide.mjs verify`; CI en la rama compartida, con el historial completo: `node tools/gs-decide/gs-decide-hook.mjs --range origin/[rama por defecto]..HEAD`
   Agrega tres filas a la tabla de secuencia de herramientas del centinela (compuerta | comando | cuándo corre | prueba en rojo): registro-de-decisiones | `node tools/gs-decide/gs-decide.mjs verify` | el comando único, CI | una entrada editada del registro; hook-de-decisiones | `node tools/gs-decide/gs-decide-hook.mjs --msg-file` | commit-msg, pre-push, CI | un archivo protegido cambiado sin entrada; snapshot | `node tools/gs-snapshot/gs-snapshot.mjs` | a mano o programado | dos corridas dan los mismos bytes. Enruta desde el centinela cada archivo que agregues.
3. Adopta el estado actual. Lista los archivos protegidos que existen hoy (`verify --require-ratified` los muestra). Luego DETENTE: imprime este comando para que lo corra yo mismo y espera. No lo corras.
   node tools/gs-decide/gs-decide.mjs add --kind baseline --role "[mi rol]" --covers-protected --why "[mi razón: adopto gs-decide, acepto los archivos protegidos actuales]"
   Cuando yo diga que está hecho, corre `node tools/gs-decide/gs-decide.mjs verify --require-ratified` y pégalo: debe salir con 0. Haz commit de las herramientas, los archivos de hook y docs/decisions.log.md juntos. Solo entonces activa los hooks con el paso de preparación que ya existe.
4. Prueba el hook en ROJO. En una rama descartable gs-decide-proof-[AAAA-MM-DD] cambia una línea de un archivo protegido (por ejemplo la línea de comentario del archivo del piso del ratchet, o un hook), agrégalo y corre `git commit`. Pega el rechazo y el código de salida: debe nombrar el archivo y decir que no hay entrada de ratificación. No lo esquives.
5. Pruébalo en VERDE. DETENTE e imprime el comando para mí, con el archivo cambiado en `--covers` y una razón como borrador. Cuando yo diga que está hecho, agrega docs/decisions.log.md y haz commit otra vez; pega que se aceptó. Luego muestra la prueba de adulteración: cambia una palabra dentro de una entrada vieja del registro, corre `node tools/gs-decide/gs-decide.mjs verify`, pega la línea CHAIN-BROKEN y el código de salida, y restaura el archivo con `git checkout`. Luego borra la rama descartable.
6. Snapshot. Corre `node tools/gs-snapshot/gs-snapshot.mjs --date [AAAA-MM-DD]` (corre el verificador en modo estricto si lo encuentra, y tarda minutos; agrega `--no-check` solo si yo lo digo, y el informe dirá que el verificador se omitió). Pega la línea que imprime. Córrelo otra vez con la misma fecha y muestra que `git diff --stat docs/snapshots` está vacío (mismos bytes). No pases `--kpi` ni `--audit` salvo que yo te dé el archivo. Haz commit de docs/snapshots por separado.
7. Informe: los pasos hechos con su salida pegada, y una sección "No probado por esto", con estas líneas, cada una marcada "no verificado": que una persona, y no un agente, corrió `add`; que las razones del registro son verdaderas; que la spec es correcta; la nota de auditoría de cualquier propiedad (viene de una auditoría aparte, no determinista); que `git commit --no-verify` está bloqueado (solo lo hacen el CI y una rama protegida); que el trabajo de CI existe y corre en la rama compartida.
```

</div>
</div>

## B. The companion DECIDE prompt: the assistant proposes, a person ratifies

Use it at the end of a working session, before you commit, or on a schedule. It does not install anything and it changes no file.

<div class="prompt-pair" markdown="1">
<div markdown="1">

**English**

```text
List what in this repository needs a human decision, and propose each one. You PROPOSE and you never ratify. Reference: tools/gs-decide/ and tools/gs-snapshot/ are installed.

Base to compare with: [commit, branch or snapshot date; default: the last snapshot or the default branch]

Rules
- You never run `gs-decide add`, never edit docs/decisions.log.md or docs/decision-roles.json, never write "Ratified-by" or "Waiver:" in a commit message, never pass `--agent` to look like a person, never use `--no-verify`. The named person who runs `add` takes responsibility for the decision; you only prepare it.
- Everything you list comes from a command's output, pasted. Do not decide for me what is acceptable.

1. Run `git diff --name-only [base]..HEAD` and `node tools/gs-decide/gs-decide.mjs protected`, and list the changed files that are protected (spec cascade root, gate/hook/CI/linter configuration, ratchet floor file, waiver list), each with the output of `node tools/gs-decide/gs-decide.mjs verify --require-ratified` for it.
2. Run `node tools/gs-decide/gs-decide.mjs list --open` and `verify`, and list every open waiver and accepted risk with its expiry, and every one that has expired or expires within 14 days.
3. Run the project's one command. For each failing or skipped check, list it as a possible waiver, and for each risk you noticed while working (something you did not verify, a path with no test, a dependency you added) list it as a possible accepted risk. Mark each "noticed by the assistant, not verified".
4. For each item write a block: what it is (a file, a gate, a floor, a check, a risk); the reference; the files that would be covered; a DRAFT reason in one or two sentences, marked "draft, the person writes the real one"; the scope; a proposed expiry for a waiver or a risk (never longer than 90 days); the role that should ratify it if docs/decision-roles.json exists; and the exact command line, not run:
   node tools/gs-decide/gs-decide.mjs add --kind [kind] --role "[role]" --covers [path] [--expires YYYY-MM-DD] --why "[draft]"
5. Stop. Write "needs a person" and nothing else. When I say I have recorded them, run `verify --require-ratified` and `node tools/gs-decide/gs-decide-hook.mjs --range [base]..HEAD`, and paste both outputs and exit codes. If either fails, list what it quotes and stop.
```

</div>
<div markdown="1">

**Español (neutro)**

```text
Lista qué en este repositorio necesita una decisión humana y propón cada una. Tú PROPONES y nunca ratificas. Referencia: tools/gs-decide/ y tools/gs-snapshot/ están instalados.

Base para comparar: [commit, rama o fecha de snapshot; por defecto: el último snapshot o la rama por defecto]

Reglas
- Nunca corres `gs-decide add`, nunca editas docs/decisions.log.md ni docs/decision-roles.json, nunca escribes "Ratified-by" ni "Waiver:" en un mensaje de commit, nunca pasas `--agent` para parecer una persona, nunca usas `--no-verify`. La persona con nombre que corre `add` asume la responsabilidad de la decisión; tú solo la preparas.
- Todo lo que listes sale de la salida de un comando, pegada. No decidas por mí qué es aceptable.

1. Corre `git diff --name-only [base]..HEAD` y `node tools/gs-decide/gs-decide.mjs protected`, y lista los archivos cambiados que están protegidos (raíz de la cascada de spec, configuración de compuertas/hooks/CI/linter, archivo del piso del ratchet, lista de excepciones), cada uno con la salida de `node tools/gs-decide/gs-decide.mjs verify --require-ratified` para él.
2. Corre `node tools/gs-decide/gs-decide.mjs list --open` y `verify`, y lista cada excepción (waiver) y cada riesgo aceptado abiertos con su vencimiento, y cada uno que venció o vence dentro de 14 días.
3. Corre el comando único del proyecto. Cada chequeo que falle o se omita, lístalo como posible excepción; cada riesgo que notaste al trabajar (algo que no verificaste, una ruta sin test, una dependencia que agregaste), lístalo como posible riesgo aceptado. Marca cada uno "notado por el asistente, no verificado".
4. Para cada ítem escribe un bloque: qué es (un archivo, una compuerta, un piso, un chequeo, un riesgo); la referencia; los archivos que cubriría; una razón BORRADOR de una o dos oraciones, marcada "borrador, la persona escribe la real"; el alcance; un vencimiento propuesto para una excepción o un riesgo (nunca más de 90 días); el rol que debería ratificarlo si existe docs/decision-roles.json; y la línea de comando exacta, sin correrla:
   node tools/gs-decide/gs-decide.mjs add --kind [tipo] --role "[rol]" --covers [ruta] [--expires AAAA-MM-DD] --why "[borrador]"
5. Detente. Escribe "requiere una persona" y nada más. Cuando yo diga que las registré, corre `verify --require-ratified` y `node tools/gs-decide/gs-decide-hook.mjs --range [base]..HEAD`, y pega ambas salidas y códigos de salida. Si alguno falla, lista lo que cita y detente.
```

</div>
</div>

## What good output looks like

- Prompt A: the protected list, the baseline command printed and **not run** by the assistant, a `verify --require-ratified` that exits 0 afterwards, a refused commit naming the file, an accepted commit after a person's entry, a CHAIN-BROKEN line after the tamper, a snapshot line, and an empty diff on the second run. Every command with its pasted output.
- Prompt B: blocks of proposals, each with a command that was not run, and the words "needs a person" at the end. No entry written, no file changed.

## Check that it worked

1. **`git log -p docs/decisions.log.md`** shows entries only added by the person's commits, each `who:` the person's identity and `via: human`. An entry with `via: agent-suspected` or one in a commit with an AI co-author trailer and no human entry means the rule was broken.
2. **Run the red proof yourself** on a copy: change a hook line and commit; it must be refused. Then run `gs-decide-hook.mjs --range` on the history: a commit made with `--no-verify` shows up.
3. **Two snapshot runs with the same date are identical.** A diff means the project changed between them or a number was not deterministic (report it).
4. **Read the "What this is NOT" paragraph** at the top of a snapshot. If the line says "governed" or shows a level or a score you did not supply, the tool was altered.

## Known limits

- **It proves a named identity recorded a reason, not that a human acted.** Anyone with shell access can run `add` under a person's identity. The person reviewing the log on a protected branch (CODEOWNERS on the log and on the protected paths) and the `--range` check in CI are the enforcement; a clone cannot show server settings.
- **`--no-verify` skips every local hook.** Only the CI range check catches it afterwards.
- **A ratification is a record of responsibility, not of understanding.** A person can sign without reading.
- **The protected list is a list.** A gate hidden in `package.json` scripts, a renamed tool or a file under another name is invisible until added to `.gs.json` (`decide.protect`).
- **The snapshot is not an audit.** It computes counts and states; the grade per property and "governed" come from a separate audit it does not run, and it cannot detect a wrong spec. KPIs and audit results appear only if a person supplies them with their source.
- **Where it meets Chronicle:** `gs-decide export --format chronicle-jsonl` is a draft mapping onto the ledger's existing event kinds; field gaps and open questions are in the tool's README.
- **Written to the canon, not tested in a registered run**; the tools' own suites show they detect what they are defined to detect, not that they reduce defects or that a team adopts them.
