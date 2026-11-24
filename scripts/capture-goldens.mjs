#!/usr/bin/env node
// Captura goldens ejecutando el comando REAL en este sistema (en CI: debian:stable).
// Uso: node scripts/capture-goldens.mjs [filtro]   (ej. "ls" o "ls/ocultos")
// Cada caso: tests/golden/<cmd>/<caso>/{fixture.json, cmd.txt, [cmd_real.txt]} → stdout.txt, stderr.txt, code.txt, version.txt
// Requiere root (crea usuarios del mundo y corre el comando como `fixture.usuario` para respetar permisos).
import { execFileSync, spawnSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  utimesSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const RAIZ = "tests/golden";
const filtro = process.argv[2] ?? "";
if (process.getuid?.() !== 0) {
  console.error("Necesita root para crear usuarios y correr como ellos.");
  process.exit(1);
}

function asegurarUsuario(nombre, grupos = []) {
  for (const g of [nombre, ...grupos]) {
    if (spawnSync("getent", ["group", g]).status !== 0) execFileSync("groupadd", [g]);
  }
  if (spawnSync("id", [nombre]).status !== 0) {
    execFileSync("useradd", ["-M", "-g", nombre, "-s", "/bin/bash", nombre]);
  }
  if (grupos.length) execFileSync("usermod", ["-a", "-G", grupos.join(","), nombre]);
}

function version() {
  const os = readFileSync("/etc/os-release", "utf8").match(/^PRETTY_NAME="(.*)"$/m)?.[1] ?? "?";
  const v = (cmd) => spawnSync(cmd, ["--version"], { encoding: "utf8" }).stdout.split("\n")[0];
  return `${os}\n${v("ls")}\n${v("bash")}\ncapturado: ${new Date().toISOString().slice(0, 10)}\n`;
}

const casos = [];
for (const cmd of readdirSync(RAIZ)) {
  for (const caso of readdirSync(join(RAIZ, cmd))) {
    const dir = join(RAIZ, cmd, caso);
    if (existsSync(join(dir, "fixture.json")) && `${cmd}/${caso}`.includes(filtro)) casos.push(dir);
  }
}

const ver = version();
for (const dir of casos) {
  const fx = JSON.parse(readFileSync(join(dir, "fixture.json"), "utf8"));
  const usuarios = fx.usuarios ?? { [fx.usuario]: [] };
  for (const [u, grupos] of Object.entries(usuarios)) asegurarUsuario(u, grupos);

  const raiz = mkdtempSync(join(tmpdir(), "golden-"));
  chmodSync(raiz, 0o755);
  // Directorios en orden de profundidad para que existan antes que sus archivos.
  const entradas = [...fx.entradas].sort((a, b) => a.ruta.split("/").length - b.ruta.split("/").length);
  const asegurarDir = (abs) => {
    const partes = abs.split("/").filter(Boolean);
    let actual = raiz;
    for (const p of partes) {
      actual = join(actual, p);
      if (!existsSync(actual)) {
        mkdirSync(actual);
        chmodSync(actual, 0o755);
      }
    }
  };
  asegurarDir(fx.cwd);
  for (const e of entradas) {
    const real = join(raiz, e.ruta);
    if (e.ruta.endsWith("/")) asegurarDir(e.ruta);
    else {
      asegurarDir(dirname(e.ruta));
      writeFileSync(real, e.contenido ?? "");
    }
  }
  // Metadatos de hijos a padres (fijar mtime del padre después de crear hijos).
  for (const e of [...entradas].reverse()) {
    const real = join(raiz, e.ruta);
    const dueno = e.dueno ?? "root";
    execFileSync("chown", [`${dueno}:${e.grupo ?? dueno}`, real]);
    chmodSync(real, Number.parseInt(e.modo ?? (e.ruta.endsWith("/") ? "755" : "644"), 8));
    if (e.mtime) {
      const t = new Date(e.mtime);
      utimesSync(real, t, t);
    }
  }
  const comando = readFileSync(
    join(dir, existsSync(join(dir, "cmd_real.txt")) ? "cmd_real.txt" : "cmd.txt"),
    "utf8",
  ).trim();
  const r = spawnSync(
    "runuser",
    [
      "-u",
      fx.usuario,
      "--",
      "env",
      "-i",
      `HOME=${join(raiz, fx.home ?? fx.cwd)}`,
      `USER=${fx.usuario}`,
      `LOGNAME=${fx.usuario}`,
      "TERM=xterm-256color",
      "LC_ALL=C",
      "TZ=UTC",
      "PATH=/usr/bin:/bin",
      "bash",
      "--norc",
      "--noprofile",
      "-i",
      "-c",
      comando,
    ],
    { cwd: join(raiz, fx.cwd), encoding: "utf8" },
  );
  const limpiar = (t) => t.split(raiz).join("");
  const stderr = limpiar(r.stderr)
    .split("\n")
    .filter((l) => !/^bash: (cannot set terminal process group|no job control in this shell)/.test(l))
    .join("\n");
  writeFileSync(join(dir, "stdout.txt"), limpiar(r.stdout));
  writeFileSync(join(dir, "stderr.txt"), stderr);
  writeFileSync(join(dir, "code.txt"), `${r.status}\n`);
  writeFileSync(join(dir, "version.txt"), ver);
  rmSync(raiz, { recursive: true, force: true });
  console.log(`capturado ${dir} (código ${r.status})`);
}
