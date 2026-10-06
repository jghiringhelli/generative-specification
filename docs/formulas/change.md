---
layout: default
title: "5. Change: feature, fix, refactor"
parent: Formulas
nav_order: 5
permalink: /formulas/change/
description: "The prompt for every change after the substrate exists: a feature through the spec, a fix through the triage (not every failure touches the spec), a refactor that keeps the old tests green. Red first, atomic commits, a ratchet line at the end."
---

# 5. Change: feature, fix, refactor

**Status: written to the canon, not yet tested in a registered run.** The triage block is the canonical text of the [refinement page](/practice/refinement/), whose rule ran once with a real assistant in the course lab (it stated a case for two of five findings; one observation, not a rate). This combined prompt did not run.

## When to use

Any change after [1. Greenfield](/formulas/greenfield/) or [2. Adopt](/formulas/adopt/): a new feature, a bug, a cleanup. One prompt, one `Type`. **The point is the triage for fixes:** a defect is not always a spec problem, and a spec edit after every bug is noise. A failure the spec already forbade needs a test, not a spec change; a failure the spec was silent about needs a ratified criterion first.

Open a **fresh session** in the project folder (the sentinel loads automatically in most assistants; the prompt reads it anyway).

## The prompt

<div class="prompt-pair" markdown="1">
<div markdown="1">

**English**

```text
Read the sentinel (the instruction file) first and follow its routing; load only what this change needs.

Change request. Type: [feature | fix | refactor]
[Describe it in two or three sentences. For a fix: what happens, and what should happen instead.]

Say this BEFORE touching any file:
- feature: which requirement it belongs to. Write the new criteria in the spec (ids, MUST/SHOULD/MAY, "verified by:"). STOP and wait for my ratification.
- fix: the triage case and why, in two lines.
    a  spec right, code deviates: regression test citing the criterion id, seen failing on the current code, then fix. No spec change.
    b  spec silent or ambiguous: state the gap as a criterion with an id (or a numbered entry in docs/fixes.md); a person ratifies; derive the test; red first; implement.
    c  spec contradicts the intent: change event; ask; change the spec; write the decision record; rerun every check.
    d  tool or sensor missing: add it and list it in the tool sequence; a person ratifies.
    e  way around a gate found: add a NEW test case for the gate. Cases are only ever added.
  A real defect that no criterion covers is case b, not case a.
- refactor: no behavior change. List the criteria it must keep. If it changes structure, write the decision record first (docs/decisions/). The tests that existed before the change must pass unchanged against the new source.

Then, for every type:
- Red first: show the new test failing against the current code before you change the code. A test that cannot load is not a failing test.
- One small commit per step; each message is typed (feat, fix, refactor, test, docs) and names the criterion id or decision record it serves.
- Update the documents this change touches, or say which and why none.
- Never mark anything as ratified on my behalf. If you need a decision from me, ask and continue with the rest.
- Run the project's one command and show its output.

End with ONE line: what permanent thing this change adds so the same miss cannot happen again (a test, a rule in the sentinel, a gate case, a decision record). If nothing, say so and why.
```

</div>
<div markdown="1">

**Español (neutro)**

```text
Lee primero el centinela (el archivo de instrucciones) y sigue su ruteo; carga solo lo que este cambio necesita.

Pedido de cambio. Tipo: [feature | fix | refactor]
[Descríbelo en dos o tres frases. Para un fix: qué ocurre y qué debería ocurrir en su lugar.]

Di esto ANTES de tocar cualquier archivo:
- feature: a qué requisito pertenece. Escribe los criterios nuevos en la spec (ids, MUST/SHOULD/MAY, "verified by:"). STOP y espera mi ratificación.
- fix: el caso de la clasificación y por qué, en dos líneas.
    a  la spec es correcta y el código se desvía: test de regresión que cita el id del criterio, visto fallar contra el código actual, y luego el arreglo. La spec no cambia.
    b  la spec calla o es ambigua: escribe el hueco como criterio con id (o como entrada numerada en docs/fixes.md); una persona ratifica; deriva el test; rojo primero; implementa.
    c  la spec contradice la intención: evento de cambio; pregunta; cambia la spec; escribe el registro de la decisión; corre de nuevo todas las verificaciones.
    d  falta una herramienta o un sensor: agrégalo y anótalo en la secuencia de herramientas; una persona ratifica.
    e  se encontró una forma de burlar un gate: agrega un caso de prueba NUEVO para el gate. Los casos solo se agregan.
  Un defecto real que ningún criterio cubre es caso b, no caso a.
- refactor: sin cambio de comportamiento. Lista los criterios que debe conservar. Si cambia la estructura, escribe primero el registro de la decisión (docs/decisions/). Los tests que existían antes del cambio deben pasar sin modificarse contra el código nuevo.

Luego, para todos los tipos:
- Rojo primero: muestra el test nuevo fallando contra el código actual antes de cambiar el código. Un test que no puede cargarse no es un test que falla.
- Un commit pequeño por paso; cada mensaje lleva tipo (feat, fix, refactor, test, docs) y nombra el id del criterio o el registro de decisión al que sirve.
- Actualiza los documentos que este cambio toca, o di cuáles y por qué ninguno.
- Nunca marques nada como ratificado en mi nombre. Si necesitas una decisión mía, pregúntala y sigue con el resto.
- Corre el comando único del proyecto y muestra su salida.

Termina con UNA línea: qué cosa permanente agrega este cambio para que la misma falla no vuelva a ocurrir (un test, una regla en el centinela, un caso de gate, un registro de decisión). Si ninguna, dilo y explica por qué.
```

</div>
</div>

## What good output looks like

- For a **feature**: new criteria with ids in the spec first, a stop for your ratification, then tests that cite those ids, failing, then code, then green.
- For a **fix**: a stated case before any edit. In case a, a regression test that cites the broken criterion and fails on the unfixed code, and no spec diff. In case b, a proposed criterion waiting for you.
- For a **refactor**: a diff with no test file edited except imports, and the old tests passing unchanged.
- Small typed commits, each naming an id, and a closing ratchet line you can accept or push back on.

## Check that it worked

1. **The case came first.** For a fix, the case sentence is in the transcript before the first file edit. If the assistant named no case, send the prompt again; it is the most commonly skipped step.
2. **Red is visible.** In the transcript the new test fails (by assertion, not by import error) before the code changes. Then check it yourself: `git stash` the source change, run the new test, expect failure; `git stash pop`, expect pass.
3. **No spec change in case a.** `git diff -- docs/spec` is empty for a fix that the spec already required.
4. **Refactor proof.** Check out the parent commit's tests against the new source: `git checkout HEAD~1 -- [test folder]`, run the one command, expect green, then restore. A refactor that needs a test edit changed behavior.
5. **Commits parse.** `git log --format=%s -n 5` shows typed subjects, each naming an id or record.
6. **Criteria coverage did not drop.** The `criteria coverage: N/M` line is at least as good as before.

## Known limits

- Not run as written. In the lab, one run of the triage rule showed the assistant naming a case for some findings and acting without naming it for others, and a count of type errors that rose while it worked. A guide is not a sensor; the fixes are your review and a gate (see [7. Wire a gate](/formulas/gate/)).
- The assistant can classify wrongly. The case is a statement you can check, not a guarantee.
- Ratification stays with a person. A hook can require a marker, and an assistant can type it.
- The refactor proof is only as strong as the tests: a behavior change at an edge no test pins passes as a refactor. The remedy is a criterion and a test at that edge (case b).
- Local hooks can be skipped with `--no-verify`; only a check on the shared branch stops that.

## Next

[6. Verify a use case](/formulas/verify/) when "tests pass" is not enough; [7. Wire a gate](/formulas/gate/) to make a rule mechanical.
