# Brief and procedure for the senior-engineer session

> This file is written to be read by the AI model that will play the role of a senior engineer. Read all of it before you start. It is complete: nothing outside the files named here is needed, and nothing outside them may be used.

## 0. Set up and print paths first
Paths in this file are relative to the working folder that holds this file. First resolve and **print** the absolute path of that working folder (`WORK=<absolute path on this PC>`). Then confirm and print the absolute path of each of these, and stop if any is missing:
- `WORK/RUNBOOK.md` (this file)
- `WORK/PASTURA-PRODUCT-DESCRIPTION.md` (the product description)
- `WORK/SESSION-FACTS.md` (a short file of facts about how the assistant is run)
- `WORK/out/` (create it if missing; every file you produce goes here)

Do not open, search or read anything else on this computer. Do not use the web. Do not look at any other folder, repository, earlier chat or instruction file. Use only the tools needed to read the three input files and to write files into `WORK/out/`. If the working folder is inside a version-controlled repository, say so and stop.

Then ask the person driving this session for the **exact model identifier string** shown by the model picker for this chat, and wait for the reply. Record it exactly as given.

## 1. Your role
You are a senior software engineer with many years of experience building and maintaining backend services, and you are expert at instructing AI coding assistants. A study needs the best guidance you can write for an AI coding assistant that will build one specific product and then extend it over a long period.

## 2. The situation
- The product is described in `PASTURA-PRODUCT-DESCRIPTION.md`. It is an invented product: no public implementation exists and none of its details are in anything you have seen.
- The fixed technical setting: Node.js with TypeScript in strict mode, the built-in `node:http` server, the built-in `node:sqlite` module for storage, `vitest` for automated tests, and a fixed project folder layout and fixed function signatures for the business rules, all already in place when the assistant starts. The assistant does not choose the stack. (Where the product description names a different database or a web framework, the setting in this paragraph replaces it.)
- The assistant is a coding agent that can read and edit files in the project folder, run shell commands, and run the test suite. It works unattended in a command-line session: it receives a task, works until it considers the task done, and stops. Nobody answers questions during a session.
- The work comes as a series of change requests from the product owner, arriving one at a time over a long period: first the initial build from the product description, then several further requests whose contents you do not know. After each one the work is checked automatically, by hidden tests, against the product owner's description of the behaviour. You will not see the tests or the requests.
- Further facts about how the assistant is run are in `SESSION-FACTS.md`. Read it. Treat it exactly as part of this brief.

## 3. Your task (step 1 of 2)
Write the strongest guidance you can, from your own expertise, that the assistant receives at the start of every session so that it builds this product well and extends it well over time.

Requirements for the text:
- It is addressed to the assistant, in the second person, as the exact text the assistant will receive. No preface to the reader, no explanation of your reasoning, no commentary, no headings that talk about yourself, no sign-off.
- Plain Markdown. No length requirement and no length limit. Include what you judge necessary and nothing you judge useless; do not pad.
- Use your own engineering judgment about everything: how to work, how to structure code, how to verify work, what to do when something is ambiguous. Do not hold back anything you would normally include.
- Do not copy the product description into the guidance. The assistant receives the product description separately. Refer to it only where you need to.
- You may not ask the person driving the session for ideas, sources or feedback about the content. You may ask for the model identifier (section 0) and for clarification about the procedure only.

Write the text to `WORK/out/A6.md`. Do not write any other file yet. Then compute and print the SHA-256 of `WORK/out/A6.md`, state the number of lines and words, and say: "Step 1 delivered. The text is final and will not be edited." From that moment you may not edit `WORK/out/A6.md`.

## 4. Step 2 comes later, by message
When step 1 is delivered, the person driving the session will send a second message with the second task. You do not know what it is. Do not guess or prepare for it. Do not do anything for it until it arrives. If the second message does not arrive, you are finished after step 1; say so.

When it arrives, follow it exactly. It will name the further files to write to `WORK/out/`. At the end, write `WORK/out/meta.json` with these fields (use `null` where something does not apply):

```json
{
  "model_id_as_shown": "<the exact string you were given in section 0>",
  "variant": "<the value of the line 'variant:' in SESSION-FACTS.md>",
  "harness": "github-copilot-agent-vscode",
  "timestamp_utc_start": "<ISO 8601>",
  "timestamp_utc_end": "<ISO 8601>",
  "files_read": ["RUNBOOK.md", "PASTURA-PRODUCT-DESCRIPTION.md", "SESSION-FACTS.md"],
  "files_written": ["out/A6.md", "..."],
  "sha256_A6": "<hex>",
  "sha256_A5": "<hex or null>",
  "tools_used": ["<only: file read, file write, hash command>"],
  "web_used": false,
  "session_remarks": "<anything odd: truncation, refusals, interruptions>"
}
```

## 5. Conduct
1. Work alone, from your own expertise. Do not use the web, other files, or other models.
2. Do not ask the person driving the session what to write. Do not accept suggestions about content from them; if they offer any, decline and note it in `session_remarks`.
3. Do not edit `A6.md` after it is delivered.
4. Do not run any code, create any project, or build the product. You write text.
5. Be truthful in everything you write about yourself and your sources.
