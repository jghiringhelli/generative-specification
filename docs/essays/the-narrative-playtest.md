# The Narrative Playtest

*How four imaginary players caught fifteen bugs in my unreleased board game — and what it says about the last mile of any creative project.*

---

Last Tuesday afternoon, I asked an AI to sit down with three other AIs and play my board game.

Not run a simulation. Not crunch the math. *Play it.* Read the rules cold, sit in turn order, take roles as four players learning the game together. Get confused at the same places real humans would get confused. Write down questions. Make best guesses when the rule was ambiguous. Argue, in a low-key way, about edge cases.

Ninety simulated minutes later, I had a notebook.

Fifteen entries. Eleven were real rulebook bugs. Two definitions of the same rule that contradicted each other on different pages. One mechanic that turned out to be silently overpowered. A tag system whose unlock conditions weren't actually written down anywhere. A starting tech that appeared twice — once in a corporation's setup, once in the shuffled deck, with no rule saying which copy was the "real" one.

These are the bugs you discover at minute 35 of a playtest, when four friends are looking at you across a table waiting for you to rule on something the rulebook doesn't cover. Except I didn't need the friends. I didn't need the table. The bugs were in the notebook before I'd printed a single card.

This is the last step in the pipeline. I want to talk about all of it.

---

## What the pipeline actually was

I've been designing a board game for about five months. Solo. Theme: a cooperative-to-competitive resource game about racing to save civilization, with a clean pivot point where the cooperation breaks and players scramble for individual survival. Call it Exodus Protocol.

Five months from "I have an idea" to "I have a printable prototype with balance verified across thousands of simulated games" is fast. The historical baseline for a solo board game design — from idea to first playable prototype — is somewhere between eighteen months and three years. I know designers who took six. The compression isn't because I worked harder than they did. The compression is the pipeline.

Here's the actual sequence:

**Discussion and initial spec.** I sat with the AI and talked through the idea. Not "make me a game" — that produces nothing. *"Here's the experience I want players to have. Here's the design tension at the center. Here are three reference games I'm in dialogue with. Push back on what doesn't work."* The output was a written spec — mechanics, victory conditions, the central pivot, the corp identities. A document I could hand to anyone.

**Refinement against modern design.** I asked the AI to compare my mechanic against published design literature — what gives the cooperative phase its tension, what makes the survival pivot a real choice instead of a foregone conclusion. We refined for a couple of weeks. Several core mechanics changed shape. One was killed entirely.

**Rulebook authoring and sanitation.** The spec became a rulebook. Then I had the AI read its own rulebook back to me, looking for places where two sections disagreed. This caught a dozen contradictions in the first pass. Most rulebooks ship with these. Mine doesn't.

**Card generation at scale.** Two hundred and forty technology cards, a hundred and fifty crisis cards. Each one needed a name, a tag system, a cost, an effect, balanced against the others. The AI generated drafts; I edited, killed the bad ones, asked for variants in the gaps. This step alone, in a non-AI workflow, takes months.

**A headless game engine.** I wrote — well, I directed the writing of — an actual implementation of the game. Pure Python, no UI. Every rule, every card, every interaction. The engine became the canonical spec: if the rulebook said one thing and the engine did another, one of them was wrong.

**Balance simulations at scale.** With the engine in place, I ran thousands of games. Random agent vs. random agent. Heuristic agents with corporation-specific strategies. Same agents on different scenarios. Win rates by corporation, by scenario, by survival path. Cooperative win rate, individual win rate, doomsday-loss rate. The numbers told me which cards were too cheap, which corps were too strong, which crisis types created false difficulty. Twenty iterations of card tuning, all driven by the simulator.

**A simple UI for live play.** Once the math converged, I built a minimal browser interface — drag a worker, click to research, see the doomsday clock advance. Played against a simple AI opponent. Made a couple of friends play a turn or two. Caught a different class of bug: rules that made *sense* on paper but broke against actual hands deciding things in real time.

**The printed artifact.** Rulebook into HTML, cards into HTML, all styled to print on home equipment. Quickstart for the first thirty minutes. Player reference card double-sided. Art commissioned for the box and the back of the cards.

**And then the narrative playtest.**

---

## What the narrative playtest is

The narrative playtest is the one I'd never seen written about anywhere, so I want to describe it carefully.

The pipeline above gets you to a printable prototype with verified math. What it does *not* get you is confidence that four humans, picking up the rulebook for the first time, will agree on what it says. The engine doesn't notice ambiguity. The engine encodes whichever interpretation I gave it. If I missed naming when Tier 2 cards enter the market, the engine just *does whatever I told it to do* — but the rulebook reader has no engine to consult.

The narrative playtest asks an AI to be the rulebook reader. Four of them, sitting at an imaginary table, reading the rulebook cold, playing turn by turn. Drawing real cards from a shuffled deck (I used a fixed RNG seed so the playthrough is reproducible). Maintaining state in plain Markdown files — the board, each player's resources, the questions they're raising.

Crucially: *every time a rule is unclear, they don't ask me.* They write it in `questions.md`, make a best guess, and keep playing. Just like a real table would. Then they hand me the notebook at the end.

The notebook from Tuesday's session is in my project folder. It has eleven real rulebook bugs and four resolved-by-reading items. The contents:

- A rule for when higher-tier cards enter the market that was implied but never stated.
- A confusion about whether starting techs are pulled from the deck or are separate copies.
- A subtle balance issue with one card's "applies to all players" effect that compounds into an obvious problem by Round 3.
- A definition of "sandbagging" that appears in two places with slightly different language — different enough that two rules lawyers would disagree.
- A rule for what Collaboration Hub contributions count as, that turns out to silently constrain the most natural beginner move.

Each of these is something a human playtest would catch — in arguments, in long pauses, in mid-game pizza orders while we Googled an answer. Each of these is something the engine would never catch, because the engine doesn't read the rulebook. It *is* the rulebook, in another form.

The narrative playtest tests the rulebook as a *text artifact intended for human consumption*. It's the only test that does.

---

## What this means for anyone making anything

I think this generalizes well beyond board games. Solo creators in any domain that produces a complex artifact intended for human use — software, methodologies, courses, manuals, even legal contracts — face the same last-mile problem. You can verify the artifact is internally consistent. You can verify it does the thing it's supposed to do. The expensive thing to verify is whether *another human* will read it and arrive at the right interpretation.

The classical answer to that has always been: get the human in the room. Beta readers. Playtesters. Pilot students. Pilot clients. They're scarce, their time is expensive, scheduling them is its own job, and the bugs they surface in any given session are limited by what came up in that session's specific path.

The narrative-playtest approach replaces the *first pass* of that loop with something near-free. An AI reading the artifact as a human would, surfacing the ambiguities, the contradictions, the silent assumptions, before any human has to. It doesn't replace the human pass — humans catch things AI doesn't, especially around emotional texture and lived experience. But the human pass becomes more valuable, because the easy bugs are already gone.

For my game, the next step is a real playtest with real humans. I expect them to catch a different class of issue: pacing, feel, when the game gets boring, where the survival pivot lands emotionally. I don't expect them to catch the ones I just fixed.

That's the point. The bugs they would have spent ninety minutes arguing about — those are off the board. The ninety minutes are now for what only they can do.

---

*The game is called Exodus Protocol. It's a few weeks from real playtest. If you'd like to be one of the humans at the table — or just want to see the rulebook for whatever you're making — I'm easy to find.*

*Juan Carlos Ghiringhelli writes about Generative Specification, the discipline that lets AI build complete systems from spec without humans reading every generated line. The board game is the same idea applied to a different artifact.*
