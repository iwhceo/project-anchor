---
name: anchor-dna
description: Use when the user wants to read, edit, or extend the Project DNA, invokes /project-status, /why, or /add-decision, or asks "why did we choose X" or "what is our convention for Y".
---

# anchor-dna

Read, edit, and diff the six DNA sections.

## Commands
- `/project-status`: run `project-anchor status` and present the JSON output. Include current Purpose and last three decisions.
- `/why <topic>`: search the `## Decisions` section in PROJECT_DNA.md first, then fall back to `project-anchor recall <topic>` filtered to type=decision. Always cite the file path of the source.
- `/add-decision <text>`: append a bullet under `## Decisions` in PROJECT_DNA.md. Ask for one-line rationale before writing.

## Update rules
- Never silently mutate PROJECT_DNA.md. Show the proposed diff first.
- Surface candidate updates extracted by anchor-compressor at SessionStart. Ask the user before promoting.
- Keep each section concise. Move long discussion into compressed sessions.
