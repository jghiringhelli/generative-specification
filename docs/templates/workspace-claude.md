---
nav_exclude: true
---

# CLAUDE.md — Workspace Engineering Standards
#
# TIER: Workspace root
# JOB:  Cross-project coding standards. Apply to every project in this workspace.
#       Does not know about any domain. Knows how to write correct software.
#
# Usage: Place at workspace root as CLAUDE.md. Customize stack-specific rules.
#        This file is read by Claude Code alongside project-level and module-level
#        CLAUDE.md files. It is the outermost ring of the three-tier hierarchy.

---

## Code Standards

- Maximum function/method length: 50 lines. Decompose if longer.
- Maximum file length: 300 lines. Split by responsibility if longer.
- Maximum function parameters: 5. Use a parameter object if more.
- Every public function/method must have a docstring with typed params and return value.
- Delete orphaned code. Do not comment it out. Git has history.
- Before creating a new utility, search the codebase for existing ones.
- No abbreviations in names except: id, url, http, db, api.
- All names must be intention-revealing. If a comment is needed to explain a variable, the name is wrong.

## SOLID Principles

- **Single Responsibility**: One module = one reason to change.
- **Open/Closed**: Extend via interfaces and composition. Do not modify working code for new behavior.
- **Liskov Substitution**: Any interface implementation must be fully swappable.
- **Interface Segregation**: Small focused interfaces. No god-interfaces.
- **Dependency Inversion**: Depend on abstractions. Concrete classes are injected, never instantiated inside business logic.

## Error Handling

- Custom error hierarchy per module. No bare throws.
- Every error carries context: entity id, operation name, timestamp.
- Fail fast, fail loud. No silent exception swallowing.
- Domain code never returns HTTP status codes — that is the API layer's job.

## Testing

- Test names are specifications: `should_reject_contribution_after_window_closes`, not `test_validation`.
- No empty catch blocks. No tests that cannot fail.
- Coverage minimum: 80% line coverage. New/changed code: 90%.
- Mutation score minimum: 65% (overall), 70% (new/changed code).
- Prefer stubs and fakes over mocks. Tests that mock everything test nothing.

## Immutability

- Prefer `const` over `let`. Use `readonly` on properties and parameters.
- When modifying data, create a new copy. Mutable state is the primary source of bugs.

## Configuration

- ALL configuration through environment variables or config files. No hardcoded values.
- ALL magic numbers are named constants with documentation.
- Config is validated at startup — fail fast if required values are missing.

## Commit Protocol

- Format: `feat|fix|refactor|docs|test|chore(scope): description`
- One logical change per commit. Never mix refactoring with features.
- Commits must pass: compilation, lint, tests, coverage gate.

---

*Generative Specification methodology: https://doi.org/10.5281/zenodo.19637142*
