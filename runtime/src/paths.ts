import { createHash } from "node:crypto";
import { homedir } from "node:os";
import { join } from "node:path";

export function projectHash(cwd: string): string {
  return createHash("sha1").update(cwd).digest("hex").slice(0, 8);
}

export function anchorRoot(): string {
  return join(homedir(), ".claude", "anchor");
}

export function projectDir(cwd: string): string {
  return join(anchorRoot(), projectHash(cwd));
}

export function sessionsDir(cwd: string): string {
  return join(projectDir(cwd), "sessions");
}

export function dbPath(cwd: string): string {
  return join(projectDir(cwd), "index.sqlite");
}

export function dnaPath(cwd: string): string {
  return join(projectDir(cwd), "PROJECT_DNA.md");
}

export function lessonsPath(cwd: string): string {
  return join(projectDir(cwd), "lessons.md");
}

export function decisionsPath(cwd: string): string {
  return join(projectDir(cwd), "decisions.md");
}

export function configPath(): string {
  return join(anchorRoot(), "config.json");
}
