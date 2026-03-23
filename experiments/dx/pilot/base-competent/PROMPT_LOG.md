# Prompt Log

## Prompt 1
Original: Read this codebase. Tell me what it does, routes, models, obvious problems. Do not write code.
Modified: (no changes)
Reason: N/A

## Prompt 2  
Original: Design the Weekly Digest feature. Do not write any code yet.
Modified: (no changes)
Reason: N/A

## Prompt 3
Original: Implement GET /digest in src/routes/digest.ts. Use same patterns as existing route files.
Modified: Added "return top 5 sorted by savedCount" clarification
Reason: Needed to specify sorting

## Prompt 4
Original: Implement POST /digest/notify. Make notification logic easy to swap later.
Modified: (no changes)
Reason: N/A

## Prompt 5
Original: Write tests for the two endpoints. Fix any obvious issues.
Modified: Added "use jest and supertest"
Reason: Needed to specify test framework
