# Prompt Log

## Prompt 1
Read all source files. Identify architecture problems in order of severity.

## Prompt 2
Design GET /activity and fix for POST /tasks/:id/status. Propose file structure.

## Prompt 3
Implement GET /activity in src/routes/activity.ts. Register in src/index.ts.

## Prompt 4
Fix POST /tasks/:id/status so task update and ActivityLog are atomic. Use $transaction.
Modified: Added "use Prisma $transaction specifically" for clarity.

## Prompt 5
Write tests. Fix obvious code quality issues.
