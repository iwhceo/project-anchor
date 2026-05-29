# Changelog

All notable changes to **project-anchor** are documented here. Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versioning follows [SemVer](https://semver.org/).

## How to update

```bash
# Pull latest marketplace metadata
/plugin marketplace update zefyr-anchor

# Apply update to installed plugin
/plugin update project-anchor
```

Claude Code checks installed marketplaces on session start and surfaces an "update available" hint when the remote `version` in `.claude-plugin/marketplace.json` is newer than the installed one tracked in `~/.claude/plugins/installed_plugins.json`.

---

## [0.2.0] - 2026-05-29

### Added
- `.claude-plugin/marketplace.json` — registers `zefyr-anchor` marketplace so the repo can be added via `/plugin marketplace add iwhceo/project-anchor`.
- `.claude-plugin/plugin.json` — declares `project-anchor` plugin with `skills: "./skills/"` and SessionStart/Stop hooks resolved via `${CLAUDE_PLUGIN_ROOT}`.
- Plugin-native install path: skills (anchor-core, anchor-init, anchor-dna, anchor-compressor, anchor-recall) are now discovered by Claude Code automatically when the plugin is installed — no manual copy to `~/.claude/skills/`.

### Changed
- Recommended install flow switches from `install.sh` (loose-skill copy) to `/plugin install project-anchor@zefyr-anchor` (marketplace registry).
- Hooks moved from absolute paths (`~/.claude/anchor/bin/`) to plugin-relative (`${CLAUDE_PLUGIN_ROOT}/hooks/`) — installation no longer mutates `~/.claude/settings.json`.

### Migration from 0.1.x
If you previously ran `install.sh`:
1. Remove duplicate skills: `rm -rf ~/.claude/skills/anchor-{core,init,dna,compressor,recall}`
2. Remove legacy hooks from `~/.claude/settings.json` (entries tagged `"_anchor": true`).
3. Install via marketplace (see "How to update" above).
4. Existing project memory in `~/.claude/anchor/<hash>/` is preserved and re-used by the plugin hooks.

---

## [0.1.0] - 2026-05-29

### Added
- Initial release. Five skills + CLI + SQLite-backed semantic recall.
- Loose-skill install via `install.sh` (deprecated in 0.2.0).
