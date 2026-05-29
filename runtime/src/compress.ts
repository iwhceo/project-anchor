import { readFileSync } from "node:fs";

const TRIVIAL_BASH = /^(git status|git diff|ls|pwd|cd |cat )/;
const DECISION_RE = /\b(decido di|scelgo|vado con|go with|decided to|decision:)\b[^.\n]{3,200}/gi;
const BLOCKER_RE = /\b(fix:|causa:|root cause|bug era)\b[^.\n]{3,200}/gi;

export interface CompressResult {
  title: string;
  files: string[];
  commands: string[];
  decisions: string[];
  blockers: string[];
  nextStep: string;
  lessons: string[];
  durationMin: number;
  toMarkdown: (projectHash: string) => string;
}

interface JsonlEntry {
  type: string;
  message?: string;
  name?: string;
  input?: { file_path?: string; command?: string };
  ts?: string;
}

function parseLine(line: string): JsonlEntry | null {
  try {
    return JSON.parse(line) as JsonlEntry;
  } catch {
    return null;
  }
}

export function compressTranscript(transcriptPath: string): CompressResult {
  const raw = readFileSync(transcriptPath, "utf8").split("\n").filter(Boolean);
  const entries = raw.map(parseLine).filter((e): e is JsonlEntry => !!e);

  const userMessages = entries.filter(e => e.type === "user").map(e => e.message ?? "");
  const assistantMessages = entries.filter(e => e.type === "assistant").map(e => e.message ?? "");
  const toolUses = entries.filter(e => e.type === "tool_use");

  const files = uniq(
    toolUses
      .filter(t => ["Edit", "Write", "Read", "NotebookEdit"].includes(t.name ?? ""))
      .map(t => t.input?.file_path)
      .filter((p): p is string => typeof p === "string")
  );

  const commands = uniq(
    toolUses
      .filter(t => t.name === "Bash")
      .map(t => String(t.input?.command ?? ""))
      .filter(c => c && !TRIVIAL_BASH.test(c))
  );

  const corpus = assistantMessages.join("\n");
  const decisions = matches(corpus, DECISION_RE);
  const blockers = matches(corpus, BLOCKER_RE);
  const nextStep = userMessages[userMessages.length - 1] ?? "";
  const title = (userMessages[0] ?? "session").slice(0, 80);
  const lessons = blockers.map(b => b.replace(/^(fix:|causa:|root cause|bug era)\s*/i, "").trim());

  const toMarkdown = (projectHash: string) =>
    render({ title, files, commands, decisions, blockers, nextStep, lessons, durationMin: 0 }, projectHash);

  return { title, files, commands, decisions, blockers, nextStep, lessons, durationMin: 0, toMarkdown };
}

function uniq<T>(xs: T[]): T[] {
  return [...new Set(xs)];
}

function matches(text: string, re: RegExp): string[] {
  const out: string[] = [];
  const r = new RegExp(re.source, re.flags);
  let m: RegExpExecArray | null;
  while ((m = r.exec(text)) !== null) out.push(m[0].trim());
  return out;
}

function render(r: Omit<CompressResult, "toMarkdown">, projectHash: string): string {
  const now = new Date().toISOString();
  return [
    "---",
    `date: ${now}`,
    `duration_min: ${r.durationMin}`,
    `project_hash: ${projectHash}`,
    `title: ${JSON.stringify(r.title)}`,
    "---",
    "",
    "## Files toccati",
    ...r.files.map(f => `- ${f}`),
    "",
    "## Comandi shell",
    ...r.commands.map(c => `- \`${c}\``),
    "",
    "## Decisioni",
    ...r.decisions.map(d => `- ${d}`),
    "",
    "## Blocker risolti",
    ...r.blockers.map(b => `- ${b}`),
    "",
    "## Next step",
    r.nextStep,
    "",
    "## Lessons",
    ...r.lessons.map(l => `- ${l}`)
  ].join("\n");
}
