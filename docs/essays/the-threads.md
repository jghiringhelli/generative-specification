# The Threads

*A personal account of how Generative Specification came together*

---

A friend from university called me one afternoon and told me to stop writing code the hard way.

He meant it practically. He had been experimenting with large language models and had noticed something: if you described *what* you wanted and *why* it mattered, the AI behaved like a collaborator. If you described *how* to build it, the AI behaved like a very fast typist. The difference was not subtle. One conversation gave you an advisor. The other gave you a keyboard that could autocomplete faster than you could type.

That conversation started something I did not know was going to take over the better part of a year.

---

## The First Question

The question I started with was naive in retrospect, which probably made it the right question.

*Can I get a complete, working program without writing a single line of code?*

Not "can AI assist me," not "can AI accelerate development" — those were the questions everyone was asking. I wanted to know if the line between describing what I wanted and having a machine that did it could be made so thin it disappeared.

The answer, it turned out, was: *sometimes, and the variance is enormous, and understanding the variance is the whole problem.*

Some sessions produced clean, working software from a paragraph of intent. Others produced plausible-looking code that collapsed the moment it touched real data. The difference did not seem to be the AI's capability — the same model, the same session length, wildly different quality. Something in the input was the variable.

I spent months trying to understand what that variable was.

---

## What I Already Knew

Somewhere in the middle of those experiments I realized I had been here before — not with AI, but with the disciplines I had learned over a decade of writing software professionally.

Domain-Driven Design. Test-Driven Development. Clean architecture. SOLID principles. The hexagonal pattern. These were things I had adopted not because anyone mandated them but because they made code that humans could read. Code that explained itself. Code where the logic was not buried under ceremony.

The irony arrived slowly: the same properties that made code readable to a human teammate six months later also made it work better as a specification for an AI today.

A well-named function that does one thing and declares its dependencies is not just easier for a colleague to review. It is a richer, more precise description of intent. A service layer that keeps business logic out of the database adapter is not just better architecture. It is a cleaner boundary for an AI to reason about. Test files that describe behavior rather than implementation are not just good practice. They are executable specifications.

The disciplines that were considered "too costly" for most projects — the ones that got deprioritized under deadline pressure, the ones you apologized for not implementing fully — were now cost-efficient. The cost of doing it right had collapsed. The benefit had not. It had grown.

This was not a philosophy. It was an economic fact.

---

## The Sentinel Documents

The second realization was about navigation.

AI assistants are remarkable at generating code but they begin each session without memory. Every token they receive is context they have to reason about. I found that how you structured the information you gave them — how you designed the *entry points* into the project — made as much difference as the content itself.

A flat README full of prose is a document written for a human to read linearly. It is a poor map for an AI that needs to navigate a codebase efficiently.

What worked better was a hierarchy of sentinel files. A root document that described what the project was and where the important things lived. Each important thing being a file that was complete and self-contained. Each file knowing its own scope.

This sounds like documentation. It is not quite documentation. It is more like the nervous system of the project — a structure designed so that any entry point leads efficiently to the relevant context, and no entry point requires reading everything to understand anything.

The analogy I kept returning to was a city with good transit. You do not need to understand the whole city to get where you are going. You need clear signs at the entry points and reliable connections between nodes.

---

## Correctness

Late in the year I encountered an old idea wearing new clothes.

The formal methods community had spent decades arguing that software should be *proven* correct, not just tested. Dijkstra. Hoare. The Curry-Howard correspondence — the deep structural equivalence between programs and proofs. Rust had taken this seriously and given us a type system that could reason about memory ownership at compile time. No garbage collector. No undefined behavior. The compiler as proof assistant.

The mainstream had treated formal methods as academic and Rust as a niche. The argument was always cost. Writing types that encode invariants takes time. Specifying pre- and postconditions takes time. Proving things is slow and expensive.

The same cost collapse that made clean architecture cheap made correctness cheap. An AI assistant does not experience annotation fatigue. It does not deprioritize invariants under deadline pressure. It does not make the judgment that "this function is simple enough not to need a contract." Given a specification that encodes what correct behavior looks like, an AI will satisfy it consistently. Not because it understands correctness, but because it is extraordinarily good at matching patterns — and a precisely specified system has patterns that can be matched.

The formal tradition had been waiting for an executor. The executor had arrived. The question was whether we would give it the right instructions.

---

## The Cockroach

There is a memory from school — I must have been eleven or twelve — a biology teacher explaining the nervous system of the cockroach.

A cockroach can survive with its head removed. It will live for days, walking, responding to stimuli, regulating its body temperature. It dies eventually of dehydration, not brain damage, because its brain was not running its survival functions. Those functions were distributed. Each segment of the thorax has its own ganglion, its own processing cluster, its own capacity for local response. The "brain" at the top coordinates but does not centralize. The system survives because no single point is the whole system.

I remember thinking this was the most interesting thing I had encountered in school. I did not know why it stuck. I could not have told you what it connected to.

Thirty years later I was designing an architecture and I understood what it connected to.

A software system built on Loom — the AI-native formal language that emerged from all of this — does not have a central processor in the traditional sense. The AI is the synthesis layer, the coordinator. But the *life* of the system is in the specification, the types, the contracts, the issue tracker, the deployment pipeline, the accumulated formal knowledge that the system carries in its structure. Remove the AI and the system is still there, specified, verifiable, deployable. Remove a component and the rest knows, because the types say what each component owes to every other.

The cockroach does not need its brain to keep walking. The system does not need the AI's presence to remain correct. The specification is the ganglion.

---

## Biological Isomorphisms

The cockroach memory was not the only thread.

The concept of autopoiesis — Maturana and Varela's formalization of what it means for a system to produce and maintain itself — had been in my reading for years without a home. A system is autopoietic if it continuously regenerates its own components through its own processes. A cell is autopoietic. An organization that reproduces its own structures can be autopoietic. A software system that monitors its own behavior, detects drift from specification, proposes corrections, and applies them through a governed pipeline approaches something like autopoiesis.

This was not metaphor. This was structural description.

The GitHub issue tracker receives inputs from the world — bug reports, performance observations, new requirements. The AI reasons about those inputs against the formal specification. The type checker enforces that proposed changes satisfy existing contracts. The CI pipeline verifies that behavior matches specification. The deployment process applies changes to the running system. The running system generates new observations. The cycle continues.

This is not a human organization operating software. This is a system that processes signals, reasons about them formally, and adjusts its own structure within governed constraints. It is something like alive — not in the way a bacterium is alive, but in the way a city is alive: continuously metabolizing, continuously maintaining itself, capable of growth and adaptation, dying only when its substrate disappears.

The substrate is servers and networks. The soma, in neuroscience, is the cell body — the part of a neuron that all the dendrites feed into and all the axons fire out of. I named the coordination hub for this ecosystem *Soma* because that is what it is: the integration point where all the signals converge before the responses fire.

---

## What I Did Not Design

I want to be careful about one thing.

None of this was designed. I did not sit down with a theory and build toward it. I sat down with a question — *can I get a working program from intent alone?* — and followed the problem wherever it went.

The childhood memory of the cockroach ganglion did not become relevant because I was looking for biological analogies. It became relevant because I built something and then recognized what I had built. The recognition arrived after the construction, not before.

This is probably how most synthesis works. You accumulate the fragments without knowing what they will become. Some of them stick — the cockroach, the autopoiesis paper, the Rust type system, the DDD book with the bent spine — and you cannot say exactly why they stick. Then something creates the conditions for them to connect, and when they connect you experience it as discovery rather than invention.

I discovered this. I did not invent it. It was already there in the relationship between formal methods and execution, between specification and correctness, between distributed systems and distributed nervous systems. The connection was waiting.

What the AI gave me was the executor that made the connection visible. Without a system that could actually satisfy formal specifications at low cost, the connection was theoretical. With that system, it became practical. The theory became an engineering discipline.

---

## A Word About the Creative State

I am writing this in the middle of what I can only describe as a sustained period of clarity.

Several days now. The connections keep arriving. Old readings surface with new relevance. Something I learned about Byzantine fault tolerance in a distributed systems course appears at the edge of a thought about consensus mechanisms in biological neural networks. A footnote I read about Peirce's semiotics is suddenly about how specifications carry meaning across execution environments.

I do not know how long this lasts. I know from experience that it does not last forever, and that what you capture during it is qualitatively different from what you can reconstruct after it. So I am writing now.

There is a risk in writing from this state: the connections feel more certain than they are. The synthesis feels complete when it may still have gaps. I have tried to be honest about what is established (the cost collapse, the sentinel document structure, the formal methods connection) and what is hypothetical (the full biological isomorphisms, the self-sustaining system, the long-term viability of Loom).

The hypothetical parts are not less important. They are the direction. They are where this goes if the empirical foundation holds. The April 10 experiment will test part of that foundation. The rest will take longer.

---

## The Thread

If there is a single thread that runs through all of this — from the first conversation with my university friend to the biological isomorphisms — it is this:

*The cost of doing something right has changed. The benefit has not.*

The disciplines were always correct. DDD, TDD, formal methods, clean architecture: these were not wrong when developers chose not to use them fully. They were too expensive given the cost of the executor. A human developer has limited hours. Those hours spent on annotation, on invariant specification, on formal verification, were hours not spent on features.

The executor is now cheaper. It does not get tired. It does not experience annotation fatigue. It does not make the pragmatic decision to skip the contract because the sprint ends Friday. Given the right specification, it does the right thing. Given an incomplete specification, it does the average thing — the statistical middle of everything it trained on, which is human code with all the shortcuts humans take.

The specification is the constraint. The constraint is not a limitation. It is the thing that makes the system better than the average.

Everything else followed from that.

---

*Juan Carlos Ghiringhelli*
*April 2026*
