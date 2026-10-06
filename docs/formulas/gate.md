---
layout: default
title: "7. Wire a gate, red then green"
parent: Formulas
nav_order: 7
permalink: /formulas/gate/
description: "Wire one gate that blocks a bad change, install it so a fresh clone has it, and prove it: red once on a planted violation, green in a clean clone. A gate you have never seen stop anything is not worth much."
---

# 7. Wire a gate and prove it red, then green

**Status: written to the canon, not yet tested in a registered run.** The course lab ran a gate broken on purpose and a fresh-clone check on a sample project (one assistant, one observation, not a rate). This wording was not run. The gate library is at [quality gates](/quality-gates/).

## When to use

After [1](/formulas/greenfield/) or [2](/formulas/adopt/), to start enforcement, and again every time a mistake slips through (a new gate, or a new case for an old one). One gate per run. **Not for:** choosing every gate at once; start with the one that closes the costliest mistake.

Open a **fresh session** in the project folder.

## The prompt

<div class="prompt-pair" markdown="1">
<div markdown="1">

**English**

```text
Wire ONE gate in this project and prove it works.

The gate: [what it must stop, for example "a commit that adds an OPEN: line to the spec", "coverage below the baseline", "an import cycle", "a commit message that is not Conventional Commits". If unsure: the mistake that cost me most in my last three fixes was: [describe]]

1. Pick the standard tool of this stack for it (see the sentinel; the gate library at quality-gates/ in https://github.com/jghiringhelli/generative-specification has examples). One command, exit code non-zero on violation.
2. Wire it where I and the assistant will meet it: a hook stored in the repository (for example .githooks/) installed by a setup step that runs on a fresh clone, and the CI workflow, on the repository's real default branch. The hook and the CI run the same command.
3. Add a row to the sentinel's tool sequence table: gate | command | runs at | red proof. The red proof is one shell command that, run in a throwaway copy of the repository, plants a violation and runs the gate, and exits non-zero.
4. Red once: on a scratch branch or a temporary copy, plant a violation that should be stopped. Show the gate fail with its output. Remove the violation.
5. Green in a clean clone: clone the repository to a temporary folder, run the setup step, make a commit that should be stopped and show it blocked, then run the one command on the clean tree and show exit code 0.
6. Protect it: the gate configuration, its baseline and the hook are not yours to weaken. List them in CODEOWNERS or tell me where to protect them. If the gate is new and may have false positives, make it advisory (it reports, it does not block) and say what must hold before it blocks.
7. Attack it once: try one way around it that a hurried person might use. If anything passes through, fix the gate and add the attack as a permanent test case; do not ignore it.

Show every command and its output. Do not claim a result you did not run. Never mark anything as ratified on my behalf.
```

</div>
<div markdown="1">

**Español (neutro)**

```text
Cablea UN gate en este proyecto y demuestra que funciona.

El gate: [qué debe detener, por ejemplo "un commit que agrega una línea OPEN: a la spec", "cobertura bajo el baseline", "un ciclo de imports", "un mensaje de commit que no sigue Conventional Commits". Si no estás seguro: el error que más me costó en mis últimos tres arreglos fue: [descríbelo]]

1. Elige la herramienta estándar de este stack para ello (mira el centinela; la biblioteca de gates en quality-gates/ de https://github.com/jghiringhelli/generative-specification trae ejemplos). Un solo comando, código de salida distinto de cero ante una violación.
2. Cablealo donde yo y el asistente nos topemos con él: un hook guardado en el repositorio (por ejemplo .githooks/) e instalado con un paso de preparación que corra en un clon nuevo, y el workflow de CI, sobre la rama principal real del repositorio. El hook y el CI corren el mismo comando.
3. Agrega una fila a la tabla de secuencia de herramientas del centinela: gate | command | runs at | red proof (deja en inglés los nombres de columna). La prueba en rojo es un comando de shell que, corrido en una copia desechable del repositorio, planta una violación, corre el gate y termina con código distinto de cero.
4. Rojo una vez: en una rama de pruebas o una copia temporal, planta una violación que debería detenerse. Muestra el gate fallando con su salida. Quita la violación.
5. Verde en un clon limpio: clona el repositorio en una carpeta temporal, corre el paso de preparación, haz un commit que debería detenerse y muestra que lo bloquea, luego corre el comando único sobre el árbol limpio y muestra el código de salida 0.
6. Protégelo: la configuración del gate, su baseline y el hook no son tuyos para debilitar. Inclúyelos en CODEOWNERS o dime dónde protegerlos. Si el gate es nuevo y puede dar falsos positivos, déjalo como aviso (informa, no bloquea) y di qué debe cumplirse antes de que bloquee.
7. Atácalo una vez: prueba una forma de esquivarlo que una persona apurada podría usar. Si algo pasa, arregla el gate y agrega el ataque como caso de prueba permanente; no lo ignores.

Muestra cada comando y su salida. No afirmes un resultado que no corriste. Nunca marques nada como ratificado en mi nombre.
```

</div>
</div>

## What good output looks like

- One gate: a single command, a hook in the repository, a CI step, and a row in the sentinel's table with its red proof.
- The red run shown with real output, then the green run in a clean clone, with the exit code printed.
- A note on who may change the gate's configuration and baseline, and whether it starts advisory.
- If the attack found a hole: the fix and a permanent test case, so the count of gate cases goes up.

## Check that it worked

Run these yourself, not through the assistant.

1. **Red.** Apply the red proof from the table (or plant your own violation) on a scratch branch: the command exits non-zero and says why. If you cannot make it fail, the gate is decoration.
2. **Green in a clean clone.** `git clone . "$(mktemp -d)"`, `cd` into it, run the setup step from the README, then make a commit that should be blocked: it is blocked. Run the one command on the clean tree: exit 0.
3. **Same command everywhere.** The hook, CI and the table name the same command; the CI file's branch filter includes the real default branch (`git symbolic-ref --short refs/remotes/origin/HEAD`).
4. **The agent cannot weaken it.** The gate files and the baseline appear in CODEOWNERS (or in the place you were told); you know whether the server enforces that.
5. **The case count only goes up.** If the attack step added a case, the number of gate test cases is higher than before and no earlier case was deleted (`git diff --stat` on the gate tests shows only additions).

## Known limits

- Not run as written; the closest lab relatives ran once each on a sample project.
- A local hook is not a wall: `git commit --no-verify` skips it. The enforcement that counts is a check on the shared branch, and a clone cannot show you the server's settings. Say in the sentinel which gates are local and which are server-side.
- Library gates are JavaScript and TypeScript defaults; other stacks need their own tool. A new gate that is noisy trains people to ignore it: start advisory, block when false positives are near zero.
- "Proven red once" is a point-in-time proof. If a gate silently stops running (a renamed branch, a changed settings schema) nothing tells you. Re-run the red proof when you change the hook, the CI file or the default branch.

## Next

[8. Lock and co-change gate](/formulas/lock/) when there is code with ids; or another gate, one at a time.
