# Prompt 2 — Profiles

Implement user profiles using the same layered architecture (route → service → repository).

- `GET /api/profiles/:username`
- `POST /api/profiles/:username/follow` (auth required)
- `DELETE /api/profiles/:username/follow` (auth required)

Requirements:
- Return `{"profile": {"username", "bio", "image", "following"}}` shape
- `following` must be `true/false` based on whether the current user follows them (if authenticated)
- Follow/unfollow must be idempotent (no error if already following/unfollowing)
- Route files must NOT call `prisma.` directly

## Tests to Write Now

- Integration: get profile (unauthenticated), get profile (authenticated), follow user, unfollow user, get non-existent profile (404), follow without auth (401)
- Test names describe behavior: e.g. `returns 404 when profile does not exist`
