# Spec completeness — what a complete GS spec needs, a template, and an audit prompt

> Beyond the sentinel *structure* already defined, this answers "when is a spec complete?" and how to get
> there. Candidate for a condensed section in the Field Guide. Grounded in the Compendium: derivability
> (§4.1.a), the completeness model I ∝ (1-S)/S (§9.4), normative keywords (§4.1.a), and the RND-1
> prescriptive-vs-descriptive result (§7.8.I).

## The completeness criterion (the one that matters)
A spec is complete when a **stateless reader can derive correct output from it alone** — equivalently, when it
**closes the output space to the correct programs**. Every degree of freedom the spec leaves open is a place
the reader fills arbitrarily (RND-1: a descriptive spec floors the model to the literal minimum; a prescriptive
one recovers full intent). Completeness is not length; it is *ruling out the wrong outputs*. Assume nothing.

## What a complete spec MUST carry
1. **Identity + boundary** — what the system IS and what it is not (Self-describing, Bounded). Screaming
   architecture: names announce the domain.
2. **Per feature, normative acceptance criteria** — each requirement phrased with RFC 2119 keywords
   (**MUST / SHOULD / MAY**); every MUST is an acceptance criterion and therefore a probe (Verifiable). Not
   "the actor needs to see data" but "the endpoint MUST return counts aggregated by type."
3. **Closed decisions** — the architectural choices resolved, each with its *why*, as ADRs/EDRs (Auditable).
   An open decision is a degree of freedom the reader will fill.
4. **Contracts** — types/interfaces and tests-as-spec that pin behaviour (Verifiable, Composable, Executable).
5. **Constraints and prohibitions** — the inviolable rules and forbidden patterns, each tied to a real past
   incident where possible (Defended).
6. **Navigation** — the sentinel routes to the right slice for each concern (Self-describing, Bounded).
7. **Verification hooks** — how each obligation is checked (the gates: `gate-template.md`).

## What a complete spec MUST NOT carry (over-specification is a failure mode too)
- **The how / implementation procedure** — the executor derives it; specifying it removes the leverage and
  ages badly. Specify intent and constraint, not steps.
- **Over-marking** — do not keyword every sentence; mark the load-bearing obligations only. Over-specification
  is the same harness-excess that degrades any bounded artifact (match the *specificity dial* to the stakes).
- **Restated defaults** — do not spell out what the activated domain schema already implies.

## The completeness self-test (per requirement, ask)
- If I handed only this to a stranger with no context, could they build the *right* thing, or would they guess?
- Where would they guess? That gap is the missing constraint — add it (the specification-query move).
- Is any acceptance criterion missing a MUST/SHOULD/MAY? Is any decision still open? Is anything here the *how*
  that should be derived instead?

---

## Audit-and-complete prompt (point an AI at a spec + this doc)

**Rol:** Auditá esta especificación para *completitud de derivabilidad* y completala, sin sobre-especificar.

**Leé:**
- `C:\workspace\PragmaWorks\gs\generative-specification\docs\spec-completeness.md` (este doc)
- `C:\workspace\PragmaWorks\gs\generative-specification\docs\white-paper\GenerativeSpecification_FieldGuide.md`
- La spec a auditar: `<FULL PATH A LA SPEC>`

**Hacé, en orden:**
1. Para cada feature/requisito, marcá si le falta **criterio de aceptación normativo** (MUST/SHOULD/MAY). Si
   falta, proponelo.
2. Encontrá los **degrees of freedom** — lugares donde un lector sin estado *adivinaría*. Listá cada uno como
   una "specification-query": la restricción faltante que, de estar, cerraría el espacio.
3. Marcá **decisiones abiertas** que deberían ir a un ADR/EDR con su *porqué*.
4. Marcá **contratos faltantes** (tipos/tests-as-spec).
5. Marcá **sobre-especificación**: cualquier cosa que sea *el cómo* (procedimiento de implementación) que
   debería derivarse, o keywording de más — proponé recortarlo (dial de especificidad según stakes).
6. Devolvé (a) el set de gaps como specification-queries, (b) la spec **completada** (descriptiva → prescriptiva
   donde hacía falta), (c) una nota de qué recortaste por sobre-especificación.

**Regla:** completitud = cerrar el espacio de salidas a las correctas, NO longitud. Assume nothing, pero no
especifiques el cómo. Sin AI-tells; voz técnica precisa.

---

## Template — a complete GS feature spec (F-NNN)

```
# F-NNN — <feature name>
Intent: <one sentence: what this must achieve, in domain terms>
Scope: <what is in / explicitly out — Bounded>

Acceptance criteria (normative, each a probe):
- MUST <observable, checkable behaviour>
- MUST <...>
- SHOULD <defeasible; deviation needs a recorded reason>
- MAY <permitted, ungated>

Contracts:
- types/interfaces: <signatures, error contract, e.g. Result<Money, Error>>
- tests-as-spec: <the behaviours pinned by tests>

Decisions (ADR/EDR refs): <closed choices + why; "chose X over Y because …">
Constraints/prohibitions: <inviolable rules, forbidden patterns, tied to incidents>
Verification: <which gates check this — see gate-template.md>
Routing: <where this lives in the sentinel tree>
```
Keyword only the load-bearing lines. If a stranger could still guess wrong, a constraint is missing.
