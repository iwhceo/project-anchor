---
name: anchor-compressor
description: Use when the user invokes /compress, /summarize-session, or /checkpoint, or asks for a session summary, or the session has grown long and quality is degrading. Runs deterministic extraction over the current transcript and writes a structured summary.
---

# anchor-compressor

Deterministic session compression. Same pipeline at Stop (auto) and mid-session (manual via `/compress` or `/checkpoint`).

## When to invoke proactively (anti-rot)
Recommend `/checkpoint` to the user when any of these holds:
- The session has touched more than ten distinct files.
- The conversation passes about fifty exchanges.
- The user reports that answers are getting vague or repetitive.
- The next task is logically distinct from what was being worked on so far.

## Pipeline
1. Parse the JSONL transcript at `$CLAUDE_TRANSCRIPT_PATH`.
2. Extract files touched, non-trivial shell commands, decisions, resolved blockers, next step.
3. Title is the first 80 characters of the first user message.
4. Render to `sessions/YYYY-MM-DD-HHMM.md` with frontmatter.
5. Embed and index in `~/.claude/anchor/<hash>/index.sqlite`.
6. Append lessons to `lessons.md`.

## Commands
- `/compress`: force compression now.
- `/summarize-session`: same as /compress, also prints the resulting markdown.
- `/checkpoint`: compress now and print DNA + the new summary back. Lets the assistant restart fresh from a clean context with the same project knowledge.

## Targets
- Summary length under 500 tokens, hard cap 800.
- Runtime under two seconds.

## Anti-patterns
- No LLM-as-judge. Extraction is regex and structural.
- Do not modify PROJECT_DNA.md from the compressor. Surface candidates only.
