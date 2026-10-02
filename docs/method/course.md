---
layout: default
title: The free course
parent: Learn
nav_order: 1
permalink: /method/course/
description: "A short, free course on Generative Specification: thirteen lessons, about 26 minutes, in English and Spanish, ending with a first hour on your own project."
---

# The free course: Generative Specification in 26 minutes

A short, free way into the method. Thirteen videos, about twenty-six minutes, one idea each, in English and Spanish. They are the same videos that open the full program: this is a playlist, not a different course. It starts with a spacecraft that failed because nobody verified a contract end to end, and it ends with the first hour on your own repository.

You do not need the course to use the work. The method is open on this site, and the free audit prompt at [pragmaworks.dev/audit](https://pragmaworks.dev/audit) works on any repository.

{% include course-slot.html %}

<!-- COURSE VIDEOS: placeholder. To activate, fill the URLs in _data/course_short.yml (see the comments at the top of that file). This page, the home strip and the status table update by themselves. -->

## What you finish with

- **The problem, in two parts.** Drift: a thousand reasonable decisions that don't add up. And the reader with no memory: whoever arrives new, person or AI, doesn't have the context.
- **The idea.** Write the what first, let the machine derive the code, and verify the result with something outside the model.
- **The words you need.** Sensor, gate, hook, oracle, ratchet, spec, sentinel.
- **A way to read a project.** Seven properties, each graded with a letter and its evidence, plus a short task list.
- **A first hour on your own project.** A sentinel, a spec with verifiable criteria, one gate you saw stop the line, and your letters.

## What this course is not

It is not the full course. It has no labs with feedback, no work on big, old projects, no domain tracks, and no claim that it covers everything. When it shows what we tested, it says how much that is worth and how much it is not. One model, two repetitions and one project is a mechanism, not a measurement, and a small project of your own may behave differently.

## Who it is for

Developers and tech leads who already work with an AI assistant and want the discipline behind it.

## What is published today

| Item | Status |
|---|---|
| The thirteen videos | {% if site.data.course_short.playlist_en != "" or site.data.course_short.playlist_es != "" %}**Published.** Links are in the table below{% else %}**Finished, not yet published.** No video is linked here until it is live{% endif %} |
| [The open method](/) | Published |
| The free audit prompt | Published at [pragmaworks.dev/audit](https://pragmaworks.dev/audit) |
| The full program (guided path, labs with feedback, sensors kit, community) | In preparation, no date |

The scripts are written in English and Spanish. In Spanish the course says *centinela*; in English, *sentinel*.

## The thirteen lessons

| # | Lesson (English / Spanish) | What it covers | English | Castellano |
|---|---|---|---|---|
{% for l in site.data.course_short.lessons -%}
| {{ l.n }} | **{{ l.title_en }}**<br>{{ l.title_es }} | {{ l.covers }} | {% if l.youtube_en != "" %}[Watch]({{ l.youtube_en }}){% else %}Soon{% endif %} | {% if l.youtube_es != "" %}[Ver]({{ l.youtube_es }}){% else %}Pronto{% endif %} |
{% endfor %}

The chain moves from the problem (lessons 2 and 3), to the idea (4 and 5), to the words and the verification (6 and 7), to how to read a project (8 and 9), to how to improve it without going back (10), to how to explain it to the assistant (11), and to starting today (12 and 13).

## Read it instead

Everything the lessons teach has a written home on this site. Pick the route that suits you:

- [Learn by goal or role](/learn/by-goal/): what to read if you are new, lead a team, inherited a codebase or want evidence.
- [Learn by property](/learn/by-property/): the seven properties, each with where to read it, practise it and check it.
- [Your first hour](/START-HERE.html): the same five steps as lessons 12 and 13, in text.

## After the course

- [The rubric](/method/rubric/): the seven properties in full, with the failure named for each.
- [Spec completeness](/method/spec-completeness/): when a spec is complete enough for a stateless reader.
- [Quality gates](/method/gates/): the non-LLM checks that make it enforceable.
- [Practice](/practice/): the method on a real project, new or existing, as prompts you can paste.

The earlier outline of a longer course, with five hands-on labs, is kept as the [full program outline](/method/course-full/). It describes a program that is in preparation.
