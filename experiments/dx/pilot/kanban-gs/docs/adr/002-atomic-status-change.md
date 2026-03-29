---
nav_exclude: true
---

# ADR 002: Atomic Status Change via Prisma Transaction

**Date:** 2026-03-17
**Status:** Accepted

## Context
POST /tasks/:id/status was doing two separate writes: task.update then activityLog.create.
If activityLog.create fails, the task is updated but no audit trail exists.

## Decision
Use prisma.$transaction to make both writes atomic.

## Consequences
- If either write fails, neither persists (correct invariant)
- ActivityLog is always present when status changes
