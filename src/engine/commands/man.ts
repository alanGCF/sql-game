import type { Contexto } from "../shell/executor";

/**
 * Páginas del manual en español (como las del paquete manpages-es), escritas para el juego:
 * solo describen las opciones que el servidor soporta y avisan que en Linux real hay más.
 * shortcut: se mueven a content/libreta/ y content/man/ en F2-02 (contenido como datos).
 */
interface Pagina {
  nombre: string;
  sinopsis: string;
  descripcion: string;
  opciones?: [string, string][];
  ejemplos?: [string, string][];
}

export const PAGINAS: Record<string, Pagina> = {
  pwd: {
    nombre: "pwd - muestra el nombre del directorio de trabajo actual",
    sinopsis: "pwd",
    descripcion: "Imprime la ruta completa del directorio en el que estás parado.",
    ejemplos: [["pwd", "muestra, por ejemplo, /home/becario"]],
  },
  ls: {
    nombre: "ls - lista el contenido de directorios",
    sinopsis: "ls [OPCIÓN]... [ARCHIVO]...",
    descripcion:
      "Muestra información sobre los ARCHIVOS (por omisión, el directorio actual). Ordena alfabéticamente.",
    opciones: [
      ["-a, --all", "no oculta las entradas que empiezan con ."],
      ["-l", "usa el formato largo: permisos, dueño, tamaño y fecha"],
      ["-h", "con -l, muestra tamaños legibles (1K, 234M, 2G)"],
      ["-1", "muestra un archivo por línea"],
      ["-d", "lista los directorios mismos, no su contenido"],
      ["-R", "lista los subdirectorios de forma recursiva"],
      ["-t", "ordena por fecha de modificación, el más nuevo primero"],
      ["-r", "invierte el orden"],
    ],
    ejemplos: [
      ["ls", "lista lo que hay en el directorio actual"],
      ["ls -a", "incluye los archivos ocultos"],
      ["ls -l /srv", "formato largo del contenido de /srv"],
    ],
  },
  cd: {
    nombre: "cd - cambia el directorio de trabajo",
    sinopsis: "cd [DIRECTORIO]",
    descripcion:
      "Cambia el directorio actual a DIRECTORIO. Sin argumentos, va a tu directorio personal (~). " +
      "'..' es el directorio padre y 'cd -' regresa al directorio anterior.",
    ejemplos: [
      ["cd /srv/lineas", "ruta absoluta: empieza con /"],
      ["cd tickets", "ruta relativa: desde donde estás"],
      ["cd ..", "sube un nivel"],
    ],
  },
  cat: {
    nombre: "cat - concatena archivos y los muestra en la salida estándar",
    sinopsis: "cat [OPCIÓN]... [ARCHIVO]...",
    descripcion: "Muestra el contenido de los ARCHIVOS, uno tras otro. Sin ARCHIVO, lee la entrada estándar.",
    opciones: [["-n", "numera todas las líneas de salida"]],
    ejemplos: [["cat LEEME.txt", "muestra el contenido de LEEME.txt"]],
  },
  echo: {
    nombre: "echo - muestra una línea de texto",
    sinopsis: "echo [OPCIÓN]... [CADENA]...",
    descripcion: "Imprime las CADENAS separadas por un espacio y termina con un salto de línea.",
    opciones: [
      ["-n", "no imprime el salto de línea final"],
      ["-e", "interpreta \\n (salto de línea) y \\t (tabulador)"],
    ],
  },
  man: {
    nombre: "man - interfaz de los manuales de referencia del sistema",
    sinopsis: "man PÁGINA",
    descripcion: "Muestra la página del manual de un comando: qué hace y qué opciones acepta.",
    ejemplos: [["man ls", "muestra el manual de ls"]],
  },
  clear: {
    nombre: "clear - limpia la pantalla de la terminal",
    sinopsis: "clear",
    descripcion: "Borra lo que hay en la pantalla. El historial de comandos se conserva.",
  },
  history: {
    nombre: "history - muestra el historial de comandos",
    sinopsis: "history",
    descripcion: "Lista los comandos que has escrito, numerados. Con ↑ y ↓ los recorres en la terminal.",
  },
};

const ANCHO = 80;

function encabezado(cmd: string): string {
  const lado = `${cmd.toUpperCase()}(1)`;
  const centro = "Órdenes de usuario";
  const espacio = ANCHO - lado.length * 2 - centro.length;
  const izq = Math.floor(espacio / 2);
  return `${lado}${" ".repeat(izq)}${centro}${" ".repeat(espacio - izq)}${lado}`;
}

function envolver(texto: string, sangria: number): string {
  const palabras = texto.split(" ");
  const lineas: string[] = [];
  let actual = "";
  for (const p of palabras) {
    if ((actual + (actual ? " " : "") + p).length + sangria > ANCHO) {
      lineas.push(actual);
      actual = p;
    } else actual += (actual ? " " : "") + p;
  }
  if (actual) lineas.push(actual);
  return lineas.map((l) => " ".repeat(sangria) + l).join("\n");
}

export function formatearPagina(cmd: string, p: Pagina): string {
  let s = `${encabezado(cmd)}\n\nNOMBRE\n${envolver(p.nombre, 7)}\n\nSINOPSIS\n${envolver(p.sinopsis, 7)}\n\nDESCRIPCIÓN\n${envolver(p.descripcion, 7)}\n`;
  if (p.opciones?.length) {
    s += "\nOPCIONES\n";
    for (const [op, desc] of p.opciones) s += `       ${op}\n${envolver(desc, 14)}\n\n`;
    s += `${envolver("En un Linux real este comando tiene más opciones; este servidor solo acepta las de arriba.", 7)}\n`;
  }
  if (p.ejemplos?.length) {
    s += "\nEJEMPLOS\n";
    for (const [ej, desc] of p.ejemplos) s += `       ${ej}\n${envolver(desc, 14)}\n`;
  }
  return s;
}

export function man(ctx: Contexto): number {
  const tema = ctx.argv[1];
  if (!tema) {
    ctx.err("What manual page do you want?\nFor example, try 'man man'.\n");
    ctx.glosa("Dile a man de qué comando quieres el manual, por ejemplo: `man ls`.");
    return 1;
  }
  const pagina = PAGINAS[tema];
  if (!pagina) {
    ctx.err(`No manual entry for ${tema}\n`);
    return 16;
  }
  ctx.out(formatearPagina(tema, pagina));
  return 0;
}

/** `--help`: en Linux real imprime la ayuda completa en inglés; aquí, la página en español (desviación documentada). */
export function ayuda(ctx: Contexto, cmd: string): number {
  const pagina = PAGINAS[cmd];
  if (pagina) ctx.out(formatearPagina(cmd, pagina));
  ctx.glosa("En Linux real, --help muestra la ayuda en inglés y más larga. Aquí ves la versión en español.");
  return 0;
}
