I'm encountering tool access limitations. Let me provide structured guidance for the integration verification that you can execute, or grant permission for the audit tool and I'll analyze programmatically.

## Manual Verification Steps

### 1. **Start Server & Test Endpoints**

```bash
cd /c/workspace/claude/forgecraft-mcp/experiments/runner

# Start the server
npm run dev

# In another terminal, test each endpoint:

# Health check
curl http://localhost:3000/health

# POST /runs (create run)
curl -X POST http://localhost:3000/runs \
  -H "Content-Type: application/json" \
  -d '{"experiment_id":"exp-1","variant":"control","model":"claude-opus","provider":"anthropic"}'

# GET /runs/:id (get run details)
curl http://localhost:3000/runs/{run_id}

# GET /runs (list runs with filters)
curl "http://localhost:3000/runs?experiment_id=exp-1&variant=control&status=pending"

# PATCH /runs/:id (update run)
curl -X PATCH http://localhost:3000/runs/{run_id} \
  -H "Content-Type: application/json" \
  -d '{"status":"running"}'

# POST /runs/:id/submit (submit output)
curl -X POST http://localhost:3000/runs/{run_id}/submit \
  -H "Content-Type: application/json" \
  -d '{"output":"result text","tools_used":[]}'
```

### 2. **Layer Separation Audit Checklist**

Check each route file for:
- ❌ **Direct database calls** (e.g., `db.run.create()`, `db.query()`)
- ✅ **Service delegation** (e.g., `runService.createRun()`, `runService.submitOutput()`)
- ✅ **DTOs for boundaries** (request → DTO → service, service → DTO → response)

Files to audit:
```
src/routes/runs.ts
src/routes/health.ts
src/services/*.ts
```

### 3. **Error Format Compliance**

Expected format:
```json
{
  "errors": {
    "body": ["Validation failed: missing required field 'experiment_id'"]
  }
}
```

Check:
- Validation errors (400/422)
- Not found errors (404)
- Server errors (500)
- Conflict errors (409)

### 4. **Expected Endpoints Summary**

Based on typical API experiment runner design:

| Method | Path | Expected Status | Purpose |
|--------|------|----------------|---------|
| GET | `/health` | 200 | Health check |
| POST | `/runs` | 201 | Create new run |
| GET | `/runs/:id` | 200/404 | Get run details |
| GET | `/runs` | 200 | List runs (filtered) |
| PATCH | `/runs/:id` | 200/404 | Update run metadata |
| POST | `/runs/:id/submit` | 200/404/409 | Submit output |

---

**Would you like me to:**
1. Wait for audit tool permission and analyze programmatically?
2. Have you grant Read/Grep tool access so I can inspect the source files directly?
3. Proceed with you sharing the relevant source files for review?

Please let me know which approach you prefer, or run the verification steps above and share the results for me to analyze.