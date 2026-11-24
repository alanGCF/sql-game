import type { Contexto } from "../shell/executor";

/**
 * Páginas del manual en español (como las del paquete manpages-es), escritas para el juego:
 * solo describen las opciones que el servidor soporta y avisan que en Linux real hay más.
 * shortcut: pasarlas a content/man/ como datos junto con el visor paginado de la libreta (F4).
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
  exit: {
    nombre: "exit - termina la sesión de la terminal",
    sinopsis: "exit",
    descripcion:
      "Cierra la sesión. Si estás conectado a otra máquina, te desconecta de ella. En tu servidor, todavía no acaba tu turno.",
  },
  head: {
    nombre: "head - muestra la primera parte de un archivo",
    sinopsis: "head [OPCIÓN]... [ARCHIVO]...",
    descripcion:
      "Muestra los primeros 10 renglones de cada ARCHIVO. La forma corta head -5 equivale a head -n 5.",
    opciones: [["-n N", "muestra los primeros N renglones en lugar de 10"]],
    ejemplos: [["head -n 3 LEEME.txt", "muestra los primeros 3 renglones"]],
  },
  tail: {
    nombre: "tail - muestra la última parte de un archivo",
    sinopsis: "tail [OPCIÓN]... [ARCHIVO]...",
    descripcion:
      "Muestra los últimos 10 renglones de cada ARCHIVO. La forma corta tail -5 equivale a tail -n 5.",
    opciones: [["-n N", "muestra los últimos N renglones en lugar de 10"]],
    ejemplos: [["tail -n 3 LEEME.txt", "muestra los últimos 3 renglones"]],
  },
  mkdir: {
    nombre: "mkdir - crea directorios",
    sinopsis: "mkdir [OPCIÓN]... DIRECTORIO...",
    descripcion: "Crea cada DIRECTORIO si no existe.",
    opciones: [["-p", "crea también los directorios intermedios y no avisa si ya existen"]],
    ejemplos: [["mkdir -p respaldo/octubre", "crea respaldo y, dentro, octubre"]],
  },
  touch: {
    nombre: "touch - crea un archivo vacío o cambia su fecha",
    sinopsis: "touch ARCHIVO...",
    descripcion:
      "Si el ARCHIVO no existe, lo crea vacío. Si existe, cambia su fecha de modificación a la hora actual.",
    ejemplos: [["touch pendientes.txt", "crea pendientes.txt vacío"]],
  },
  cp: {
    nombre: "cp - copia archivos y directorios",
    sinopsis: "cp [OPCIÓN]... ORIGEN... DESTINO",
    descripcion:
      "Copia ORIGEN en DESTINO, o varios ORÍGENES dentro del directorio DESTINO. Si el destino existe, lo reemplaza sin preguntar.",
    opciones: [["-r", "copia directorios con todo su contenido"]],
    ejemplos: [
      ["cp LEEME.txt copia.txt", "hace una copia con otro nombre"],
      ["cp -r tickets tickets-copia", "copia el directorio completo"],
    ],
  },
  mv: {
    nombre: "mv - mueve o renombra archivos",
    sinopsis: "mv ORIGEN... DESTINO",
    descripcion:
      "Renombra ORIGEN como DESTINO, o mueve varios ORÍGENES dentro del directorio DESTINO. Si el destino existe, lo reemplaza sin preguntar.",
    ejemplos: [["mv notas.txt notas-octubre.txt", "cambia el nombre del archivo"]],
  },
  rm: {
    nombre: "rm - borra archivos o directorios",
    sinopsis: "rm [OPCIÓN]... ARCHIVO...",
    descripcion: "Borra cada ARCHIVO. No hay papelera: lo borrado no se recupera.",
    opciones: [
      ["-r", "borra directorios con todo su contenido"],
      ["-f", "no pregunta ni avisa si un archivo no existe"],
    ],
    ejemplos: [["rm borrador.txt", "borra el archivo"]],
  },
  grep: {
    nombre: "grep - muestra los renglones que coinciden con un patrón",
    sinopsis: "grep [OPCIÓN]... PATRÓN [ARCHIVO]...",
    descripcion:
      "Busca el PATRÓN en cada ARCHIVO (o en lo que le llega por una tubería) y muestra los renglones que lo contienen.",
    opciones: [
      ["-i", "no distingue mayúsculas de minúsculas"],
      ["-n", "antepone el número de renglón"],
      ["-v", "muestra los renglones que NO coinciden"],
      ["-c", "solo cuenta los renglones que coinciden"],
      ["-r", "busca en todos los archivos de los subdirectorios"],
      ["-w", "solo coincide con palabras completas"],
      ["-E", "el patrón es una expresión regular extendida (a|b, [0-9]+)"],
    ],
    ejemplos: [["grep -i impresora LEEME.txt", "busca impresora sin importar mayúsculas"]],
  },
  wc: {
    nombre: "wc - cuenta renglones, palabras y bytes",
    sinopsis: "wc [OPCIÓN]... [ARCHIVO]...",
    descripcion:
      "Muestra cuántos renglones, palabras y bytes tiene cada ARCHIVO (o lo que le llega por una tubería).",
    opciones: [
      ["-l", "solo renglones"],
      ["-w", "solo palabras"],
      ["-c", "solo bytes"],
    ],
    ejemplos: [["ls tickets | wc -l", "cuenta cuántos archivos hay en tickets"]],
  },
  sort: {
    nombre: "sort - ordena renglones",
    sinopsis: "sort [OPCIÓN]... [ARCHIVO]...",
    descripcion: "Ordena los renglones de los ARCHIVOS (o de lo que le llega por una tubería).",
    opciones: [
      ["-r", "orden inverso"],
      ["-n", "compara como números"],
      ["-u", "quita los repetidos"],
      ["-k N[,M]", "ordena por la columna N (hasta el final, o hasta la columna M)"],
      ["-t C", "las columnas se separan con el carácter C"],
    ],
    ejemplos: [["sort -t, -k2,2 datos.csv", "ordena por la segunda columna de un CSV"]],
  },
  uniq: {
    nombre: "uniq - quita o cuenta renglones repetidos seguidos",
    sinopsis: "uniq [OPCIÓN]... [ARCHIVO]",
    descripcion:
      "Junta los renglones repetidos que están uno tras otro. Por eso casi siempre va después de sort.",
    opciones: [
      ["-c", "antepone cuántas veces aparece cada renglón"],
      ["-d", "solo muestra los renglones repetidos"],
    ],
    ejemplos: [["sort lista.txt | uniq -c", "cuenta cuántas veces sale cada renglón"]],
  },
  cut: {
    nombre: "cut - extrae columnas de cada renglón",
    sinopsis: "cut OPCIÓN... [ARCHIVO]...",
    descripcion: "Muestra solo las columnas pedidas de cada renglón.",
    opciones: [
      ["-d C", "las columnas se separan con el carácter C (por omisión, el tabulador)"],
      ["-f N", "las columnas a mostrar: N, N,M o N-M"],
    ],
    ejemplos: [["cut -d: -f2 estado.txt", "muestra lo que va después de cada dos puntos"]],
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
