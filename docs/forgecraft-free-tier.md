# ForgeCraft — Free Tier and Contribution Model

**Document type:** Design decision  
**Status:** Final — March 2026  
**Applies to:** ForgeCraft 1.0 (hosted MCP server)

---

## What ForgeCraft Is

ForgeCraft 1.0 is a hosted MCP server. Users connect to it from their AI assistant:

```
MCP server URL: https://api.forgecraft.dev/mcp
Authentication: API key tied to account tier
```

It is not a public repository. The quality intelligence (tag system, gate library, feedback loop) is the hosted service. The quality gate *definitions* are in the public [`generative-specification`](https://github.com/jghiringhelli/generative-specification) community repo.

---

## Tier Model

### Free tier

- **2 active projects** (not a monthly quota — 2 concurrent active; pause and resume freely)
- Full access to all 7 GS properties and all community quality gates
- All `setup_project`, `refresh_project`, `audit_project`, `scaffold_project`, `review_project` commands
- No rate limit on operations within active projects
- PR contribution credits apply (see below)

**This is permanent and unconditional.** Individual contributors should never need to pay.

### Pro tier

- Unlimited active projects
- Priority MCP response time
- Team project sharing
- Custom gate library (private quality gates not visible to community)
- Priority support

### Company trigger

Upgrade to Pro is prompted (not enforced) when:
- An organization or team account is detected (GitHub org usage)
- More than 2 people are using the same API key from different machines
- A project is committed to an organization-owned repo

Individual contributors working on personal or open-source projects are never prompted.

---

## Contribution Credit

Merged pull requests to [`generative-specification/quality-gates/`](https://github.com/jghiringhelli/generative-specification/tree/main/quality-gates/gates) are rewarded:

| Contribution | Reward |
|---|---|
| New gate merged | +1 active project slot (permanent) |
| Gate supersedes another (improves coverage) | +30 days Pro |
| Gate split or merge (structural improvement) | +30 days Pro |
| Open review feedback incorporated into white paper | Community credit in paper acknowledgments |

Credits accumulate. A contributor with 5 merged gates has 7 active projects (2 base + 5).

---

## The Free Tier Philosophy

The individual contributor who wants to escape the rat race, build their thing, and ship something real is the target user for the free tier. They are also the source of the best quality gates — they are the ones exploring edge cases at the frontier of new tech stacks, unusual architectures, and uncommon workflows.

The flywheel works because:
1. Individual contributor uses ForgeCraft free
2. Discovers a quality gate that matters for their stack
3. Contributes it to the community
4. ForgeCraft absorbs it on the next refresh
5. Every project in that stack gets better
6. Individual contributor gets a credit

Companies benefit from this flywheel. They pay for the scale, the team features, and the private gates. The free tier is not a loss leader — it is the input mechanism for the quality gate corpus.

---

## Expected Leakage

Individual contributors will use ForgeCraft on work projects. This is expected and acceptable. They become internal champions who then request company accounts when they need team sharing or private gates. It is not a policy problem to solve — it is the intended adoption path.

---

## Versioning

| Version | What Changed |
|---|---|
| ForgeCraft 0.51 | Production use during Ax experiment |
| ForgeCraft 0.9 | GS paper structured, quality gate schema defined |
| **ForgeCraft 1.0** | Quality gate library externalized to community repo (this document) |

ForgeCraft 1.0 is the milestone where the quality intelligence is no longer proprietary by accident (kept internal because there was nowhere public to put it). The `generative-specification` repo is that public home.
