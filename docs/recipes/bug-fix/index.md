---
layout: default
title: Bug Fix
parent: Workflow Recipes
nav_order: 5
description: "Fix a production bug in a ForgeCraft project while maintaining GS discipline"
---

# Bug Fix

**Scenario**: A bug was found in production. Fix it without introducing regressions and without breaking the GS contract.

---

## Step 1 — Characterize the bug

Before touching code, answer:

1. **Which use case does this bug violate?** If you can't name the UC, the bug is in behavior that isn't specified. That's a spec gap — fill it first.
2. **Is this a regression from a recent change, or a latent bug?** Check `git log --oneline` for recent commits to the affected area.
3. **Is there an existing test that should have caught this?** If yes, that test has a gap. If no, that gap needs a test.

---

## Step 2 — Write a failing test that reproduces the bug

Before fixing anything:

```typescript
it('returns 422 when email is already registered', async () => {
  // This is the bug: currently returns 500 instead of 422
  const response = await request(app).post('/api/users').send({ email: 'existing@test.com' });
  expect(response.status).toBe(422);
  expect(response.body.errors).toBeDefined();
});
```

Run the test. It must fail. Commit it:

```
git commit -m "test(auth): [RED] returns 422 for duplicate email registration"
```

This is the machine-readable record that the bug exists. The RED commit is your regression anchor.

---

## Step 3 — Fix the bug

Write the minimum code to make the test pass. Run all tests. All must pass.

```
git commit -m "fix(auth): handle duplicate email with 422 instead of 500"
```

---

## Step 4 — Update the spec if the bug revealed a gap

If the bug was in unspecified behavior, add the correct behavior to `docs/use-cases.md`:

```markdown
## UC-003: Register with Duplicate Email

**Precondition**: Email address already exists in the system.
**Actor**: New user
**Action**: Submits registration form with duplicate email
**Postcondition**: System returns 422 with field-level error. No new account created.
```

Update the PRD if a goal was violated.

---

## Step 5 — Run cascade

```
forgecraft_actions({
  action: "check_cascade",
  project_dir: "/path/to/your-project"
})
```

The cascade verifies the fix didn't introduce structural issues. If it's blocked, fix before merging.

---

## Step 6 — Consider an ADR

If the bug revealed a systemic issue (e.g., error handling is inconsistent across the entire API), write an ADR for the corrective architecture decision. This prevents the same class of bug from recurring.

---

## What Not to Do

- Do not add `try/catch` around the broken code to silence the error. Find the root cause.
- Do not fix the symptom without updating the spec. Undocumented correct behavior is the next bug.
- Do not merge a bug fix that reduces test coverage. The RED test is required.
