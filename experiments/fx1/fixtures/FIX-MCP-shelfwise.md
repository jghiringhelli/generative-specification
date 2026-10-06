# Shelfwise (MCP tool server)

I want my assistant to keep track of my pantry. Build an MCP server over stdio that exposes pantry tools and one resource.

**Stack.** Node 24. The official MCP SDK package is the only allowed runtime dependency. The pantry is stored in a JSON file whose path comes from the `PANTRY_FILE` environment variable.

**What it must do.**

1. Tool `add_item` takes a name, a quantity, a unit and an optional expiry date, and adds a batch of that item.
2. Units come in two families: mass (`g`, `kg`, `oz`, `lb`) and volume (`ml`, `l`, `cup`). Quantities are stored in the unit they were added in but compared and consumed after conversion to grams or millilitres.
3. Tool `consume` takes a name, a quantity and a unit and removes that amount, taking from the batch that expires first. If the amount is more than what is in stock it removes nothing and answers with an error that states how much is left.
4. Asking to consume mass from an item stored as volume (or the reverse) is refused with an error that says the families do not match.
5. Tool `expiring_soon` takes a number of days and lists batches that expire within that many days, soonest first, with name, quantity, unit and expiry.
6. Tool `shopping_list` takes minimum levels (name, quantity, unit) and returns the items whose stock is below them and by how much.
7. The resource `pantry://inventory` returns the current stock grouped by item, totalled in the family's base unit.
8. All tool errors are returned as tool results with `isError` set, never as a crashed server.
9. The data survives a restart.

**First slice.** `add_item`, `consume` with conversion and first-expiry order, `expiring_soon`.

**My quality bar.** Tested, easy to start from a clean checkout, and I can add a tool later without touching the others.
