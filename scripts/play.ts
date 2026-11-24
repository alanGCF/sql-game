// Shell del juego sin interfaz (para agentes, playtests y depuración).
//   npm run play                                      → shell interactivo sobre el mundo de demostración
//   npm run play -- --exec "ls -la"                   → un comando sobre el mundo de demostración
//   npm run play -- --exec "ls" --fixture tests/golden/ls/basico [--tty]
//   npm run play -- --mision <id> ...                 → llega en F2-06
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { parseArgs } from "node:util";
import { type Fragmento, GameClock, Shell } from "../src/engine";
import { type Entrada, vfsDesde } from "../src/engine/vfs";
import { crearShellDemo } from "../src/game/mundoDemo";

const { values } = parseArgs({
  options: {
    exec: { type: "string" },
    fixture: { type: "string" },
    tty: { type: "boolean", default: false },
    mision: { type: "string" },
  },
});

if (values.mision) {
  console.error("no implementado: F2-06 (npm run play --mision)");
  process.exit(1);
}

function desdeFixture(dir: string): Shell {
  const fx = JSON.parse(readFileSync(join(dir, "fixture.json"), "utf8")) as {
    cwd: string;
    home?: string;
    usuario: string;
    usuarios?: Record<string, string[]>;
    ahora: string;
    entradas: Entrada[];
  };
  const reloj = GameClock.desde(fx.ahora);
  const usuario = {
    name: fx.usuario,
    groups: [fx.usuario, ...(fx.usuarios?.[fx.usuario] ?? [])],
    home: fx.home ?? fx.cwd,
  };
  return Shell.crear(vfsDesde(fx.entradas, reloj.now()), reloj, usuario, "srv-sistemas", fx.cwd);
}

function imprimir(fragmentos: Fragmento[], pensamiento?: string) {
  for (const f of fragmentos) {
    if (f.tipo === "stdout") process.stdout.write(f.texto);
    else if (f.tipo === "stderr") process.stderr.write(f.texto);
    else if (f.tipo === "glosa") process.stdout.write(`↳ ${f.texto}\n`);
  }
  if (pensamiento) process.stdout.write(`(pensamiento) ${pensamiento}\n`);
}

const shell = values.fixture ? desdeFixture(values.fixture) : crearShellDemo();

if (values.exec !== undefined) {
  const r = await shell.ejecutar(values.exec, { sinTerminal: !values.tty });
  imprimir(r.fragmentos, r.pensamiento);
  process.exit(r.ejecutada ? shell.sesion.ultimoCodigo : 0);
}

const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: process.stdin.isTTY });
const preguntar = () => {
  if (!process.stdin.isTTY) return;
  rl.setPrompt(`${shell.prompt()} `);
  rl.prompt();
};
preguntar();
for await (const linea of rl) {
  if (!process.stdin.isTTY) process.stdout.write(`${shell.prompt()} ${linea}\n`);
  const r = await shell.ejecutar(linea, { sinTerminal: !process.stdin.isTTY });
  imprimir(r.fragmentos, r.pensamiento);
  preguntar();
}
