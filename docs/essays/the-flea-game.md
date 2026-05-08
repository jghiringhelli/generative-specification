# The Flea Game

*Originally published on Substack.*

---

I built a flea game for my daughter. The game was her idea, the implementation was mine.

The game is this: a dog is sitting on the floor. Fleas are moving through its fur. The player has three tools. Tweezers — precise, one flea at a time; miss, and the flea scatters, pulling nearby fleas with it. A comb — sweep a straight line through the fur and catch everything in its path, but only straight, only so many at once. A spray — freeze the fleas temporarily, create a window to work. Each scenario: more fleas, darker fur, faster movement. The game escalates in difficulty.

It took a few hours of the weekend. It might never be seen by anyone outside the family.

Now ask yourself: should this program be correct?

Not "good enough." Not "works on my machine." Correct. Free of state corruption when a frozen flea's timer expires mid-sweep. Free of race conditions when the scatter effect fires while the comb is still resolving. Free of invalid transitions when the pause button is pressed during the frame a flea is caught.

The answer, for most of the history of software, was: *of course not. That's for pacemakers, ATMs and aircraft. This is a flea game.*

That was a reasonable answer. It was also a choice that shaped everything that followed.

---

## The Agreement Nobody Made

There is a body of work — built over roughly 2,376 years, from Aristotle's logic through to the formal methods community of the late twentieth century — that tells you exactly how to make programs correct. Not probably correct. Not correct for the test cases you thought of. Provably, structurally, mathematically correct.

Tony Hoare gave us contracts: preconditions, postconditions, invariants. If you state what must be true before a function runs and what must be true after, the machine can check whether the implementation honors those promises.

Robin Milner gave us types that prevent whole categories of error from existing. Not catching them — preventing them. A well-typed program cannot have certain bugs. Not in the way a tested program has fewer bugs. In the way a circle cannot have corners.

Naoki Honda gave us session types: protocols that guarantee two communicating processes will always be in compatible states. No deadlock. No protocol violation. Not as a property to be tested but as a structural guarantee.

Jean-Yves Girard gave us linear types: the ability to say that a resource must be used exactly once — not zero times, not twice, once. A ticket that cannot be duplicated. A payment that cannot be reversed after it clears.

Dorothy Denning gave us information flow analysis: the ability to prove that sensitive data can only travel along permitted paths. Not by checking every line of code for leaks but by making unauthorized flows structurally impossible to express.

Every one of these tools was a genuine breakthrough. And none of them ever reached the flea game.

Because deploying them required the engineer to have read the papers. To understand the type theory. To annotate the code with the right labels in the right places. To maintain those annotations as the code evolved. The annotation burden was not recoverable at human scale. A weekend project could not absorb the cost of a graduate education in formal methods.

So a global decision was made — not in any meeting, not by any committee, not consciously — that formal correctness would be reserved for systems where lives were at stake. Everything else would ship on convention and hope.

That decision is now over.

---

## What Changed

The AI assistant has read the papers.

Not metaphorically. These systems trained on the formal methods literature, on every implementation of Hoare logic and linear types and session type theory ever published. They have internalized the patterns well enough to apply them correctly to new situations.

What they are missing is not the theory. They have the theory.

What they are missing is *your system*. They do not know what a flea is in your program. They do not know what frozen means in your animation model, what scatter means in your physics engine, what the comb's line constraint means for your hit-detection. Every session starts from scratch. The theory is universal; your system is not.

Generative Specification is the bridge.

Write a specification — a precise description of what your system must be. What a flea is. What frozen means. What the game must never allow, and what it must always guarantee. Not code. Not implementation. The territory, named precisely.

The AI reads that specification at the start of every session. It holds the theory. You hold the domain knowledge. The specification is the handshake between them.

When you specify that the game session has exactly five valid states — menu, scenario select, playing, paused, and ended — and that the transition from playing to ended can only happen through catching all fleas or expiring the timer, the AI does not just write a switch statement. It builds a declarative state machine with typed transitions and no reachable invalid state. In TypeScript, the machine refuses to process an undefined event — invalid transitions are practically impossible. In Rust, with Honda's session types, they would be formally impossible: the compiler refuses to compile the invalid transition. The specification is the same. The formal weight behind it scales with the language.

When you specify that a frozen flea carries an expiry timestamp and must transition back to active exactly once, the AI builds a component with a countdown the system removes when it expires. In TypeScript, this is a convention: a dedicated system decrements the timer, removes the component, and a test suite verifies it happens exactly once. In Rust, the same specification produces Girard's linear type: the compiler enforces that the resource is consumed exactly once, not by convention but by the type system. You named the constraint. The language determines how strictly it is held.

When you specify that a miss with tweezers triggers a scatter effect that moves nearby fleas to new positions, and that the first miss in the tutorial scenario does not trigger scatter, the AI builds a system that checks those preconditions before acting and produces a bounded, deterministic outcome. In TypeScript, a test verifies the postcondition holds. In Rust, the same specification lets you formally annotate the postcondition — what Hoare formalized — and have it verified. You did not need to know these names. You named the territory. The AI built structures that express the same guarantees those theories formalize. The language determines how strictly they hold.

---

## What This Means

The flea game was built in a few hours. Under Generative Specification discipline — a specification written before a line of code, behavioral contracts for every tool and state transition, a test harness derived from those contracts and running against the live game. The specification took longer to write than the code took to generate, and even that was assisted by the AI.

That is not a boast about AI speed. It is a claim about where the work went. The specification carries the complexity now. The implementation follows from it.

There is no minimum project size for correctness anymore. The inventory tool for a small shop. The scheduling script for a weekend sports league. The game an engineer builds for her daughter on a Saturday afternoon. All of them can now have the structural guarantees that were previously reserved for systems where people would die if they failed.

This is not a claim about AI being magical. It is a claim about where the cost went. The annotation burden — the thing that made formal methods inaccessible at human scale — was the cost of *learning the theory and applying it correctly by hand*. That cost has moved. The AI carries the theory. The practitioner carries the domain. The specification connects them.

The deal that software engineering made — correctness for important things, convention and hope for everything else — was made because the alternative was too expensive. The alternative is no longer expensive.

---

## The Practitioner Who Doesn't Know She Is One

There is a second thing the flea game story reveals.

I wasn't thinking about formal methods when I was building it. I was thinking about what the game should do. My daughter wasn't thinking about formal methods when she described it. She was thinking about what would be fun. What she gave me was a spec: dog, grass, fleas, three tools with distinct constraints, escalating scenarios. The naming of the territory. That is all GS requires.

That clarity — the ability to say precisely what a system must be — is the only skill that the new model requires. Not Hoare. Not Milner. Not Honda or Girard or Denning. The ability to name the territory.

That is a human skill. It always was. The reason it was not sufficient before was that between naming the territory and building the system, there was a vast mechanical layer that required specialized training to cross. That layer has been crossed. The naming is what matters.

The formal tradition spent 2,376 years building the machinery that sits on the other side of the specification. All of it waiting for a practitioner who could describe what she wanted clearly enough for the machinery to engage.

The same principle — that naming the territory precisely is sufficient for the machinery to engage — turns out to apply beyond correctness. It applies to maintainability, to reviewability, to the ability to change a system without breaking what it promised. That is a different essay.

The flea game is enough.

---

*Generative Specification is a discipline for building software with AI assistance that produces consistent, auditable, formally grounded results. The white paper, the tools, and the practitioner study are at [forgeworkshop.dev](https://forgeworkshop.dev). The flea game is at [github.com/jghiringhelli/flea-picker](https://github.com/jghiringhelli/flea-picker) — built under this discipline, playable at [jghiringhelli.github.io/flea-picker](https://jghiringhelli.github.io/flea-picker).*
