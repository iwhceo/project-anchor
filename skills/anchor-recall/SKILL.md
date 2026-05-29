---
name: anchor-recall
description: Use when the user asks "do you remember", "why did we", "what happened with", or invokes /recall or /lessons. Performs semantic search with FTS5 fallback over compressed sessions, lessons, and decisions.
---

# anchor-recall

Semantic and lexical recall over project memory.

## Commands
- `/recall <query>`: run `project-anchor recall <query>`. Present top hits with score, type, path, snippet.
- `/lessons [topic]`: filter to the lessons table. If no topic, list the ten most recent.

## Trigger patterns
Invoke when the user input matches:
- "do you remember..."
- "why did we..."
- "what happened with..."
- "ricordi..."
- "perche abbiamo..."
- "che cosa avevamo deciso su..."

## Output format

```
[0.82] decision  decisions.md#42
  JWT 24h scelto per UX
[0.71] session   sessions/2026-05-29-1255.md
  Aggiunta endpoint /api/users con auth Bearer
```

Always include the path so the user can open the source.

## Anti-hallucination
- Do not fabricate hits. If the CLI returns zero results, say so explicitly.
- Do not summarize across hits. Present them as a list, with the path of origin.
- If the user asks a factual project question and recall returns nothing relevant, say "I do not have memory of that" and offer `/anchor-init` or `/compress`.
