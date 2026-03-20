# CLAUDE.md Templates

These templates implement the three-tier CLAUDE.md hierarchy described in the Generative Specification methodology.

Each tier has one job. Claude reads them in cascade from the current working directory upward, so all three are active simultaneously during a session.

---

## The Three Tiers

| File | Level | Job |
|---|---|---|
| `workspace-claude.md` | Workspace root | Cross-project engineering standards. Coding rules, testing policy, commit format. Apply to every project. |
| `project-constitution.md` | Project root | Architectural constitution. Domain entities, layer map, dependency rules, error hierarchy. Specific to this system. |
| `module-constraints.md` | Module directory | Local constraints. What this directory does, what it must not do, what belongs elsewhere. |

---

## Usage

1. Copy `workspace-claude.md` to your workspace root as `CLAUDE.md`. Fill in your stack and coding standards.
2. Copy `project-constitution.md` to your project root as `CLAUDE.md`. Fill in your domain model, layer map, and architectural decisions.
3. Copy `module-constraints.md` to any module directory that needs local constraints as `CLAUDE.md`. Fill in what is specific to that module.

Commit all three before the first agent session begins.

---

## The Rule

If your CLAUDE.md needs a table of contents, it is too big. Split it across the three tiers. Each file should fit on one screen. The cascade composes them at runtime.

---

*Generative Specification white paper: https://doi.org/10.5281/zenodo.19073543*
