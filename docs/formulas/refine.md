---
layout: default
title: "4. Refine and ratify"
parent: Formulas
nav_order: 4
permalink: /formulas/refine/
description: "The stranger test on your spec, three numbers kept apart (coverage, open questions, places a reader would guess), and a ratification step that only you can complete."
---

# 4. Refine the spec and ratify

**Status: written to the canon, not yet tested in a registered run.** It consolidates the stranger test, the three completeness numbers and the ratification rule from the [spec completeness](/method/spec-completeness/) and [lifecycle](/method/lifecycle/) definitions. A close variant of the stranger test ran in the course lab (one observation, not a rate); this wording did not.

## When to use

After the first draft of a spec, when a check failed because the spec was silent, or whenever a spec feels thin. It answers three different questions, kept apart: how many criteria have a check, how many questions are still open, and where would a reader who has only the spec have to guess. **Not for:** deciding whether a failure needs a spec change at all ([5. Change](/formulas/change/) has the triage).

Open a **fresh session**, with no history, in the project folder. The first half is read-only.

## The prompt

<div class="prompt-pair" markdown="1">
<div markdown="1">

**English**

```text
Refine my spec. Change no file until I answer the question list in step 3.

Spec files: docs/spec/SPEC.md and the docs/spec/F-*.md it lists [or only: docs/spec/F-001-slug.md]

1. Stranger test. Read only the spec files: not the code, not the git history, not the other documents. Act as a builder who receives only these files and cannot ask anything. For each requirement and each criterion: what different things could someone build that still satisfy the text? List every place where you would guess and what would change if you guessed wrong. Number them G1, G2...
2. Three numbers. Report them separately and do not add them up:
   (a) criteria coverage: criterion ids cited by at least one test, over all criteria (N/M); only this number may look at the tests, after step 1 is written;
   (b) unresolved "OPEN:" lines in the spec files;
   (c) the number of guess places from step 1.
3. For each guess, propose the fix as a new or changed criterion with an id (or as an "OPEN:" line if only I can decide). Mark each one "PROPOSED - not ratified". Then STOP and wait. I will answer per id: ratify, change, or reject.
4. Only for the ids I ratify: edit the spec, and append one line per id to docs/spec/ratifications.md in the form "date | id | what | the reason I gave". Then derive a test for each one and show it fail before any implementation. Never write a ratification line for an id I did not name.
```

</div>
<div markdown="1">

**Español (neutro)**

```text
Refina mi spec. No cambies ningún archivo hasta que yo responda la lista de preguntas del paso 3.

Archivos de la spec: docs/spec/SPEC.md y los docs/spec/F-*.md que lista [o solo: docs/spec/F-001-slug.md]

1. Prueba del desconocido. Lee solo los archivos de la spec: no el código, no el historial de git, no los demás documentos. Actúa como un constructor que recibe únicamente estos archivos y no puede preguntar nada. Para cada requisito y cada criterio: ¿qué cosas distintas podría construir alguien y aun así cumplir lo escrito? Lista cada lugar donde adivinarías y qué cambiaría si adivinas mal. Numéralos G1, G2...
2. Tres números. Infórmalos por separado y no los sumes:
   (a) cobertura de criterios: ids de criterios citados por al menos un test, sobre todos los criterios (N/M); solo este número puede mirar los tests, después de escribir el paso 1;
   (b) líneas "OPEN:" sin resolver en los archivos de la spec;
   (c) la cantidad de lugares de adivinanza del paso 1.
3. Para cada adivinanza, propón el arreglo como un criterio nuevo o cambiado con id (o como una línea "OPEN:" si solo yo puedo decidir). Marca cada uno "PROPOSED - not ratified". Luego haz STOP y espera. Responderé por id: ratificar, cambiar o rechazar.
4. Solo para los ids que yo ratifique: edita la spec y agrega una línea por id en docs/spec/ratifications.md con la forma "fecha | id | qué | la razón que di". Luego deriva un test para cada uno y muestra que falla antes de cualquier implementación. Nunca escribas una línea de ratificación para un id que yo no haya nombrado.
```

</div>
</div>

## What good output looks like

- A numbered list of guess places, each tied to a requirement or criterion, each with what would change if guessed wrong.
- Three separate numbers, for example `coverage 7/12, open 3, guesses 9`. No combined grade.
- Proposals with ids, every one marked not ratified, and nothing edited yet.
- After you answer: only your ids edited, one line each in `docs/spec/ratifications.md`, and a failing test per new criterion.

## Check that it worked

1. **Three numbers, apart.** The report has all three, none summed. You can recompute (a) and (b) with the commands from the [substrate checklist](/formulas/substrate-checklist/) (`criteria coverage: N/M`, and `grep -rn "OPEN:" docs/spec`).
2. **No file changed before you answered.** `git status --short` was clean when the question list appeared.
3. **Only ratified ids moved.** `git diff` of the spec touches only ids you named; `docs/spec/ratifications.md` has exactly those ids and the reasons you gave, in your words.
4. **Each accepted guess came back as an id.** Search the spec for the new ids; each has a "verified by:" and a failing test.
5. **Run it twice.** A second fresh session gives a different count. Report the range (for example 9 and 12), not one number.

## Known limits

- The guess count comes from an inferential reader: two runs differ. It counts what is written and what a reader guesses, not what nobody has thought of.
- Coverage counts that a check exists, not that it is a good check.
- The ratification record is an audit trail, not proof: an assistant can type a line. Your review of the diff is the enforcement. A protected branch with required review is the stronger form, and a clone cannot show you whether it is set.
- A person in the product or business role should ratify criteria, not the person who generated them, when those are different people.
- Not run in a registered run; the closest lab variant ran once (one assistant, one observation).

## Next

[5. Change](/formulas/change/) to build against the ratified criteria.
