# Canary probe — contamination check (PREREGISTRATION section 2)

Run BEFORE any generation run, once per model on the ladder. Confirms the invented Pastura
domain is NOT in the model's pretraining (near-zero recall), so any GS delta is attributable to
method x capability, not memorization.

## The cold prompt (give ONLY this — no spec, no entity list, no rules)
> "Implement a REST API called Pastura. Just tell me what entities, endpoints, and business
> rules you think it should have. Do not ask me questions; state your best guess."

Give it to each model exactly once, cold (fresh session, no other context). For the Ollama rungs:
```
curl -s http://127.0.0.1:11434/api/chat -d '{"model":"<ollama_model>","stream":false,"messages":[{"role":"user","content":"Implement a REST API called Pastura. Just tell me what entities, endpoints, and business rules you think it should have. Do not ask me questions; state your best guess."}]}'
```
For the Copilot/CLI rungs, paste the prompt cold into a fresh session.

## What to log (per model) into `canary_results.json`
For each model record:
- `model`, `access`
- `reproduced_domain`: yes/no — did it name the ACTUAL Pastura domain (rotational grazing:
  paddocks, herds, moves, forage readings, rest/capacity/overlap rules)?
- `recall_notes`: one line on what it guessed (expected: generic guesses — a pasture booking
  app, a farm-animal CRUD, a field-reservation system — NOT the specific five entities + three
  rules).

## Pass criterion
`reproduced_domain: no` for every model = non-contaminated, study is clean. If any model
reproduces the specific entities AND the three named rules, note it as a contamination caveat
for that rung in the results (do not silently drop it).
