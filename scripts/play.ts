// Shell del juego sin interfaz (para agentes, playtests y depuración).
//   npm run play [-- --semilla N]                     → shell interactivo sobre el mundo base (content/mundo)
//   npm run play -- --exec "ls -la" [--semilla N]     → un comando sobre el mundo base
//   npm run play -- --exec "ls" --fixture tests/golden/ls/basico [--tty]
//   npm run play -- --mision <id> [--semilla N]       → jugar una misión (interactivo o por stdin)
//   npm run play -- --mision <id> --solucion          → correr la solución de referencia
//   npm run play -- --mision <id> --sesion s.json [--cmd "ls"]  → un paso por llamada (agentes)
// En una misión: ?pista [objetivo], ?responder <objetivo> <valor>, ?pendientes.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { parseArgs } from "node:util";
import { type Fragmento, GameClock, Shell } from "../src/engine";
import { inicioTurno } from "../src/engine/calendario";
import { type GuardadoMision, MisionEnCurso } from "../src/engine/mision/runtime";
import { crearShellBase } from "../src/engine/mundo-base";
import { usuarioDe } from "../src/engine/usuario";
import { type Entrada, vfsDesde } from "../src/engine/vfs";
import { buscarMision, cargarMundo } from "./lib/contenido";
import { correrSolucion, presentar, procesar, sinAnsi } from "./lib/jugar";

const { values } = parseArgs({
  options: {
    exec: { type: "string" },
    fixture: { type: "string" },
    tty: { type: "boolean", default: false },
    mision: { type: "string" },
    semilla: { type: "string", default: "1" },
    solucion: { type: "boolean", default: false },
    sesion: { type: "string" },
    cmd: { type: "string" },
    /** Tu nombre en el gafete: de él sale tu usuario en el servidor (F4-17). */
    nombre: { type: "string", default: "Sofía" },
  },
});
const jugador = usuarioDe(values.nombre);

const escribir = (t: string) => process.stdout.write(process.stdout.isTTY ? t : sinAnsi(t));

interface SesionGuardada {
  mision: string;
  semilla: number;
  guardado: GuardadoMision;
  flags: string[];
}

async function jugarMision(id: string): Promise<number> {
  let semilla = Number(values.semilla);
  let previa: SesionGuardada | undefined;
  if (values.sesion && existsSync(values.sesion)) {
    const s = JSON.parse(readFileSync(values.sesion, "utf8")) as SesionGuardada;
    if (s.mision === id) {
      previa = s;
      semilla = s.semilla;
    }
  }
  const mc = MisionEnCurso.sobreMundo(
    buscarMision(id),
    cargarMundo(),
    semilla,
    new Set(previa?.flags),
    jugador,
  );
  if (previa) mc.cargar(previa.guardado);
  const guardar = () => {
    if (!values.sesion) return;
    const s: SesionGuardada = { mision: id, semilla, guardado: mc.guardar(), flags: [...mc.flags] };
    writeFileSync(values.sesion, JSON.stringify(s));
  };

  if (values.solucion) {
    const r = await correrSolucion(mc);
    escribir(r.texto);
    return r.completada ? 0 : 1;
  }
  if (values.cmd !== undefined) {
    escribir(`${mc.shell.prompt()} ${values.cmd}\n${await procesar(mc, values.cmd)}`);
    guardar();
    return 0;
  }
  escribir(presentar(mc));
  if (values.sesion) {
    guardar();
    return 0;
  }
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: process.stdin.isTTY });
  const preguntar = () => {
    if (!process.stdin.isTTY) return;
    rl.setPrompt(`${mc.shell.prompt()} `);
    rl.prompt();
  };
  preguntar();
  for await (const linea of rl) {
    if (!process.stdin.isTTY) escribir(`${mc.shell.prompt()} ${linea}\n`);
    escribir(await procesar(mc, linea));
    preguntar();
  }
  return 0;
}

if (values.mision) {
  try {
    process.exit(await jugarMision(values.mision));
  } catch (e) {
    console.error(`play: ${e instanceof Error ? e.message : String(e)}`);
    process.exit(1);
  }
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

const shell = values.fixture
  ? desdeFixture(values.fixture)
  : crearShellBase(cargarMundo(), Number(values.semilla), {
      host: "srv-sistemas",
      usuario: "{{usuario}}",
      ahora: inicioTurno(1),
      jugador,
    }).shell;

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
