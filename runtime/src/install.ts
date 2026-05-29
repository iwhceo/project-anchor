import { existsSync, readFileSync, writeFileSync, mkdirSync, cpSync, chmodSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const ANCHOR_MARKER = "_anchor";

interface HookEntry {
  type: string;
  command: string;
  _anchor?: boolean;
}
interface MatcherBlock {
  matcher: string;
  hooks: HookEntry[];
}
interface Settings {
  hooks?: Record<string, MatcherBlock[]>;
  [k: string]: unknown;
}

export function mergeSettings(current: Settings, startCmd: string, stopCmd: string): Settings {
  const s: Settings = JSON.parse(JSON.stringify(current));
  if (!s.hooks) s.hooks = {};
  if (!s.hooks.SessionStart) s.hooks.SessionStart = [];
  if (!s.hooks.Stop) s.hooks.Stop = [];

  const hasAnchor = (blocks: MatcherBlock[]): boolean =>
    blocks.some(b => b.hooks.some(h => (h as HookEntry)[ANCHOR_MARKER as "_anchor"] === true));

  if (!hasAnchor(s.hooks.SessionStart)) {
    s.hooks.SessionStart.push({
      matcher: ".*",
      hooks: [{ type: "command", command: startCmd, _anchor: true }]
    });
  }
  if (!hasAnchor(s.hooks.Stop)) {
    s.hooks.Stop.push({
      matcher: ".*",
      hooks: [{ type: "command", command: stopCmd, _anchor: true }]
    });
  }
  return s;
}

function resolveRepoRoot(): string {
  const here = fileURLToPath(import.meta.url);
  let dir = dirname(here);
  for (let i = 0; i < 6; i++) {
    if (existsSync(join(dir, "hooks", "session-start.sh"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return dirname(here);
}

export function install(opts?: { home?: string; repoRoot?: string }): { settingsPath: string; binDir: string } {
  const home = opts?.home ?? homedir();
  const repoRoot = opts?.repoRoot ?? resolveRepoRoot();

  const anchorBin = join(home, ".claude", "anchor", "bin");
  mkdirSync(anchorBin, { recursive: true });

  const startSrc = join(repoRoot, "hooks", "session-start.sh");
  const stopSrc = join(repoRoot, "hooks", "session-stop.sh");
  const startDst = join(anchorBin, "session-start.sh");
  const stopDst = join(anchorBin, "session-stop.sh");
  cpSync(startSrc, startDst);
  cpSync(stopSrc, stopDst);
  chmodSync(startDst, 0o755);
  chmodSync(stopDst, 0o755);

  const skillsSrc = join(repoRoot, "skills");
  const skillsDst = join(home, ".claude", "skills");
  if (existsSync(skillsSrc)) {
    mkdirSync(skillsDst, { recursive: true });
    for (const name of ["anchor-core", "anchor-init", "anchor-dna", "anchor-compressor", "anchor-recall"]) {
      const s = join(skillsSrc, name);
      const d = join(skillsDst, name);
      if (existsSync(s)) cpSync(s, d, { recursive: true });
    }
  }

  const settingsPath = join(home, ".claude", "settings.json");
  mkdirSync(dirname(settingsPath), { recursive: true });
  const current: Settings = existsSync(settingsPath)
    ? (JSON.parse(readFileSync(settingsPath, "utf8")) as Settings)
    : {};
  const merged = mergeSettings(current, startDst, stopDst);
  writeFileSync(settingsPath, JSON.stringify(merged, null, 2));

  return { settingsPath, binDir: anchorBin };
}
