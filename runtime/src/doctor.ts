import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export interface Check {
  name: string;
  ok: boolean;
  detail?: string;
}

export interface DoctorReport {
  checks: Check[];
  ok: boolean;
}

export async function runDoctor(opts?: { home?: string }): Promise<DoctorReport> {
  const home = opts?.home ?? homedir();
  const checks: Check[] = [];

  const settings = join(home, ".claude", "settings.json");
  checks.push({ name: "settings.json", ok: existsSync(settings), detail: settings });

  const bin = join(home, ".claude", "anchor", "bin");
  checks.push({ name: "anchor bin dir", ok: existsSync(bin), detail: bin });

  const start = join(bin, "session-start.sh");
  const stop = join(bin, "session-stop.sh");
  checks.push({ name: "session-start.sh", ok: existsSync(start) });
  checks.push({ name: "session-stop.sh", ok: existsSync(stop) });

  return { checks, ok: checks.every(c => c.ok) };
}
