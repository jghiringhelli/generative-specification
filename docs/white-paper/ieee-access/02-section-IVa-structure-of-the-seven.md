# §IV.A — Structure of the Seven (draft v0.1)

> Reviewer-safe framing: analysis of the seven properties only. No SAVED/decagon branding, no
> 0-100 tool (those are the follow-on paper). Prose avoids em-dashes/semicolons per house voice.

## IV.A. Structure of the Seven

The seven properties are not a flat checklist. Two observations about their structure carry most
of the discipline's explanatory weight, and we make them explicit here.

### The two most important are the activation pair

Of the seven, **Self-describing** and **Bounded** are primary, and the reason is mechanical rather
than stylistic. A large language model does not lack the knowledge to write correct code. Its
training already contains the formal tradition a correct implementation draws on, from Hoare logic
and type theory to design by contract, the SOLID principles, and common architectural patterns.
What the model lacks, at the moment of generation, is the instruction of which of that knowledge
to apply here. A specification that is **bounded** (each unit declares a narrow scope and loads
only its own slice of the system) and **self-describing** (each unit announces what it is and what
it is for) narrows the model to the most relevant region of what it already knows, rather than the
average of every similar project it has ever seen. The other five properties operate on top of this
activation. This is why a constraint, counter-intuitively, does not weaken the generator. It
selects the path the generator was already capable of taking and prunes the ones the specification
declares wrong.

### The two bridges: where the discipline puts the human

Building software has always required two translations, and separating them explains both where
Generative Specification is strong and why a human remains in the loop. The two translations are
crossings between three levels of the sign relation in Morris's sense [Morris, 1938]: **pragmatics**
(a situated intention, what a stakeholder actually means in context), **semantics** (a precise,
context-independent specification), and **syntax** (executable form in a particular language). The two
bridges are the two adjacent crossings, and naming them by *what they cross between* rather than by a
single endpoint is what locates the human precisely.

The **first bridge** (a **semantics-to-syntax** crossing), and the one engineering education teaches,
runs from a specification, expressed in human language, to executable code in a particular language with
particular tools. It is largely a matter of form, and it is the crossing an AI executor now performs
expertly. It is also
**asymmetric**. The model, like the human, is strong on the human-language shore and comparatively
weak on the raw-code shore, where a small slip is not a recoverable typo but broken output.
Generative Specification exploits the asymmetry by building on the strong shore, moving the weight of
the work from code to specification. That shift is the discipline's central lever.

The **second bridge** (a **pragmatics-to-semantics** crossing) is the one studied less, and often
crossed half-consciously. It runs from a partial intention to a specification. It is the crossing the
machine cannot make on its own, and the reason is exactly its pragmatic character: pragmatics is the
relation of signs to a situated agent with goals and context, so crossing it requires being a
stakeholder in the world, not processing signs about it. The need begins with a business, a stakeholder, or the
engineer, and is often not yet known precisely nor easy to express. Turning it into a correct and
complete specification is not a technical problem. It is a problem of understanding the domain, the
goal, and the reality the software must serve, and it is where the experienced engineer keeps and
increases their value. It is the resource no quantity of generation replaces: the criterion to
specify well.

Locating the two bridges this way also bounds the claim honestly. The discipline automates the
first bridge and strengthens the second, but it does not remove it. A human still ratifies that the
specification captures the intention.

### A note on the remaining properties

The five properties beyond the activation pair (Verifiable, Defended, Auditable, Composable,
Executable) can be read along a second axis, separating those that face the artifact's lifecycle
and the stakeholders who must inspect it over time from those that are internal invariants of its
construction. Further lifecycle-facing properties exist beyond these seven. Both the finer partition
and the additional properties are the subject of a companion treatment and are out of scope here,
where the seven suffice to support the derivability argument.
