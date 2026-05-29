import type Database from "better-sqlite3";
import { bufferToFloatArray } from "./storage.js";
import { cosine } from "./embed.js";
import type { Embedder } from "./embed.js";

export interface RecallHit {
  score: number;
  type: "session" | "lesson" | "decision" | "fts";
  path: string;
  snippet: string;
  ts: string;
}

export interface RecallOptions {
  topK: number;
  minScore: number;
}

interface SessionRow { id: number; path: string; ts: string; title: string | null; body: string; embedding: Buffer }
interface LessonRow { id: number; body: string; ts: string; embedding: Buffer }
interface DecisionRow { id: number; topic: string | null; rationale: string; ts: string; embedding: Buffer }
interface FtsRow { path: string; ts: string; body: string }

export async function recall(
  db: Database.Database,
  embedder: Embedder,
  query: string,
  opts: RecallOptions
): Promise<RecallHit[]> {
  const q = await embedder.embed(query);
  const scored: RecallHit[] = [];

  for (const row of db.prepare("SELECT id, path, ts, title, body, embedding FROM sessions").all() as SessionRow[]) {
    scored.push({
      score: cosine(q, bufferToFloatArray(row.embedding)),
      type: "session",
      path: row.path,
      snippet: snippet(row.body),
      ts: row.ts
    });
  }
  for (const row of db.prepare("SELECT id, body, ts, embedding FROM lessons").all() as LessonRow[]) {
    scored.push({
      score: cosine(q, bufferToFloatArray(row.embedding)),
      type: "lesson",
      path: `lessons.md#${row.id}`,
      snippet: snippet(row.body),
      ts: row.ts
    });
  }
  for (const row of db.prepare("SELECT id, topic, rationale, ts, embedding FROM decisions").all() as DecisionRow[]) {
    scored.push({
      score: cosine(q, bufferToFloatArray(row.embedding)),
      type: "decision",
      path: `decisions.md#${row.id}`,
      snippet: snippet(row.rationale),
      ts: row.ts
    });
  }

  scored.sort((a, b) => b.score - a.score);
  const top = scored.filter(h => h.score >= opts.minScore).slice(0, opts.topK);

  if (top.length < 3) {
    try {
      const fts = db.prepare(
        "SELECT s.path, s.ts, s.body FROM sessions_fts f JOIN sessions s ON s.id = f.rowid WHERE sessions_fts MATCH ? LIMIT ?"
      ).all(query, opts.topK) as FtsRow[];
      for (const r of fts) {
        top.push({ score: 0.5, type: "fts", path: r.path, snippet: snippet(r.body), ts: r.ts });
      }
    } catch {
      // FTS5 MATCH syntax error on user input; ignore and return what we have
    }
  }
  return top.slice(0, opts.topK);
}

function snippet(body: string, max = 200): string {
  const s = body.replace(/\s+/g, " ").trim();
  return s.length > max ? s.slice(0, max) + "..." : s;
}
