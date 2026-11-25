---
layout: default
title: Built with GS
nav_order: 9
permalink: /badge/
description: "A badge and a small file that say, in your own words and with a date, that a repository was built following Generative Specification. A declaration, not a certification."
---

# Built with GS

A repository can say it was built following Generative Specification in two ways: a small file a script can read, and a badge a person can see. The badge is generated from the file, so it never says more than the file says.

This is a declaration made by the people who own the repository. Nobody here checks it for you and nobody grants it. It is a draft that we are testing first on our own repositories.

## The badge

Add this line to your README:

```markdown
[![Built with GS](https://genspec.dev/assets/images/badges/built-with-gs.svg)](https://genspec.dev/start/)
```

[![Built with GS](/assets/images/badges/built-with-gs.svg)](/start/)

It means one thing: the owners say they followed the method and wrote down how. It does not show a grade.

## The file

Put a file named `genspec.json` at the root of the repository:

```json
{
  "declares": "built-with-gs",
  "rubric_version": "<version of the rubric you used>",
  "as_of": "<date>",
  "commit": "<commit the declaration refers to>",
  "declared_by": "<person or team>",
  "scored_by": "<who scored it, or null if not scored>",
  "scores": null,
  "notes": "<anything a reader should know>"
}
```

- `scores` stays `null` until someone scores the repository against the rubric. If you score it, list the letter for each property, and say who did it and when.
- `as_of` and `commit` are required. A declaration without a date and a commit is not valid, because the repository changes and the declaration does not.
- The file is yours to edit. If the repository stops following the method, change the file or remove it and the badge.

## What this is not

- It is not a certification, an approval or an audit, and no one reviews it before you use it.
- It is not the word "governed". That word is reserved until its definition is settled and there is a public record behind it.
- It does not say the code is correct, safe or good. It says how the owners say they worked.

## Wording and use of the name

Use the words "Built with GS". Please do not write that GS certified or approved your repository. The rules for using the name and the logo are being drafted, so for now we ask you to use only the badge above, unchanged. <!-- claims-ok: the rule itself -->

## Try it and tell us

This is the smallest version of the idea. If it is unclear, too much or too little, [open an issue](https://github.com/jghiringhelli/generative-specification/issues/new/choose) and say what you would change.
