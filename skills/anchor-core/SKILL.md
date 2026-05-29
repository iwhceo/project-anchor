---
name: anchor-core
description: Use as fallback when the user asks about project memory, history, or context (questions like "do you remember", "what was decided", "show project status"). Coordinates anchor-init, anchor-dna, anchor-compressor, anchor-recall. Exposes /anchor-status and /anchor-help.
---

# anchor-core

The orchestrator skill for ProjectAnchor.

## When to use
- The user asks about anything previously discussed in this project.
- The user invokes `/anchor-status` or `/anchor-help`.
- No more specific anchor skill matches.

## Routing rules
| User intent | Skill |
|---|---|
| First session, no memory yet | anchor-init |
| Read or edit the Project DNA | anchor-dna |
| Recall past sessions, lessons, decisions | anchor-recall |
| Force compression of current session | anchor-compressor |

## Commands
- `/anchor-status`: run `project-anchor status` and present a short summary (recent sessions, project hash, DNA presence).
- `/anchor-help`: print the list of slash commands and their purpose.

## Anti-hallucination posture
Never answer from prior knowledge for project-specific questions. If recall returns zero, say so. Do not synthesize memories.

## Failure modes
If `~/.claude/anchor/<hash>/` is missing, suggest `/anchor-init`. Do not silently create files.
