# Feature: member activity  (spec A — descriptive)

The system records member activity. An administrator **needs to see certain data** about
member activity — **for example**, last accesses and recent actions.

API (Node/Express, in-memory store):
- `POST /api/members` body `{ "username": "..." }` → creates a member and returns its id.
- `POST /api/activity` body `{ "memberId": ..., "type": "..." }` → records a member action.
- `GET /api/admin/activity/dashboard` → gives the admin the activity information they need.

Store the activity and give the admin a way to query it.
