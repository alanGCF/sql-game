#!/usr/bin/env node
// Hook PostToolUse (Edit|Write|MultiEdit).
// - .ts/.tsx/.js/.mjs/.json/.css → `biome check --write` sobre el archivo.
// - content/**/*.yaml            → `npm run validate:content -- <archivo>`.
// No hace nada mientras el tooling no exista (Fase 0). Exit 2 devuelve el error a Claude para que lo corrija.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { extname, isAbsolute, join, relative, sep } from "node:path";

const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();

let input;
try {
  input = JSON.parse(readFileSync(0, "utf8") || "{}");
} catch {
  process.exit(0);
}

const filePath = input?.tool_input?.file_path;
if (!filePath) process.exit(0);

const abs = isAbsolute(filePath) ? filePath : join(root, filePath);
const rel = relative(root, abs);
if (rel.startsWith("..") || isAbsolute(rel)) process.exit(0); // fuera del repo

const isWin = process.platform === "win32";
const bin = (name) => join(root, "node_modules", ".bin", isWin ? `${name}.cmd` : name);
const run = (cmd, args) => spawnSync(cmd, args, { cwd: root, encoding: "utf8", shell: isWin });
const fail = (msg) => {
  process.stderr.write(msg);
  process.exit(2);
};

const ext = extname(abs).toLowerCase();

if ([".ts", ".tsx", ".js", ".mjs", ".json", ".css"].includes(ext) && existsSync(bin("biome"))) {
  const r = run(bin("biome"), [
    "check",
    "--write",
    "--no-errors-on-unmatched",
    "--files-ignore-unknown=true",
    abs,
  ]);
  if (r.status !== 0) fail(`biome check falló en ${rel}:\n${r.stdout ?? ""}${r.stderr ?? ""}`);
}

const inContent = rel.split(sep)[0] === "content";
if (
  inContent &&
  [".yaml", ".yml"].includes(ext) &&
  existsSync(join(root, "scripts", "validate-content.ts"))
) {
  const r = run(isWin ? "npm.cmd" : "npm", ["run", "-s", "validate:content", "--", rel]);
  if (r.status !== 0) fail(`validate:content falló para ${rel}:\n${r.stdout ?? ""}${r.stderr ?? ""}`);
}

process.exit(0);
