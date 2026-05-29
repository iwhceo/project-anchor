# Contributing to ProjectAnchor

Thanks for considering a contribution.

## Setup

```bash
git clone https://github.com/iwhceo/project-anchor
cd project-anchor
npm install
npm test
```

## Architecture in one paragraph

Five `SKILL.md` files under `skills/`, two POSIX shell hooks under `hooks/`, and a TypeScript CLI under `runtime/src/`. Storage is per-project under `~/.claude/anchor/<hash>/`, with SQLite holding compressed session summaries and ONNX embeddings.

## How to add a new skill

1. Create `skills/<name>/SKILL.md` with YAML frontmatter (`name`, `description`).
2. Add slash commands to the description if any.
3. Update README "What's inside".
4. Open a PR.

## How to extend the CLI

1. Add a module under `runtime/src/`.
2. Wire the command in `runtime/src/cli.ts`.
3. Run `npm run build` to verify it compiles.

## Code style

- TypeScript strict mode. No `any` in public signatures.
- One responsibility per file. Split when a file passes 300 lines.
- Tests with `vitest`.

## Commit style

`<type>(<scope>): <subject>`. Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`.

## PR checklist

- [ ] Tests pass: `npm test`
- [ ] No new `any` in public types
- [ ] README updated if user-visible change
