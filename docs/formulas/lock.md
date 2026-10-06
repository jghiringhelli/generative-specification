---
layout: default
title: "8. Lock and co-change gate"
parent: Formulas
nav_order: 8
permalink: /formulas/lock/
description: "Day 7 to 30, once there is code with ids: tag each derived artifact with the spec section it came from, keep the hashes in one lock file, and add a co-change gate. A design built once on one sample project."
---

# 8. Add the lock and the co-change gate (day 7 to 30)

**Status: written to the canon, not yet tested in a registered run.** The mechanism itself is **design status**: its five checks were implemented once, as deterministic scripts with no model, in one sample project, and verified on 35 crafted scenarios. That shows they detect what they are defined to detect; no effect on defects was measured. Definitions: [coherence between spec and code](/method/coherence/).

## When to use

A week or more in, when the project has **code with ids**: criteria in `docs/spec/`, tests and sources that derive from them, and the one command and CI already working ([1](/formulas/greenfield/) or [2](/formulas/adopt/), and one gate proven with [7](/formulas/gate/)). The lock answers "from which version of the intent did this artifact come?"; the co-change gate answers "did this commit say why it changed behavior?". **Not for:** day one. Without ids and a working gate there is nothing to lock.

Open a **fresh session** in the project folder.

## The prompt

<div class="prompt-pair" markdown="1">
<div markdown="1">

**English**

```text
Add the spec lock and the co-change gate to this project.

Precondition: criteria with ids exist under docs/spec/, at least one test or source file derives from them, and the project's one command already runs. If not, stop and tell me to come back when they do.

Write deterministic scripts, with no model and no network, in this project's stack, under scripts/coherence/. Do not change what the code does.

1. Tags. Each living derived artifact (a test, or a source file that implements a rule) carries a comment: @gs [criterion-id] [spec-path]#[section]. A tag has no hash, so a spec change never forces a code edit. Add tags to the existing tests and to the sources that implement a criterion. Show that the tests and the type check give the same results before and after tagging.
2. Lock. docs/spec.lock has one line per spec section (the hash of its text after removing markup, list markers, tick state and whitespace) and one line per tagged artifact (the hash of the section it was derived against). The check recomputes the section hashes and fails on four states: an artifact older than its section (stale), a lock behind the spec, a tag the lock does not know, a lock entry whose tag disappeared. Decision records are append-only and are not locked.
3. Ratify command. The only way to move an artifact's hash, and it requires a reason argument. It appends "date | who | id | reason" to docs/spec/ratifications.md. A person runs it, never you.
4. Orphan check. Every id cited in a tag or a test exists in the spec.
5. Co-change gate (commit-msg hook and CI). A commit that changes source must cite a criterion id in its message, or stage a spec change, or be typed refactor. A refactor must pass the parent commit's tests, unchanged, against the new source.

Wire 2, 4 and 5 into the project's one command, the hook and CI. Add each to the sentinel's tool sequence table (gate | command | runs at | red proof); a red proof is one shell command that plants a violation in a throwaway copy and runs the gate, and exits non-zero.
Prove each one red once, on a scratch branch: edit a criterion after its artifact was tagged; cite an id that does not exist; change source with no citation; commit a "refactor" that changes a behavior a test pins. Show each fail, undo it, then show everything green in a fresh clone.
Never mark anything as ratified on my behalf. List what these checks cannot see.
```

</div>
<div markdown="1">

**Español (neutro)**

```text
Agrega el lock de la spec y el gate de co-cambio a este proyecto.

Precondición: existen criterios con ids bajo docs/spec/, al menos un test o archivo fuente deriva de ellos y el comando único del proyecto ya corre. Si no, detente y dime que vuelva cuando existan.

Escribe scripts deterministas, sin modelo y sin red, en el stack de este proyecto, bajo scripts/coherence/. No cambies lo que hace el código.

1. Etiquetas. Cada artefacto derivado vivo (un test, o un archivo fuente que implementa una regla) lleva un comentario: @gs [id-del-criterio] [ruta-de-la-spec]#[sección]. Una etiqueta no lleva hash, así un cambio en la spec nunca obliga a editar código. Agrega etiquetas a los tests existentes y a las fuentes que implementan un criterio. Muestra que los tests y la verificación de tipos dan los mismos resultados antes y después de etiquetar.
2. Lock. docs/spec.lock tiene una línea por sección de la spec (el hash de su texto tras quitar el formato, los marcadores de lista, el estado de los checks y los espacios) y una línea por artefacto etiquetado (el hash de la sección contra la que se derivó). La verificación recalcula los hashes de las secciones y falla en cuatro estados: un artefacto más viejo que su sección (obsoleto), un lock atrasado respecto a la spec, una etiqueta que el lock no conoce, una entrada del lock cuya etiqueta desapareció. Los registros de decisiones son de solo agregar y no se bloquean.
3. Comando de ratificación. Es la única forma de mover el hash de un artefacto y exige un argumento con la razón. Agrega "fecha | quién | id | razón" a docs/spec/ratifications.md. Lo corre una persona, nunca tú.
4. Verificación de huérfanos. Todo id citado en una etiqueta o en un test existe en la spec.
5. Gate de co-cambio (hook commit-msg y CI). Un commit que cambia código fuente debe citar un id de criterio en su mensaje, o incluir un cambio de la spec, o tener tipo refactor. Un refactor debe pasar los tests del commit padre, sin modificar, contra el código nuevo.

Conecta 2, 4 y 5 al comando único del proyecto, al hook y al CI. Agrega cada uno a la tabla de secuencia de herramientas del centinela (gate | command | runs at | red proof; deja en inglés los nombres de columna); una prueba en rojo es un comando de shell que planta una violación en una copia desechable, corre el gate y termina con código distinto de cero.
Demuestra cada uno en rojo una vez, en una rama de pruebas: edita un criterio después de que su artefacto fue etiquetado; cita un id que no existe; cambia código fuente sin cita; haz commit de un "refactor" que cambia un comportamiento que un test fija. Muestra cada fallo, deshazlo y luego muestra todo en verde en un clon nuevo.
Nunca marques nada como ratificado en mi nombre. Lista lo que estas verificaciones no pueden ver.
```

</div>
</div>

## What good output looks like

- `scripts/coherence/` with a handful of small scripts, `docs/spec.lock`, tags in the comments of tests and sources, and `docs/spec/ratifications.md`.
- Four red demonstrations (stale, orphan, uncited change, behavior-changing "refactor") and a green fresh clone.
- A before/after comparison of test and type-check results showing the tags changed nothing.
- A closing list of what the checks cannot see.

## Check that it worked

1. **Stale is caught.** Edit a sentence in one criterion (a scratch branch): the check fails naming the artifacts derived from that section. Revert: green.
2. **Orphans are caught.** Cite `F-999.1` in a test: the orphan check fails.
3. **Uncited change is caught.** Edit a source file and commit with the message `fix: tweak` (no id, no spec change): the hook rejects it. With `refactor: tweak` and a change that breaks a test the parent had: rejected.
4. **Tags are inert.** Run the project's tests and type check on the commit before tagging and after: identical results.
5. **Only a ratification moves a hash.** Run the ratify command without a reason: refused. With one: a new line in `docs/spec/ratifications.md` and the artifact is current again.
6. **Fresh clone.** Repeat steps 1 and 3 in a clean clone.

## Known limits

- Design status; built once on a Node and TypeScript sample project. Other stacks need their own test runner and source reader. The scripts of that project are in the course sensors kit, not in this repository.
- A typo fix in a criterion is a change and needs a ratification: the tool cannot tell a typo from a change of intent. That is the price. Use explicit, stable ids (the prompt does) so inserting a criterion does not shift the others.
- The tag carries no hash, so it can lie by omission: a file tagged with a rule it never implements stays current. The lock says which version the file was derived against, not that it satisfies it. That is the work of the tests.
- The refactor proof is only as strong as the tests: an edge no test pins passes as a refactor.
- The lock merges worse than a dependency lockfile: two branches editing different sections still conflict in it.
- An assistant could run the ratify command. The real enforcement is a person's review on a protected shared branch; a clone cannot show you whether that is set.

## Next

[9. Audit](/formulas/audit/) to see where the substrate is thin; [10. Self-experiment](/formulas/experiment/) to see what it did on your own project.
