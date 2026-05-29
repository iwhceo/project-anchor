import { existsSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { ANCHOR_MARKER } from "./install.js";

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

export function stripAnchor(settings: Settings): Settings {
  const s: Settings = JSON.parse(JSON.stringify(settings));
  if (!s.hooks) s.hooks = {};
  for (const k of Object.keys(s.hooks)) {
    const blocks = s.hooks[k];
    s.hooks[k] = blocks
      .map(block => ({
        ...block,
        hooks: (block.hooks ?? []).filter(h => h[ANCHOR_MARKER as "_anchor"] !== true)
      }))
      .filter(block => (block.hooks ?? []).length > 0);
  }
  return s;
}

export function uninstall(opts?: { home?: string; keepData?: boolean }): { removed: string[] } {
  const home = opts?.home ?? homedir();
  const settingsPath = join(home, ".claude", "settings.json");
  const removed: string[] = [];

  if (existsSync(settingsPath)) {
    const s = JSON.parse(readFileSync(settingsPath, "utf8")) as Settings;
    writeFileSync(settingsPath, JSON.stringify(stripAnchor(s), null, 2));
    removed.push(settingsPath);
  }
  const binDir = join(home, ".claude", "anchor", "bin");
  if (existsSync(binDir)) {
    rmSync(binDir, { recursive: true, force: true });
    removed.push(binDir);
  }
  if (!opts?.keepData) {
    const root = join(home, ".claude", "anchor");
    if (existsSync(root)) {
      rmSync(root, { recursive: true, force: true });
      removed.push(root);
    }
  }
  return { removed };
}
