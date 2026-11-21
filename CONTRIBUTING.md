---
nav_exclude: true
search_exclude: true
---

# Contributing to Generative Specification

Generative Specification (GS) is an open method, developed in the open as a working draft. It is not a standard and no body has recognized it. Anyone can read it, question it, test it and propose changes. This page tells you how.

## Your first contribution in 15 minutes

Pick one:

1. **Tell us what is unclear.** Read one page ([the rubric](https://genspec.dev/method/rubric/) is a good start) and open a "Something is unclear" issue. This is a real contribution; it improves the page.
2. **Take a labelled issue.** Issues labelled [`first contribution`](https://github.com/jghiringhelli/generative-specification/labels/first%20contribution) are small, scoped and have a stated finish line.
3. **Propose a quality gate.** One YAML file, one property. See [how to contribute a gate](quality-gates/CONTRIBUTING.md).
4. **Re-run an experiment** and report the result, including a null result. See the [experiment publishing playbook](docs/white-paper/EXPERIMENT-PUBLISHING-PLAYBOOK.md).

## The one question

Before you open a change, ask it:

> Does this make it easier to check, with a check that runs, that the code an assistant derived is correct?

A change that does is in scope. A change that does not may still be a good idea, but it probably belongs in a discussion first.

## What we ask of a pull request

- **Include the check that supports it.** A new claim comes with the evidence or the test that backs it. A new gate comes with an example that fails and one that passes. A changed definition comes with the case it is meant to settle.
- **Keep it small.** One idea per pull request. If it is large or changes a definition, open a Discussion or an issue first and talk before you write.
- **Label what you know.** Say whether a statement is measured, a pilot, an anecdote or a hypothesis. Do not write "proven" or "certified". Do not write that something is "official" or a "standard". Do not claim independence unless it is true and you can show it. <!-- claims-ok: the rule itself -->
- **No third-party tool attacks.** Describe what a check does, not what another tool lacks.
- **AI-assisted work is welcome, and a person reviews it.** If an assistant helped, say so in the pull request. You are responsible for every line you submit; we do not accept unreviewed generated text.

An automatic check flags a few words in new text that the claims rule forbids (for example "proven" or "certified"). <!-- claims-ok: the rule itself --> If it flags something that is correct in context, explain it in the pull request.

## How decisions are made

The working draft is open. Maintainers merge what passes the question above and the rules on this page. The written rules for who can block a change, and on what grounds, are being drafted and will be published here before they apply. Until then, a maintainer who declines a change will say why, in public, on the pull request.

## Licence

Text is under [CC BY 4.0](LICENSE). Code is under [MIT](LICENSE-CODE). By contributing you agree your contribution is released under the same licence as the part it touches.

## Where to talk

- **Questions and ideas:** the repository's Discussions.
- **Bugs and unclear pages:** issues, with the templates.
- Nothing is private. Please do not send proposals by direct message: a public thread helps the next reader.
