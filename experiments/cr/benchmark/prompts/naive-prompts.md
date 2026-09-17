# Naive condition — fixed prompt sequence

> Verbatim recipe (mirrors AX2 naive). Short, ad-hoc, no architecture/test guidance. The
> agent gets the `naive/README.md` and the domain as prose. Same sequence for every model on
> the ladder. Do not vary between runs.

1. "Build a REST API called Pastura in TypeScript on Node with PostgreSQL for rotational
   grazing. It has paddocks (name, area in hectares, restDays), herds (name, animalUnits),
   forage readings (paddock, date, kgDryMatterPerHectare), and moves (a herd entering a
   paddock, with enteredAt and an optional leftAt). Use JWT auth with owner and hand roles."

2. "Add the grazing rules when creating a move: a paddock must rest restDays days after a
   herd leaves before another can enter; a herd's animalUnits must not exceed the paddock's
   capacity = latest reading kgDryMatterPerHectare × area / 3000; and a paddock can only have
   one open move at a time. Reject bad moves with 422."

3. "Add computed reads: a paddock's grazing budget (days left = floor(kgDM × area / (herd
   animalUnits × 100))), a paddock's occupancy, and a herd's move history."

4. "Make owners able to do everything and hands only able to record moves and readings."

5. "Make sure it runs against a local Postgres and returns JSON errors."

6. "Add some tests."
