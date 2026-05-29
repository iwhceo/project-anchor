import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

export interface AnchorConfig {
  inject_max_tokens: number;
  compress_target_tokens: number;
  compress_hard_cap_tokens: number;
  recall_min_score: number;
  recall_top_k: number;
  model: string;
  background_compress: boolean;
  checkpoint_after_messages: number;
}

export function defaultConfig(): AnchorConfig {
  return {
    inject_max_tokens: 2000,
    compress_target_tokens: 500,
    compress_hard_cap_tokens: 800,
    recall_min_score: 0.55,
    recall_top_k: 5,
    model: "Xenova/all-MiniLM-L6-v2",
    background_compress: true,
    checkpoint_after_messages: 50
  };
}

export function loadConfig(path: string): AnchorConfig {
  if (!existsSync(path)) return defaultConfig();
  const raw = JSON.parse(readFileSync(path, "utf8"));
  return { ...defaultConfig(), ...raw };
}

export function writeConfig(path: string, cfg: AnchorConfig): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(cfg, null, 2));
}
