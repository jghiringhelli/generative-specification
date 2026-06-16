# Feature: member activity  (spec B — prescriptive)

Same base API (Node/Express, in-memory store):
- `POST /api/members` body `{ "username": "..." }` → **201** `{ "member": { "id": ..., "username": "..." } }`.
- `POST /api/activity` body `{ "memberId": ..., "type": "..." }` → **201**. `type` is a **free string**
  (login, post, comment, share, …) — the list is **illustrative, NOT exhaustive**: any `type` must be
  recorded and counted **with no code changes**.
- `GET /api/admin/activity/dashboard` → **200**, with this **exact shape**:
  ```json
  { "perMember": [ { "memberId": ..., "lastAccess": "<ISO>", "actionsByType": { "<type>": <count> } } ],
    "activeMembers7d": <int> }
  ```

## UC-1 — Aggregated per-member view
For each member, `actionsByType` is the **AGGREGATED count by type** of their actions (NOT raw rows);
`lastAccess` = ISO timestamp of their last action. (Postcondition: if a member did `post` twice,
`actionsByType.post == 2`.)

## UC-2 — Active members
`activeMembers7d` = number of members with **≥1 action in the last 7 days**.

## Acceptance criterion
A `type` **outside the illustrative list** (e.g. `share`) must appear **aggregated** in `actionsByType`
with no special handling. The dashboard returns aggregates, never the raw log.
