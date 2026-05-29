import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

export const DNA_SECTIONS = ["Purpose", "Stack", "Conventions", "Decisions", "People", "Glossary"] as const;
export type DnaSection = typeof DNA_SECTIONS[number];
export type Dna = Record<DnaSection, string>;

export function emptyDna(): Dna {
  return Object.fromEntries(DNA_SECTIONS.map(s => [s, ""])) as Dna;
}

export function readDna(path: string): Dna {
  if (!existsSync(path)) return emptyDna();
  const raw = readFileSync(path, "utf8");
  const dna = emptyDna();
  const re = /^## (Purpose|Stack|Conventions|Decisions|People|Glossary)\s*$/m;
  const parts = raw.split(re);
  for (let i = 1; i < parts.length; i += 2) {
    const name = parts[i] as DnaSection;
    dna[name] = (parts[i + 1] ?? "").trim();
  }
  return dna;
}

export function writeDna(path: string, dna: Dna): void {
  mkdirSync(dirname(path), { recursive: true });
  const out = ["# PROJECT_DNA", ""];
  for (const s of DNA_SECTIONS) {
    out.push(`## ${s}`, "", dna[s] || "", "");
  }
  writeFileSync(path, out.join("\n"));
}
