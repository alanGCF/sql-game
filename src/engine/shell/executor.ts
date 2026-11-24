import type { GameClock } from "../clock";
import { MENSAJE, normalizar, type User, type Vfs, VfsError } from "../vfs";
import { OBSOLETOS } from "./comandos-linux";
import { expandirPalabra } from "./expand";
import type { ComandoSimple, Programa } from "./parser";
import { SUPERFICIE } from "./superficie";

export interface Sesion {
  usuario: User;
  host: string;
  cwd: string;
  env: Map<string, string>;
  historial: string[];
  ultimoCodigo: number;
  contadorPensamientos: number;
  /** Avisos de una sola vez ya mostrados (p. ej. "fíjate en el prompt" al primer cd). */
  avisos: Set<string>;
}

export interface Registro {
  /** Rutas absolutas cuyo contenido se mostró o se pasó por una tubería. */
  leidos: Set<string>;
  /** Rutas absolutas creadas o modificadas. */
  cambiados: Set<string>;
}

/** Fragmento de salida para la terminal, en el orden en que ocurrió. */
export type Fragmento =
  | { tipo: "stdout" | "stderr"; texto: string }
  | { tipo: "glosa"; texto: string }
  | { tipo: "pensamiento"; texto: string };

export interface Contexto {
  argv: string[];
  stdin: string;
  /** La salida va directo a la terminal (sin tubería ni redirección): ls usa columnas y color. */
  isatty: boolean;
  sesion: Sesion;
  vfs: Vfs;
  reloj: GameClock;
  registro: Registro;
  out(texto: string): void;
  err(texto: string): void;
  glosa(texto: string): void;
  pensar(texto: string): void;
}

export type Comando = (ctx: Contexto) => number | Promise<number>;

export interface Mundo {
  vfs: Vfs;
  reloj: GameClock;
  comandos: ReadonlyMap<string, Comando>;
}

/** Ruta absoluta de un argumento respecto al directorio actual. */
export function resolver(ctx: Pick<Contexto, "sesion">, ruta: string): string {
  return normalizar(ctx.sesion.cwd, ruta);
}

/** Mensaje de error estilo coreutils: `prog: 'ruta': Mensaje` o `prog: ruta: Mensaje`. */
export function errorVfs(e: unknown): string {
  if (e instanceof VfsError) return MENSAJE[e.code];
  throw e;
}

/** Distancia de edición con transposiciones (OSA): "sl" → "ls" cuesta 1, como un dedazo real. */
function distancia(a: string, b: string): number {
  const d: number[][] = Array.from({ length: a.length + 1 }, () => Array<number>(b.length + 1).fill(0));
  const at = (i: number, j: number) => (d[i] as number[])[j] as number;
  for (let i = 0; i <= a.length; i++) (d[i] as number[])[0] = i;
  for (let j = 0; j <= b.length; j++) (d[0] as number[])[j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const costo = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(at(i - 1, j) + 1, at(i, j - 1) + 1, at(i - 1, j - 1) + costo);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1])
        v = Math.min(v, at(i - 2, j - 2) + 1);
      (d[i] as number[])[j] = v;
    }
  }
  return at(a.length, b.length);
}

export function sugerirComando(nombre: string): string | undefined {
  let mejor: string | undefined;
  // En nombres cortos solo un dedazo (sl → ls); en largos, hasta dos. Así "en" no sugiere "cd".
  let d = nombre.length <= 3 ? 2 : 3;
  for (const c of Object.keys(SUPERFICIE)) {
    const dc = distancia(nombre.toLowerCase(), c);
    if (dc < d) {
      d = dc;
      mejor = c;
    }
  }
  return mejor;
}

/** Explicación en español para un comando que no existe, según el error típico de un novato. */
function glosaInexistente(nombre: string, args: string[], sesion: Sesion, vfs: Vfs): string {
  const moderno = OBSOLETOS[nombre];
  if (moderno)
    return `${nombre} es una herramienta vieja que ya no viene instalada en Linux moderno. Hoy se usa \`${moderno}\`.`;
  const pegado = /^cd([.~/].*)$/.exec(nombre);
  if (pegado) return `Te faltó un espacio: \`cd ${pegado[1]}\`.`;
  try {
    const n = vfs.lookup(normalizar(sesion.cwd, nombre), sesion.usuario);
    return n.type === "dir"
      ? `\`${nombre}\` es una carpeta, no un comando. Para ver qué tiene: \`ls ${nombre}\`.`
      : `\`${nombre}\` es un archivo, no un comando. Para verlo: \`cat ${nombre}\`.`;
  } catch {
    // no es una ruta: sigue
  }
  const sug = sugerirComando(nombre);
  if (sug) return `Ese comando no existe. ¿Quisiste decir \`${sug}\`?`;
  if (args.length > 0 && [nombre, ...args].every((p) => /^[a-záéíóúüñ¿?¡!,.]+$/i.test(p)))
    return "La terminal no entiende frases, solo comandos. Las respuestas de los tickets se escriben en la app de Tickets.";
  return "Ese comando no existe. Revisa cómo lo escribiste.";
}

async function ejecutarSimple(
  cmd: ComandoSimple,
  stdin: string,
  esUltimo: boolean,
  sesion: Sesion,
  mundo: Mundo,
  registro: Registro,
  salida: Fragmento[],
  sinTerminal = false,
): Promise<{ codigo: number; stdout: string }> {
  const entorno = {
    env: sesion.env,
    ultimoCodigo: sesion.ultimoCodigo,
    cwd: sesion.cwd,
    home: sesion.usuario.home,
    vfs: mundo.vfs,
    user: sesion.usuario,
  };
  const argv = cmd.palabras.flatMap((p) => expandirPalabra(p, entorno));
  const errorBash = (texto: string) => salida.push({ tipo: "stderr", texto: `bash: ${texto}\n` });

  // Redirecciones
  let archivoSalida: { ruta: string; append: boolean } | undefined;
  let archivoError: { ruta: string; append: boolean } | undefined;
  let errorASalida = false;
  let entrada = stdin;
  for (const r of cmd.redirecciones) {
    if (r.tipo === "2>&1") {
      errorASalida = true;
      continue;
    }
    const destino = expandirPalabra(r.destino, entorno);
    if (destino.length !== 1) {
      errorBash(`${destino.join(" ")}: ambiguous redirect`);
      return { codigo: 1, stdout: "" };
    }
    const ruta = normalizar(sesion.cwd, destino[0] as string);
    try {
      if (r.tipo === "<") {
        entrada = mundo.vfs.readFile(ruta, sesion.usuario);
        registro.leidos.add(ruta);
      } else {
        // Como bash: el archivo se crea (o se trunca con `>`) antes de correr el comando.
        const append = r.tipo === ">>" || r.tipo === "2>>";
        mundo.vfs.writeFile(ruta, "", sesion.usuario, mundo.reloj.now(), append);
        registro.cambiados.add(ruta);
        if (r.tipo === ">" || r.tipo === ">>") archivoSalida = { ruta, append };
        else archivoError = { ruta, append };
      }
    } catch (e) {
      errorBash(`${destino[0]}: ${errorVfs(e)}`);
      return { codigo: 1, stdout: "" };
    }
  }

  const [nombre, ...args] = argv;
  if (nombre === undefined) return { codigo: 0, stdout: "" };

  const comando = mundo.comandos.get(nombre);
  const propios: Fragmento[] = [];
  let codigo: number;
  if (!comando) {
    propios.push({ tipo: "stderr", texto: `bash: ${nombre}: command not found\n` });
    propios.push({ tipo: "glosa", texto: glosaInexistente(nombre, args, sesion, mundo.vfs) });
    codigo = 127;
  } else {
    const ctx: Contexto = {
      argv: [nombre, ...args],
      stdin: entrada,
      isatty: esUltimo && !archivoSalida && !sinTerminal,
      sesion,
      vfs: mundo.vfs,
      reloj: mundo.reloj,
      registro,
      out: (texto) => propios.push({ tipo: "stdout", texto }),
      err: (texto) => propios.push({ tipo: "stderr", texto }),
      glosa: (texto) => propios.push({ tipo: "glosa", texto }),
      pensar: (texto) => propios.push({ tipo: "pensamiento", texto }),
    };
    codigo = await comando(ctx);
  }

  // Enrutar la salida del comando
  let stdout = "";
  let haciaArchivo = "";
  let errorHaciaArchivo = "";
  for (const f of propios) {
    const esSalida = f.tipo === "stdout" || (f.tipo === "stderr" && errorASalida);
    if (esSalida) {
      if (archivoSalida) haciaArchivo += f.texto;
      else if (!esUltimo) stdout += f.texto;
      else salida.push({ tipo: "stdout", texto: f.texto });
    } else if (f.tipo === "stderr" && archivoError) {
      errorHaciaArchivo += f.texto;
    } else {
      salida.push(f);
    }
  }
  if (archivoSalida && haciaArchivo) {
    mundo.vfs.writeFile(archivoSalida.ruta, haciaArchivo, sesion.usuario, mundo.reloj.now(), true);
  }
  if (archivoError && errorHaciaArchivo) {
    mundo.vfs.writeFile(archivoError.ruta, errorHaciaArchivo, sesion.usuario, mundo.reloj.now(), true);
  }
  return { codigo, stdout };
}

/** Ejecuta un programa ya clasificado como `ejecutar`. Devuelve los fragmentos para la terminal. */
export async function ejecutar(
  programa: Programa,
  sesion: Sesion,
  mundo: Mundo,
  registro: Registro,
  sinTerminal = false,
): Promise<Fragmento[]> {
  const salida: Fragmento[] = [];
  for (const cadena of programa) {
    for (const { tuberia, union } of cadena) {
      if (union === "&&" && sesion.ultimoCodigo !== 0) continue;
      if (union === "||" && sesion.ultimoCodigo === 0) continue;
      let stdin = "";
      let codigo = 0;
      for (const [k, cmd] of tuberia.entries()) {
        const r = await ejecutarSimple(
          cmd,
          stdin,
          k === tuberia.length - 1,
          sesion,
          mundo,
          registro,
          salida,
          sinTerminal,
        );
        stdin = r.stdout;
        codigo = r.codigo;
      }
      sesion.ultimoCodigo = codigo;
      mundo.reloj.avanzar(15);
    }
  }
  return salida;
}
