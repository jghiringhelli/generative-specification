#!/usr/bin/env python3
"""
Reads all YAML files from quality-gates/gates/, generates a sorted markdown
table, and replaces the section between GATES_TABLE_START / GATES_TABLE_END
markers in README.md.

Run from the repository root:
    python scripts/generate-gates-table.py
"""

import os
import re
import sys
import yaml

GATES_DIR = "quality-gates/gates"
README_PATH = "README.md"
START_MARKER = "<!-- GATES_TABLE_START -->"
END_MARKER = "<!-- GATES_TABLE_END -->"

PROPERTY_ORDER = [
    "Self-describing",
    "Bounded",
    "Verifiable",
    "Defended",
    "Auditable",
    "Composable",
    "Executable",
]


def first_sentence(text: str) -> str:
    """Return the first sentence of a description string, trimmed."""
    text = " ".join(text.split())
    match = re.search(r"^(.*?[.!?])\s", text)
    if match:
        return match.group(1)
    return text[:120] + ("..." if len(text) > 120 else "")


def load_gates(gates_dir: str) -> list:
    gates = []
    for filename in sorted(os.listdir(gates_dir)):
        if not filename.endswith(".yaml"):
            continue
        path = os.path.join(gates_dir, filename)
        with open(path, encoding="utf-8") as f:
            data = yaml.safe_load(f)
        if not data:
            print(f"WARNING: skipping empty/invalid YAML: {filename}", file=sys.stderr)
            continue
        data["_file"] = filename
        gates.append(data)
    return gates


def sort_gates(gates: list) -> list:
    def sort_key(gate):
        prop = gate.get("property", "")
        try:
            return (PROPERTY_ORDER.index(prop), gate.get("id", ""))
        except ValueError:
            return (len(PROPERTY_ORDER), gate.get("id", ""))

    return sorted(gates, key=sort_key)


def build_table(gates: list) -> str:
    rows = []
    rows.append("| Gate | Description | GS Property | Tags | Phase | Trigger |")
    rows.append("|---|---|---|---|---|---|")

    for gate in gates:
        gate_id = gate.get("id", gate["_file"].replace(".yaml", ""))
        description = first_sentence(gate.get("description", ""))
        prop = gate.get("property", "—")
        tags = gate.get("tags", [])
        tags_str = ", ".join(tags) if isinstance(tags, list) else str(tags)
        phase = gate.get("phase", "—")
        trigger = gate.get("trigger", "—")
        file_link = f"quality-gates/gates/{gate['_file']}"

        rows.append(
            f"| [{gate_id}]({file_link}) | {description} | {prop} | {tags_str} | {phase} | {trigger} |"
        )

    low = [
        p for p in PROPERTY_ORDER
        if sum(1 for g in gates if g.get("property") == p) < 2
    ]
    note = ""
    if low:
        note = (
            f"\n*Underrepresented properties (highest-value contribution targets): "
            f"{', '.join(low)}.*"
        )

    count = len(gates)
    header = f"\n#### Current Gate Library ({count} gates)\n\n"
    return header + "\n".join(rows) + "\n" + note


def update_readme(readme_path: str, table: str) -> bool:
    with open(readme_path, encoding="utf-8") as f:
        content = f.read()

    pattern = re.compile(
        re.escape(START_MARKER) + r".*?" + re.escape(END_MARKER),
        re.DOTALL,
    )

    if not re.search(pattern, content):
        print(
            f"ERROR: markers not found in {readme_path}. "
            f"Add {START_MARKER!r} and {END_MARKER!r} around the gate table.",
            file=sys.stderr,
        )
        sys.exit(1)

    replacement = f"{START_MARKER}\n{table}\n{END_MARKER}"
    new_content, count = re.subn(pattern, replacement, content)

    if count == 0:
        print("ERROR: replacement failed", file=sys.stderr)
        sys.exit(1)

    if new_content == content:
        print("README already up to date.")
        return False

    with open(readme_path, "w", encoding="utf-8") as f:
        f.write(new_content)

    print(f"README updated with {len(gates)} gates.")
    return True


if __name__ == "__main__":
    gates = load_gates(GATES_DIR)
    gates = sort_gates(gates)
    table = build_table(gates)
    update_readme(README_PATH, table)
