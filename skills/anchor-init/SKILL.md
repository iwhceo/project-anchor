---
name: anchor-init
description: Use when the user wants to bootstrap project memory for the first time, invokes /anchor-init, or asks "set up memory for this project". Walks the user through six guided questions and writes PROJECT_DNA.md.
---

# anchor-init

Guided initialization for ProjectAnchor on a new project.

## Workflow
Ask one question per turn. Wait for the answer. Move to the next.

1. **Purpose.** What is this project, who does it serve, what does success look like?
2. **Stack.** Languages, frameworks, infrastructure, key libraries.
3. **Conventions.** Coding style, file layout, testing patterns, naming.
4. **Decisions.** Two or three load-bearing architectural choices already made, with the reason for each.
5. **People.** Owners, reviewers, stakeholders, channels of contact.
6. **Glossary.** Domain-specific terms a newcomer would not know.

After the sixth answer, call `project-anchor init` and write the result to `~/.claude/anchor/<hash>/PROJECT_DNA.md`. Seed the database schema.

## Output
Confirm: "Project DNA written. From the next session, ProjectAnchor will auto-load this memory."

## Anti-patterns
- Do not ask all six questions at once.
- Do not invent answers. If the user says "skip", store an empty section and move on.
- Do not write PROJECT_DNA.md before all six answers are collected.
