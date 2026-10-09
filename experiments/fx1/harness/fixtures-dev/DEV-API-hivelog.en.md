# Hivelog (web API, Node.js, standard library only at runtime)

Hobby beekeepers want a small web service to keep track of their hives and of what they see at each inspection. Stack: Node.js 24, the built-in `http` module (no web framework), data kept in a JSON file. Tests with the built-in `node --test`.

How it should behave:

1. A beekeeper registers a hive with `POST /hives` and a JSON body `{ "name", "location" }`. The name is required and at most 40 characters. The answer is 201 with the hive and its new id. A bad request gets 400 and `{ "error": "..." }`.
2. `GET /hives` lists all hives, oldest first.
3. `GET /hives/:id` returns one hive, plus the status of its latest inspection (`"unknown"` if there is none). Unknown id: 404.
4. `POST /hives/:id/inspections` logs an inspection: `{ "date": "YYYY-MM-DD", "queenSeen": true/false, "broodFrames": 0 to 12, "mitesPer100": number >= 0 }`. The answer is 201 with the inspection and its computed status. Unknown hive: 404. Invalid body: 400. A date in the future: 400. A second inspection of the same hive on the same date: 409.
5. The status of an inspection is `"treat"` when mites per 100 bees is 3 or more; otherwise `"watch"` when mites are 2 or more or the queen was not seen; otherwise `"healthy"`.
6. `GET /hives/:id/inspections` lists that hive's inspections, newest date first.
7. `GET /alerts` lists the hives whose latest inspection has status `"treat"`, the worst mite count first, each with hive name, date and mites per 100.
8. The data survives a restart (file `data/hives.json`, created on first write).
9. The port comes from the `PORT` environment variable, default 3000.

First slice to build: (a) registering and listing hives, (b) logging inspections with the computed status, (c) the alerts list.
