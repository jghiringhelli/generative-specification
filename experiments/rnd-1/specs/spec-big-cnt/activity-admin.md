# Node: activity-admin

R6. `POST /api/members/:id/activity` body `{ "type": "..." }` → **201**. `type` is a free string (login, post, comment, share, …) — illustrative, **NOT exhaustive**; any type is recorded and counted with no special code.
R7. `GET /api/admin/activity/dashboard` → **200** `{ "perMember": [ { "memberId": ..., "lastAccess": "<ISO>", "actionsByType": { "<type>": <count> } } ], "activeMembers7d": <int> }`. **Aggregated by type** (NOT raw rows); `activeMembers7d` = members with ≥1 action in the last 7 days; any `type` (e.g. `share`) counts.
R12. The dashboard only counts activity of **existing** members (activity of deleted members is excluded).
