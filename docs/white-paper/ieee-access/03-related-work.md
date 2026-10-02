# §II — Related Work (draft v0.2)

> Positioning: IEEE Access gates on distinctness and soundness, not novelty. This section credits each lineage and names what GS adds and what it does not. Citations [n] resolve against `04-references.md` (all verified 2026-10-01); renumber by first citation at assembly. Plain academic register, no em-dashes.

## II. BACKGROUND AND RELATED WORK

Generative Specification (GS) draws on eight bodies of work. For each we state what it contributes and where it stops, so that the distinct part of the proposal is visible and the borrowed part is credited.

### A. Disciplines as removals of freedom, and the structural disciplines

Structured programming removed unrestricted jumps [1], and later disciplines removed unrestricted access to internal data and unrestricted reassignment; we use R. C. Martin's account of this pattern [13]. The structural disciplines that GS forces are older still: SOLID, clean code, test-driven development and domain-driven design [14]-[17], information hiding [3], and the documentation of decisions [12]. GS invents none of them. Its claim is a change of beneficiary: they were built for a human next reader, and GS asks whether a reader that has no memory and cannot ask can derive correct output from their products. We use the word discipline in Martin's sense only and make no claim about paradigms in Kuhn's sense.

### B. Specification theory, contracts and traceability

Hoare's axiomatic basis [2], Parnas's module specifications [3], [4], Meyer's design by contract [5] and Jackson's problem frames [7] established that behavior can be specified at a boundary and that a specification must close the space the implementation would otherwise fill. Requirements traceability [11] studies how intent stays linked to artifacts. Brooks's distinction between essential and accidental difficulty [6] frames why specification, not typing, is the hard part. GS inherits all of this and adds one condition: the reader is stateless. The nearest relatives of the lock and the co-change gate (Section IV) are traceability and consistency checking, which have a long literature of which we cite only the foundation [11]; we make no claim that the mechanisms are new, and they are presented as a design with no measured effect.

### C. Architectural erosion and software evolution

Perry and Wolf named architectural drift and erosion [8], Lehman's laws state that complexity grows unless work is done to reduce it [10], and de Silva and Balasubramaniam survey erosion control [9]. GS applies this vocabulary to a new mechanism of erosion: a reader that completes every gap at generation speed from its prior. Recent empirical work measures that erosion in agent output directly. SlopCodeBench [25] has agents extend their own earlier solutions over many checkpoints and reports that no agent solves any problem end to end, that structural erosion and verbosity rise in most trajectories, and that quality guidance reduces them by up to a third without removing them. Large-scale studies of AI-generated code in the wild report accumulating quality and security issues [30], [31]. These works measure the problem. None tests a persistent specification substrate as the remedy, and SlopCodeBench is not evidence for GS.

### D. Spec-driven development: tools, practice and research

Kiro and GitHub Spec Kit structure agent work as requirements, design and tasks documents [41], [42], and Piskala describes tiers of specification rigor for AI coding assistants [40]. The closest empirical competitor is traceSDD [39], a spec-driven framework that requires a per-line requirement citation in generated code and is evaluated across models against Spec Kit and OpenSpec. These supply a place and a workflow for specifications and, in traceSDD's case, a checkable citation discipline. GS is distinct in making derivability by a stateless reader the organizing criterion for what a specification must contain, in adding a graded instrument for whether it does, and in measuring a structured specification against both no structure and an expert prompt. GS is not distinct in the idea that specifications should come first, which predates AI by decades, and we do not claim it outperforms these tools: none of them is a comparator in our study.

### E. Agent context files, context engineering and harnesses

Practitioners now carry intent in instruction files read at session start. Chatlatanagulchai et al. study thousands of such files across repositories [36]; Galster et al. study the configuration mechanisms agentic coding tools expose [38]; Gloaguen et al. evaluate whether repository-level context files help coding agents and report no general gain in task success and more than 20% higher inference cost [37]. Context engineering is surveyed in [33] and described for practitioners in [34]. Böckeler divides an agent's harness into guides (feedforward) and sensors (feedback), each computational or inferential [35]. GS's sentinel, specifications and instruction files are guides in that sense, and its gates and tests are sensors; we adopt her terms and do not claim the verify half of GS is distinct from harness engineering. What GS adds is a criterion for the content of the guides and a measurement of the result. Two of our findings bear directly on [37]: a strong expert prompt ties the full cascade on single-shot quality, and the cascade costs more per generation, which is consistent in direction with their cost finding. Whether a persistent, enforced substrate pays over a long horizon, which is the only place it could be expected to, is untested here (Section VIII.B).

### F. Code-generation evaluation, prompting and retrieval

HumanEval [21], EvalPlus [22], SWE-bench [23] and SWE-agent [24] establish that models and agents can resolve real tasks and how to measure it. Few-shot and chain-of-thought prompting [26], [27] improve output by shaping the input, and retrieval-augmented generation [28] grounds it in retrieved text; long contexts are used unevenly [29]. Closed-loop verification with specifications has been explored for code generation [32]. GS is orthogonal to executor capability. Where retrieval-augmented generation infers retrieval structure, GS authors it, and the KX study replicates the method of a compact-knowledge-graph benchmark [43] on a software harness. We treat prompt techniques as compensations for constraints not yet written down and, because an effective prompt contains specification content, we do not claim a specification makes prompting unnecessary.

### G. Benchmark contamination

Contamination and memorization threaten any benchmark that appears in public training data [44], [45]. The RealWorld "Conduit" application used in most of our experiments exists in many public implementations [46], so memorization cannot be ruled out for those results. We address it only partly, with a study on an invented domain with no public implementation (Section VI), and we carry the threat explicitly (Section VII).

### H. Empirical method for studies with LLMs

We follow the threat categories of Wohlin et al. [47], the reporting guidance of Kitchenham et al. [48] and the guidelines for empirical studies involving LLMs [49]. Statistical practice follows accepted work in this venue and area [50]: exact Mann-Whitney tests [51] with Cliff's delta [52], quadratic-weighted kappa [53] interpreted with the conventional bands [54], and mutation testing as a fault-detection construct whose validity is itself studied [55].

### I. The distinct part, and what is not claimed

Across these bodies of work, the stateless reader as a design constraint on the specification, a seven-property instrument for whether a specification meets it, and a measured comparison against both unstructured use and an expert prompt are, to our knowledge, not combined elsewhere. We do not claim new properties, new mechanisms for any single one of them, superiority over spec-driven tools, or that the specification substrate beats a prompt that carries the same content. The measured result is narrower than the framing: authored structure of either kind beats unstructured use on structural metrics, across vendors, and the expert prompt ties GS on single-shot quality.
