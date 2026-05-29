#!/usr/bin/env node
import { Command } from "commander";
import { install } from "./install.js";
import { uninstall } from "./uninstall.js";
import { runDoctor } from "./doctor.js";
import { compressTranscript } from "./compress.js";
import { recall } from "./recall.js";
import { getDefaultEmbedder } from "./embed.js";
import { openDb, floatArrayToBuffer } from "./storage.js";
import { dbPath, sessionsDir, projectHash, configPath, dnaPath } from "./paths.js";
import { loadConfig } from "./config.js";
import { mkdirSync, writeFileSync, readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const program = new Command();
program.name("project-anchor").version("0.1.0");

program
  .command("install")
  .description("Install hooks and skills into ~/.claude")
  .action(() => {
    const r = install();
    console.log("Installed.");
    console.log("  settings:", r.settingsPath);
    console.log("  bin:", r.binDir);
  });

program
  .command("uninstall")
  .description("Remove ProjectAnchor hooks (preserve data with --keep-data)")
  .option("--keep-data", "preserve memory data under ~/.claude/anchor/<hash>/")
  .action((opts: { keepData?: boolean }) => {
    const r = uninstall({ keepData: !!opts.keepData });
    console.log("Removed:");
    for (const p of r.removed) console.log("  " + p);
  });

program
  .command("doctor")
  .description("Run install health checks")
  .action(async () => {
    const r = await runDoctor();
    for (const c of r.checks) {
      console.log(`${c.ok ? "OK  " : "FAIL"} ${c.name}${c.detail ? "  " + c.detail : ""}`);
    }
    process.exit(r.ok ? 0 : 1);
  });

program
  .command("compress")
  .description("Compress a transcript to a session summary")
  .requiredOption("-t, --transcript <path>", "transcript jsonl path")
  .option("-c, --cwd <dir>", "project cwd", process.cwd())
  .action(async (opts: { transcript: string; cwd: string }) => {
    const hash = projectHash(opts.cwd);
    const result = compressTranscript(opts.transcript);
    const md = result.toMarkdown(hash);
    const dir = sessionsDir(opts.cwd);
    mkdirSync(dir, { recursive: true });
    const file = join(dir, `${stamp()}.md`);
    writeFileSync(file, md);
    const embedder = await getDefaultEmbedder(loadConfig(configPath()).model);
    const vec = await embedder.embed(md);
    const db = openDb(dbPath(opts.cwd));
    db.prepare(
      "INSERT INTO sessions (path, ts, title, body, embedding) VALUES (?, ?, ?, ?, ?)"
    ).run(file, new Date().toISOString(), result.title, md, floatArrayToBuffer(vec));
    console.log("Compressed to", file);
  });

program
  .command("checkpoint")
  .description("Mid-session: compress now and print DNA + new summary (anti-rot)")
  .requiredOption("-t, --transcript <path>", "transcript jsonl up to now")
  .option("-c, --cwd <dir>", "project cwd", process.cwd())
  .action(async (opts: { transcript: string; cwd: string }) => {
    const hash = projectHash(opts.cwd);
    const result = compressTranscript(opts.transcript);
    const md = result.toMarkdown(hash);
    const dir = sessionsDir(opts.cwd);
    mkdirSync(dir, { recursive: true });
    const file = join(dir, `${stamp()}-checkpoint.md`);
    writeFileSync(file, md);
    const embedder = await getDefaultEmbedder(loadConfig(configPath()).model);
    const vec = await embedder.embed(md);
    const db = openDb(dbPath(opts.cwd));
    db.prepare(
      "INSERT INTO sessions (path, ts, title, body, embedding) VALUES (?, ?, ?, ?, ?)"
    ).run(file, new Date().toISOString(), result.title, md, floatArrayToBuffer(vec));
    const dna = existsSync(dnaPath(opts.cwd)) ? readFileSync(dnaPath(opts.cwd), "utf8") : "";
    console.log("=== PROJECT ANCHOR checkpoint ===");
    console.log(dna);
    console.log("\n--- This checkpoint summary ---");
    console.log(md);
  });

program
  .command("recall")
  .description("Search project memory")
  .argument("<query...>", "search query")
  .option("-c, --cwd <dir>", "project cwd", process.cwd())
  .action(async (queryParts: string[], opts: { cwd: string }) => {
    const cfg = loadConfig(configPath());
    if (!existsSync(dbPath(opts.cwd))) {
      console.log("No memory yet for this project.");
      return;
    }
    const db = openDb(dbPath(opts.cwd));
    const embedder = await getDefaultEmbedder(cfg.model);
    const hits = await recall(db, embedder, queryParts.join(" "), {
      topK: cfg.recall_top_k,
      minScore: cfg.recall_min_score
    });
    if (hits.length === 0) {
      console.log("No matching memory found.");
      return;
    }
    for (const h of hits) {
      console.log(`[${h.score.toFixed(2)}] ${h.type}  ${h.path}\n  ${h.snippet}\n`);
    }
  });

program
  .command("status")
  .description("Print project status as JSON")
  .option("-c, --cwd <dir>", "project cwd", process.cwd())
  .action((opts: { cwd: string }) => {
    const dir = sessionsDir(opts.cwd);
    const sessions = existsSync(dir) ? readdirSync(dir).sort().reverse().slice(0, 3) : [];
    const dnaExists = existsSync(dnaPath(opts.cwd));
    console.log(
      JSON.stringify(
        { cwd: opts.cwd, hash: projectHash(opts.cwd), recent_sessions: sessions, dna: dnaExists },
        null,
        2
      )
    );
  });

program
  .command("reindex")
  .description("Rebuild embeddings from sessions/*.md")
  .option("-c, --cwd <dir>", "project cwd", process.cwd())
  .action(async (opts: { cwd: string }) => {
    const cfg = loadConfig(configPath());
    const embedder = await getDefaultEmbedder(cfg.model);
    const db = openDb(dbPath(opts.cwd));
    db.exec("DELETE FROM sessions; DELETE FROM sessions_fts");
    const dir = sessionsDir(opts.cwd);
    if (!existsSync(dir)) return;
    for (const f of readdirSync(dir)) {
      const body = readFileSync(join(dir, f), "utf8");
      const vec = await embedder.embed(body);
      db.prepare(
        "INSERT INTO sessions (path, ts, title, body, embedding) VALUES (?, ?, ?, ?, ?)"
      ).run(join(dir, f), new Date().toISOString(), f, body, floatArrayToBuffer(vec));
    }
    console.log("Reindex complete.");
  });

function stamp(): string {
  const d = new Date();
  const p = (n: number): string => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}

void program.parseAsync();
