# ProjectAnchor: Architecture and Design Rationale

<p align="center">
<img alt="The Party" src="../assets/sprites/party.png" width="720">
<br>
<em>A party of astronaut specialists. The Keeper (core) &middot; Pathfinder (init) &middot; Archivist (dna) &middot; Forgemaster (compressor) &middot; Seeker (recall)</em>
</p>

## 1. Manifesto

Coding assistants forget everything between sessions. They re-ask which framework you use. They re-derive the conventions you set yesterday. They invent answers to questions whose ground truth lives in a file three folders down. They burn tokens re-reading code that has not changed since last time. The result is a workflow that feels productive in the moment and quietly wastes a third of every session on context recovery.

ProjectAnchor is a small, local, opinionated answer to four specific failure modes:

- **Memory loss between sessions.** Every new session restarts from zero unless the user pastes a summary back in.
- **Context rot within a long session.** Past a certain length, attention degrades and answers become vague.
- **Hallucination on project facts.** When the assistant lacks ground truth, it fabricates plausibly.
- **Token waste.** Re-explaining what a project does costs thousands of tokens, paid every session.

The pack addresses all four with a single mechanism: a per-project memory directory under `~/.claude/anchor/<hash>/`, owned by the user, never sent to a cloud, injected at session start, compressed at session stop, and queryable on demand through five SKILL.md files plus a thin CLI.

## 2. Design principles

**Local-first.** All state lives on the user's machine. No telemetry. No opt-in remote sync in v1.0. The only network call at runtime is the one-time download of an ONNX embedding model from Hugging Face on first `recall`.

**Markdown as source of truth.** Project DNA, session summaries, lessons, and decisions are all plain `.md` files. They survive without the tool. They can be diffed, committed, copied, edited. The SQLite index is a derivable cache.

**Deterministic compression.** The session compressor uses regex and structural extraction, not an LLM call. The output is reproducible. The runtime cost is sub-second. The behavior does not drift between versions.

**Additivity.** The install merges into `~/.claude/settings.json` non-destructively. Existing hooks from other packs are preserved. Uninstall is surgical: only entries tagged with `_anchor: true` are removed.

**No magic.** Every action surfaces. Compression writes a visible file. Recall returns a path so the user can open the source. DNA updates require user confirmation. The pack refuses to fabricate.

## 3. Architecture

Three layers.

- **Skills.** Five `SKILL.md` files declare slash commands and routing rules. They are picked up by Claude Code's skill loader from `~/.claude/skills/`.
- **Hooks.** Two POSIX shell scripts wire the lifecycle: `session-start.sh` injects DNA and the last session summary into the new conversation's context; `session-stop.sh` triggers background compression of the just-finished session.
- **CLI.** A TypeScript binary (`project-anchor`) owns the heavy lifting: SQLite open, schema migration, embedding pipeline, recall scoring, install/uninstall, doctor.

The flow:

```
SessionStart hook -> read PROJECT_DNA.md + latest sessions/*.md -> emit on stdout
       |
       v
[Claude Code session runs]
       |
       v
Stop hook -> spawn `project-anchor compress` in background -> parse JSONL transcript ->
   extract files / decisions / blockers / next step -> write sessions/<ts>.md ->
   embed body -> insert into index.sqlite
```

## 4. The PROJECT_DNA pattern

`PROJECT_DNA.md` has six fixed sections, in this order:

1. **Purpose**
2. **Stack**
3. **Conventions**
4. **Decisions**
5. **People**
6. **Glossary**

These six were chosen because they answer the questions a new collaborator would have to ask, and none of them are derivable from reading the code alone. Code shows you what the stack is at the file level but not why it was chosen. Code shows you naming conventions but not the rationale behind them. Code does not name the humans on either side of a decision.

Anything that the code already documents is intentionally absent. The DNA should not duplicate the README. It should encode the *invisible* state of the project.

## 5. Compression algorithm

The compressor reads the JSONL transcript exposed by Claude Code at `$CLAUDE_TRANSCRIPT_PATH` and produces a markdown summary with five sections: Files toccati, Comandi shell, Decisioni, Blocker risolti, Next step. Plus a Lessons block that also gets appended to a project-wide `lessons.md`.

Extraction is regex-driven:

- **Files**: union of `path` arguments to `Edit`, `Write`, `Read`, `NotebookEdit`.
- **Commands**: `Bash` tool calls, minus a trivial-prefix denylist (`git status`, `ls`, `pwd`, `cd `, `cat `).
- **Decisions**: regex on phrases like "decido di", "scelgo", "vado con", "decided to".
- **Blockers**: regex on "fix:", "causa:", "root cause", "bug era".
- **Title**: first 80 characters of the first user message.
- **Next step**: last user message.

Hard targets: summary length under 500 tokens, hard cap 800, runtime under two seconds.

Why not an LLM-as-judge summary? Three reasons. Cost: a free local pipeline beats a paid remote one. Reproducibility: regex output is deterministic across runs. Latency: a second of CPU beats five seconds of network. The cost is precision; the gain is reliability.

## 6. Embedding choice

`Xenova/all-MiniLM-L6-v2`, 384 dimensions, ONNX format, served by `@xenova/transformers`. Around 25 MB. Lazy-downloaded on first `recall`, cached under `~/.claude/anchor/models/`. Cosine over Float32 buffers stored as SQLite BLOBs.

Why this model: small enough to download once and forget, strong enough for English-and-mixed-language semantic similarity over short to medium documents, no GPU required, no Python dependency. The pipeline is wrapped behind a one-method `Embedder` interface so the model can be swapped without touching `recall.ts`.

## 7. Comparison

Versus Claude's built-in memory features: those live in the vendor cloud, are scoped to claude.ai (not Claude Code), and the user does not own the persistence layer. ProjectAnchor lives on disk, works inside Claude Code, and is fully portable.

Versus Cursor rules: rules are static instructions the model receives every turn. ProjectAnchor is dynamic memory that grows from actual sessions, retrievable on demand. The two are complementary, not competing.

Versus Cline memory bank: similar spirit, different host (Cline runs inside VS Code). ProjectAnchor targets Claude Code CLI and uses a more aggressive compression target.

## 8. Limits and non-goals

In v1.0:

- No cloud sync, no team replication, no multi-user.
- No web dashboard (planned v1.1).
- No fine-tuning, no model training.
- No HNSW or sqlite-vec. Linear cosine over fewer than one thousand rows is fast enough.

## 9. Roadmap detail

- **v0.1.0**: skills, CLI, hooks, embeddings, recall, README, PAPER. Public on GitHub.
- **v0.2.0**: `project-anchor doctor` polish, FAQ expansion, contributor guide.
- **v1.0.0**: API freeze, semver guarantees, npm publish.
- **v1.1.0**: optional local web dashboard at `http://localhost:5050` via `project-anchor dashboard`.
- **v1.2.0**: `sqlite-vec` ANN index for projects above one thousand sessions.
- **v2.0.0**: optional team sync over a user-provided git remote.

## 10. Acknowledgements

ProjectAnchor is a personal contribution from DMUX, built on the shoulders of Claude Code's skill and hook system, the `@xenova/transformers` port of Hugging Face Transformers to JavaScript, and `better-sqlite3` for synchronous embedded SQLite.
