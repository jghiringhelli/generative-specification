# Lendmark (web API)

A neighbourhood library lends tools to members. I want a small JSON API over HTTP that runs the lending desk.

**Stack.** Node 24, no web framework. Persistence in memory or with the built-in `node:sqlite`.

**What it must do.**

1. A member has a name and a tier, `basic` or `supporter`. An item has a name, a class (`hand`, `power`, `ladder`) and a replacement value.
2. Loan length depends on class and tier. Basic members: hand 14 days, power 7 days, ladder 3 days. Supporters get half again as long, rounded down.
3. Returning an item after its due date costs a fine per day late: hand 0.25, power 1.00, ladder 2.00. A fine never exceeds the item's replacement value. Supporters get one day of grace.
4. A member whose unpaid fines are above 5.00 cannot borrow until they pay.
5. A member can hold at most 3 items at once (basic) or 6 (supporter).
6. An item that is out can be reserved. When it comes back it is held for the first member in the queue for 48 hours; after that it goes to the next one, or back on the shelf.
7. Paying a fine reduces what the member owes; overpaying is refused.
8. Endpoints I expect: create member, create item, borrow, return, reserve, pay a fine, read a member's fines, read an item's status.

**First slice (build these first).** Members and items; borrowing with due dates and the loan limit; returning with fines.

**My quality bar.** It has tests, it starts with one command, and I can change a rule later without breaking the others.
