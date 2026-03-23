---
layout: default
title: Workflow Recipes
nav_order: 4
has_children: true
description: "Step-by-step ForgeCraft workflow recipes for common project scenarios"
---

# Workflow Recipes

These recipes are the practitioner interface to GS methodology. Each recipe covers one common scenario from start to working code, with exact ForgeCraft tool calls at each step.

Every recipe follows the same three-loop rhythm:

```
Loop 1: spec → scaffold → initial tests
Loop 2: cascade check → implement → pass tests
Loop 3: hardening → Playwright smoke → close cycle
```

The ForgeCraft MCP tool is `forgecraft_actions`. All recipes use it as:
```
forgecraft_actions({ action: "<action>", project_dir: "/path/to/project" })
```

---

## Available Recipes

| Scenario | Description |
|---|---|
| [New project with spec](new-project-with-spec/) | You have requirements. Start from a GS document. |
| [New project without spec](new-project-no-spec/) | You have an idea but no document. ForgeCraft generates the spec. |
| [Post-setup first cycle](post-setup-first-cycle/) | The project was just set up. Run the first full GS loop. |
| [Brownfield: new feature](brownfield-new-feature/) | Existing ForgeCraft project. Add a feature the GS way. |
| [Bug fix](bug-fix/) | Production bug. Fix it without breaking the GS contract. |
| [Migration](migration/) | Upgrade a dependency or change infrastructure. |
| [Project takeover](project-takeover/) | Inheriting a codebase. Apply GS retroactively. |
| [Post-hardening](post-hardening/) | After hardening cycle. Prepare for release or deploy. |

---

## Prerequisite

ForgeCraft is available as a managed service at [forgecraft.dev](https://forgecraft.dev). An API key is required — see the site for tier options.

Once you have an API key, add to your Claude Desktop or Copilot CLI MCP config:

```json
{
  "forgecraft": {
    "command": "forgecraft-mcp",
    "env": {
      "FORGECRAFT_API_KEY": "your-api-key-here"
    }
  }
}
```

After initial project setup, you can disable the MCP tool until you need a refresh — it's most useful during setup, loop transitions, and before hardening.
