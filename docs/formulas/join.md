---
layout: default
title: "3. Join a codebase (read-only)"
parent: Formulas
nav_order: 3
permalink: /formulas/join/
description: "You inherited a codebase or came back after leave. A read-only briefing in about an hour: what it is, how it works, where to start, every claim cited to a file and line."
---

# 3. Join a codebase (read-only)

**Status: written to the canon, not yet tested in a registered run.** The wording is carried over from the [join a codebase practice page](/practice/join-a-codebase/) with a stricter evidence rule. No recorded run of it exists.

## When to use

You inherited a codebase, joined a team, or returned after leave, and you need to know **what it is, how it works and where to start** before anyone asks you to change it. Nothing is added to the project: no substrate, no hooks, no spec. **Not for:** adding the substrate ([2. Adopt after an MVP](/formulas/adopt/)).

Open a **fresh session** in the project root. The assistant needs to read files and run `git`.

## The prompt

<div class="prompt-pair" markdown="1">
<div markdown="1">

**English**

```text
Onboard me to this project. Read only; change no tracked file. First create and switch to a branch named onboarding-[YYYY-MM-DD] (do not touch the main branch), because you will write one file. Then write the briefing to reports/onboarding.md.

My role: [frontend | backend | full-stack | data | devops]
My level: [junior | mid | senior | staff]
Module I start on, if any: [name or "none"]

The briefing has six parts:
1. WHAT: three sentences naming the project, its users and the outcome it produces.
2. ARCHITECTURE: one diagram (ASCII or mermaid) of the main components and the data flow. Cite file:line for each component.
3. CONVENTIONS: naming, file layout, error handling, logging, test style, commit style. Cite one representative file:line for each.
4. WHAT SURPRISES NEWCOMERS: 3 to 5 things that look idiomatic but are not, or look odd but are load-bearing. Cite file:line.
5. FIRST TASKS: 2 or 3 tasks sized to my role and level; for each, the files, what to read first, and a rough effort.
6. HOW TO RUN IT: the commands to install, run and test it, and whether the tests pass right now (run them and say what happened).

Rules: every factual claim cites file:line or a command and its output. If you cannot tell, write "UNKNOWN" and say what you looked at. Do not suggest improvements and do not invent intent. Anyone who can read the code should be able to reproduce the briefing.
```

</div>
<div markdown="1">

**Español (neutro)**

```text
Hazme la inducción a este proyecto. Solo lectura; no cambies ningún archivo versionado. Primero crea y cámbiate a una rama llamada onboarding-[AAAA-MM-DD] (no toques la rama principal), porque escribirás un solo archivo. Luego escribe el informe en reports/onboarding.md.

Mi rol: [frontend | backend | full-stack | datos | devops]
Mi nivel: [junior | semi senior | senior | staff]
Módulo con el que empiezo, si hay: [nombre o "ninguno"]

El informe tiene seis partes:
1. QUÉ ES: tres frases que nombren el proyecto, sus usuarios y el resultado que produce.
2. ARQUITECTURA: un diagrama (ASCII o mermaid) de los componentes principales y el flujo de datos. Cita archivo:línea de cada componente.
3. CONVENCIONES: nombres, estructura de archivos, manejo de errores, registros (logs), estilo de pruebas, estilo de commits. Cita un archivo:línea representativo de cada una.
4. LO QUE SORPRENDE A QUIEN LLEGA: de 3 a 5 cosas que parecen idiomáticas y no lo son, o que parecen raras y sostienen algo. Cita archivo:línea.
5. PRIMERAS TAREAS: 2 o 3 tareas del tamaño de mi rol y nivel; de cada una, los archivos, qué leer primero y un esfuerzo aproximado.
6. CÓMO EJECUTARLO: los comandos para instalar, ejecutar y probar, y si las pruebas pasan ahora mismo (córrelas y di qué ocurrió).

Reglas: toda afirmación de hecho cita archivo:línea o un comando y su salida. Si no puedes saberlo, escribe "UNKNOWN" y di qué revisaste. No sugieras mejoras ni inventes intenciones. Cualquiera que sepa leer el código debería poder reproducir el informe.
```

</div>
</div>

## What good output looks like

- One file, `reports/onboarding.md`, a few pages, readable in 20 to 30 minutes, on a branch named `onboarding-DATE`.
- A diagram whose boxes each point to a real file and line.
- A "what surprises newcomers" list specific enough that a colleague would nod or object.
- `UNKNOWN` where the code does not say, instead of a confident guess.

## Check that it worked

1. **Nothing else changed.** `git status --short` lists only `reports/onboarding.md`; `git diff main --stat` shows no other file.
2. **Citations hold.** Open five citations at random (`file:line`): each must say what the briefing claims. One miss is a finding to report back, not to ignore.
3. **The run commands work.** Execute the commands from part 6 yourself in a clean clone: they install, run and test as written.
4. **A second session agrees.** Run it again in another fresh session and compare parts 1 and 2; large disagreements mark the places the code does not explain itself.

## Known limits

- Not run in a registered run. The assistant reads the code; it does not know why decisions were made. Part 4 can be wrong where the reasons live only in people's heads.
- It is a briefing, not an audit: no letters, no remediation.
- The team-habit analysis (who to trust on what, from `git log`) is in the [practice page](/practice/join-a-codebase/); its metrics are heuristics and are not part of this formula.
- Inferential reader: two runs resemble each other, they are not identical.

## Next

If you will own the project: [2. Adopt after an MVP](/formulas/adopt/). If you just want a first look at its health: [9. Audit](/formulas/audit/).
