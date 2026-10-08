---
layout: default
title: "Draft: init and levels"
published: false
description: "Draft of a paste-in prompt in which the assistant runs the one-command installer, chooses the level with the human, and proves each level red then green on a throwaway branch. Design, installer tested, not tested in a registered run."
---

# Draft: start a project with the installer, choose the level with the human, prove each level

**Status: design, installer tested, not yet in a registered run.** Kept out of the site (`published: false`). The tool is `tools/gs-init/gs-init.mjs` (one file, Node, no dependencies; 19 tests on Windows and in a Linux container, no model). The practice is [Scale-adaptive depth](/practice/scale-adaptive-depth/); the levels match [Agent commit marking](/practice/agent-commit-marking/). The installer is a program, not a prompt: the prompt below only tells the assistant how to run it, how to choose the level **with you**, and how to show that what each level promises is really refused when it should be.

**What the prompt cannot do.** It cannot choose your level for you (that depends on what you can lose), cannot make the placeholder requirement true, cannot record your acceptance of a risky change, and cannot make the checks stronger than `git commit --no-verify` allows. Every one of these is a line the assistant must report as "needs a person".

## When to use

At the start of a project, or when you adopt the method in an existing repository. Open a **fresh session** in the project folder, on a branch you can throw away. Have `gs-init.mjs` and the tools beside it (`gs-check`, `gs-lock`, `gs-decide`) in a folder you can name.

<div class="prompt-pair" markdown="1">
<div markdown="1">

**English**

```text
Install the Generative Specification substrate in this project with the one-command installer, choose the level together with me, and prove each level red and then green. Work on a branch named gs-init-[YYYY-MM-DD]. Follow the steps in order.

The installer, a file you run and never edit: [path of gs-init.mjs]
The folder that holds gs-check, gs-lock and gs-decide: [path, or "next to the installer"]
Default branch of this repository: [main | master | other]

Rules for the whole session
- You never edit the installer or the tool files. If one cannot do what is needed, stop and tell me.
- You never run `gs-decide add`, never write or edit docs/decisions.log.md, never use `--no-verify`, never pass `--agent` to hide that you are an agent, and never invent a requirement, a criterion, a test result or a person's reason. When a person must accept something, print the exact command with a draft reason, say "needs a person", and stop until I say it is done.
- Paste the real output and exit code of every command. Never describe an output you did not see. One change per commit, Conventional Commit subject, each commit marked `Assisted-by: [AGENT]:[MODEL]`. Never add `Signed-off-by`.

1. Ask me, in plain words and before running anything: (a) what is the worst thing that happens if a wrong change ships here (a typo on a page, lost work, wrong money, exposed personal data, a regulator)? (b) how many people commit, and does an assistant commit under their names? (c) is this a throwaway or a product? From my answers recommend ONE level and say why in two sentences: L0 for a throwaway or an experiment, L1 for a product or a team, L2 for money, personal data, regulation, several teams, or an assistant committing under people's names. I decide. Do not recommend a higher level than my answers support.
2. Run `node [installer] --dry-run --level [chosen] --tools [folder]` and paste it. Tell me, in one sentence each, which files it will create, which of mine it will only add a marked block to, and which it will leave alone. Stop for my "go".
3. Run it for real without `--dry-run`. Paste everything it prints, including the proof it runs (`gs-check --strict` on a copy) and the three closing lines. Say whether every item it claims for this level read PASS, and list the items it says stay absent, in the installer's own words. If a claimed item did not pass, stop and report; do not patch the generated files to make it pass.
4. Run it a second time and show that it changes nothing (every line `same` or `keep`) and made no backup folder.
5. Replace the placeholder requirement in docs/spec/SPEC.md only with what I tell you, in my words. If I have not told you, leave it and say so. Do not invent criteria. Commit the installed files in one commit (L2: this is refused until I record the starting state; print the command from the installer's closing "Do next" line for me to run, and wait).
Prove each level up to the one I chose, on a throwaway branch, one case at a time, pasting each refusal and its exit code and never bypassing it; delete the branch afterwards.
L0 (RED then GREEN)
6. RED: on a copy of the commit before the install (`git stash` is not allowed; use `git worktree add` on the previous commit), run `node [gs-check] --repo . --strict --only E01,E02,E03`: the sentinel, spec and decision items must NOT all read PASS. GREEN: the same command on the installed commit reads PASS for all three. Say plainly that this proves the form is present, not that the spec is true.
L1 (adds)
7. RED, each refused: (a) a commit message `fixed stuff`; (b) a line `OPEN: probe` added to docs/open-questions.md; (c) a criterion line `- F-001.9 The thing MUST work.` with no `verified by:`; (d) docs/baseline.json with a floor of 99999 for tests. GREEN: a commit `chore: probe` is accepted, and so is each file restored.
8. Chaining: if I had a hook before, show that it still ran (its own output or marker) after the checks. If I had none, say "no earlier hook".
L2 (adds)
9. RED: a change to a protected file (for example the comment line of .githooks/pre-commit) with no entry in the decisions log is refused; a commit message that carries `Signed-off-by: [your agent identity]` is refused. GREEN: stop; print the `gs-decide add` command for the changed file with a draft reason; after I run it, commit again and paste the acceptance.
10. Tell me, as a list I must do myself: make the CI job a required status check in the repository settings; give a public key (`--pubkey`) if I want signed ratifications; replace the placeholder requirement.
11. Report: the steps done with their pasted output, and a section "Not proven by this", each line marked "not checked": that the spec is true or complete; that a person, not an assistant, ran `gs-decide add`; that `git commit --no-verify` is blocked (only a required CI check does that); that the CI file exists in the hosting service and is required; that the chosen level fits my project (my decision, from my answers in step 1); that the lock and the co-change gate are installed (they are day 7 to 30).
```

</div>
<div markdown="1">

**Español (neutro)**

```text
Instala el sustrato de Generative Specification en este proyecto con el instalador de un solo comando, elige el nivel conmigo y prueba cada nivel primero en rojo y luego en verde. Trabaja en una rama llamada gs-init-[AAAA-MM-DD]. Sigue los pasos en orden.

El instalador, un archivo que ejecutas y nunca editas: [ruta de gs-init.mjs]
La carpeta que contiene gs-check, gs-lock y gs-decide: [ruta, o "junto al instalador"]
Rama por defecto de este repositorio: [main | master | otra]

Reglas para toda la sesión
- Nunca editas el instalador ni los archivos de las herramientas. Si alguno no puede hacer lo que se necesita, detente y avísame.
- Nunca corres `gs-decide add`, nunca escribes ni editas docs/decisions.log.md, nunca usas `--no-verify`, nunca pasas `--agent` para ocultar que eres un agente, y nunca inventas un requisito, un criterio, un resultado de prueba ni la razón de una persona. Cuando una persona deba aceptar algo, imprime el comando exacto con una razón como borrador, di "requiere una persona" y detente hasta que yo diga que está hecho.
- Pega la salida real y el código de salida de cada comando. Nunca describas una salida que no viste. Un cambio por commit, asunto en Conventional Commits, cada commit marcado con `Assisted-by: [AGENTE]:[MODELO]`. Nunca agregues `Signed-off-by`.

1. Antes de correr nada, pregúntame con palabras sencillas: (a) ¿qué es lo peor que pasa si aquí sale un cambio equivocado (una errata en una página, trabajo perdido, dinero mal calculado, datos personales expuestos, un regulador)? (b) ¿cuántas personas hacen commits y un asistente hace commits con sus nombres? (c) ¿esto es desechable o es un producto? Con mis respuestas recomienda UN nivel y di por qué en dos frases: L0 para algo desechable o un experimento, L1 para un producto o un equipo, L2 para dinero, datos personales, regulación, varios equipos o un asistente que hace commits con nombres de personas. Yo decido. No recomiendes un nivel más alto del que mis respuestas sostienen.
2. Corre `node [instalador] --dry-run --level [elegido] --tools [carpeta]` y pégalo. Dime en una frase cada uno qué archivos va a crear, a cuáles de los míos solo les agrega un bloque marcado y cuáles deja quietos. Detente hasta mi "adelante".
3. Córrelo de verdad, sin `--dry-run`. Pega todo lo que imprime, incluida la prueba que corre (`gs-check --strict` sobre una copia) y las tres líneas finales. Di si todos los ítems que reclama para este nivel dieron PASS y lista los que dice que quedan ausentes, con las palabras del propio instalador. Si un ítem reclamado no pasó, detente e infórmalo; no parches los archivos generados para que pase.
4. Córrelo una segunda vez y muestra que no cambia nada (todas las líneas `same` o `keep`) y que no creó carpeta de copias de seguridad.
5. Reemplaza el requisito de ejemplo de docs/spec/SPEC.md solo con lo que yo te diga, con mis palabras. Si no te lo he dicho, déjalo y avísame. No inventes criterios. Haz commit de los archivos instalados en un solo commit (L2: se rechaza hasta que yo registre el estado inicial; imprime el comando de la línea final "Do next" del instalador para que yo lo corra, y espera).
Prueba cada nivel hasta el que elegí, en una rama descartable, un caso a la vez, pegando cada rechazo y su código de salida y sin saltarlo; borra la rama al terminar.
L0 (ROJO y luego VERDE)
6. ROJO: sobre una copia del commit anterior a la instalación (no se permite `git stash`; usa `git worktree add` en el commit previo), corre `node [gs-check] --repo . --strict --only E01,E02,E03`: los ítems de centinela, especificación y decisiones NO deben dar PASS todos. VERDE: el mismo comando sobre el commit instalado da PASS en los tres. Di con claridad que esto prueba que la forma está presente, no que la especificación sea verdadera.
L1 (suma)
7. ROJO, cada uno rechazado: (a) un mensaje de commit `fixed stuff`; (b) una línea `OPEN: probe` agregada a docs/open-questions.md; (c) una línea de criterio `- F-001.9 The thing MUST work.` sin `verified by:`; (d) docs/baseline.json con un piso de 99999 para tests. VERDE: un commit `chore: probe` se acepta, y también cada archivo restaurado.
8. Encadenamiento: si yo tenía un hook antes, muestra que sigue corriendo (su propia salida o marca) después de las comprobaciones. Si no tenía, di "sin hook previo".
L2 (suma)
9. ROJO: un cambio a un archivo protegido (por ejemplo la línea de comentario de .githooks/pre-commit) sin entrada en el registro de decisiones se rechaza; un mensaje de commit con `Signed-off-by: [tu identidad de agente]` se rechaza. VERDE: detente; imprime el comando `gs-decide add` para el archivo cambiado con una razón como borrador; cuando yo lo corra, haz commit otra vez y pega la aceptación.
10. Dime, como una lista que debo hacer yo: volver el trabajo de CI una verificación de estado requerida en la configuración del repositorio; dar una clave pública (`--pubkey`) si quiero ratificaciones firmadas; reemplazar el requisito de ejemplo.
11. Informe: los pasos hechos con su salida pegada, y una sección "No probado por esto", cada línea marcada "no verificado": que la especificación sea verdadera o completa; que una persona, y no un asistente, corrió `gs-decide add`; que `git commit --no-verify` esté bloqueado (solo una verificación de CI requerida lo hace); que el archivo de CI exista en el servicio de alojamiento y sea requerido; que el nivel elegido le convenga a mi proyecto (decisión mía, según mis respuestas del paso 1); que el bloqueo de la especificación y la compuerta de cambio conjunto estén instalados (son del día 7 al 30).
```

</div>
</div>
