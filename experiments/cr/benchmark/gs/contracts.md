# Pastura — Contracts (endpoints & error shape)

> The API surface and the normative error contract. Framework and route casing are free;
> the shapes and codes below are not.

## Error contract (normative)
Every error body is exactly:
```json
{ "error": { "code": "<machine_code>", "message": "<human message>" } }
```
| Status | code | When |
|---|---|---|
| 401 | `unauthenticated` | missing/invalid token |
| 403 | `forbidden` | role not permitted |
| 404 | `not_found` | unknown entity id |
| 422 | `validation` | bad/missing input fields |
| 422 | `rule_rest` / `rule_capacity` / `rule_overlap` | R1 / R2 / R3 rejected the move |

Success: `201` create, `200` read/update, `204` delete. Never expose `passwordHash`.

## Endpoints
```
POST   /register        {email,password,role}                 -> 201 {token}
POST   /login           {email,password}                      -> 200 {token}

POST   /paddocks        owner {name,areaHectares,restDays}    -> 201 paddock
GET    /paddocks                                              -> 200 [paddock]
GET    /paddocks/:id                                          -> 200 paddock | 404
GET    /paddocks/:id/budget                                   -> 200 {grazingDaysLeft} | 422
GET    /paddocks/:id/occupancy                                -> 200 {occupied,herdId,since}

POST   /herds           owner {name,animalUnits}              -> 201 herd
GET    /herds/:id/history                                     -> 200 [move]

POST   /readings        owner|hand {paddockId,readingDate,kgDryMatterPerHectare} -> 201 reading

POST   /moves           owner|hand {herdId,paddockId,enteredAt} -> 201 move | 422 rule_*
POST   /moves/:id/close owner|hand {leftAt}                   -> 200 move | 404
```

## Field contracts
- Paddock: `{id,name,areaHectares>0,restDays>=0,createdAt}` — `name` unique, non-empty.
- Herd: `{id,name,animalUnits>0,createdAt}` — `name` unique, non-empty.
- ForageReading: `{id,paddockId,readingDate,kgDryMatterPerHectare>=0,createdAt}`.
- Move: `{id,herdId,paddockId,enteredAt,leftAt|null,createdAt}`.
- JWT payload carries `{userId, role}`; expiry `"24h"`.
