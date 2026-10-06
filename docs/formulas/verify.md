---
layout: default
title: "6. Verify a use case in layers"
parent: Formulas
nav_order: 6
permalink: /formulas/verify/
description: "Verify one complete use case against the running system in three layers (data before, real interface and logs, data after) and check that all three tell the same story. Then keep the check as a runnable script."
---

# 6. Verify a use case in layers

**Status: written to the canon, not yet tested in a registered run.** The course lab ran a three-layer verification on specific features of a sample project (one assistant, one observation, not a rate). This generic wording was not run.

## When to use

When "the tests pass" is not enough: before you trust a feature, after a change that touches data or an integration, or when a green suite hides a broken screen. One use case at a time. **Not for:** unit-level checks (those are your tests); load or security testing.

You need the system **running** with a data store you can query. Open a **fresh session** in the project folder.

## The prompt

<div class="prompt-pair" markdown="1">
<div markdown="1">

**English**

```text
Verify ONE complete use case of this system against the running system, not only with unit tests: [criterion id such as F-001.2, or a one-sentence description].

1. Before: query the real data store with its own client or CLI (name it, for example sqlite3, psql, a curl to a read endpoint) and record the state that matters.
2. Act: run the use case through the interface a real user would use (HTTP, command line, browser) and read the logs of that same run.
3. After: query the data store again.
4. Compare the three layers. What changed in the data must be exactly what the interface answered and what the logs say. Name every mismatch.
5. Save this check as a runnable script or integration test that takes the host and the connection settings from environment variables, so it also runs against staging. It must fail when the use case breaks: break the use case on purpose once, show the script fail, restore it, show it pass.

Finish with two lists: what you verified, and what you could not verify and why.
Do not change production code. If the system is not running, start it with the documented command; if you cannot, say so and stop. Show the commands you ran and their output.
```

</div>
<div markdown="1">

**Español (neutro)**

```text
Verifica UN caso de uso completo de este sistema contra el sistema en ejecución, no solo con tests unitarios: [id de criterio como F-001.2, o una descripción de una frase].

1. Antes: consulta el almacén de datos real con su propio cliente o CLI (nómbralo, por ejemplo sqlite3, psql, un curl a un endpoint de lectura) y registra el estado que importa.
2. Actúa: ejecuta el caso de uso por la interfaz que usaría una persona real (HTTP, línea de comandos, navegador) y lee los logs de esa misma ejecución.
3. Después: consulta de nuevo el almacén de datos.
4. Compara las tres capas. Lo que cambió en los datos debe ser exactamente lo que respondió la interfaz y lo que dicen los logs. Nombra cada discrepancia.
5. Guarda esta verificación como un script ejecutable o un test de integración que tome el host y la configuración de conexión de variables de entorno, para que también corra contra staging. Debe fallar cuando el caso de uso se rompe: rompe el caso de uso a propósito una vez, muestra el script fallando, restáuralo y muestra que pasa.

Termina con dos listas: lo que verificaste, y lo que no pudiste verificar y por qué.
No cambies el código de producción. Si el sistema no está en ejecución, levántalo con el comando documentado; si no puedes, dilo y detente. Muestra los comandos que corriste y su salida.
```

</div>
</div>

## What good output looks like

- A short report in three parts (before, act, after) with real values from the data store, the interface response and the log lines, side by side.
- A named verdict: the three layers agree, or here is the mismatch.
- A script or integration test in the repository that reads `HOST` and the connection settings (or equivalent names) from the environment.
- Two honest lists. "Could not verify" is never empty without a reason.

## Check that it worked

1. **The three layers are real.** The "before" and "after" values come from a query you can repeat: run the same query yourself and get the same rows.
2. **The script fails when it should.** Edit the code path (or the seed data) so the use case breaks; run the script: non-zero exit. Revert; zero.
3. **It runs somewhere else.** Run the script with the environment variables pointing at another instance (a clean clone, staging): it still passes.
4. **Nothing in production code changed.** `git diff --stat -- [production source folders]` is empty.
5. **The lists are honest.** Pick one item under "verified" and redo it by hand.

## Known limits

- Not run as written; the lab runs were on specific features with a specific stack (a local database CLI and HTTP probes).
- Needs real services and a queryable store. Tool choice depends on the stack; the prompt names the layers, not the tools.
- A use case that passes all three layers can still be the wrong use case: the criterion has to be the right one, which is [4. Refine and ratify](/formulas/refine/).
- Logs only help if the system logs the event you care about; "no log line" is itself a finding.

## Next

[7. Wire a gate](/formulas/gate/) to run the saved script on every change.
