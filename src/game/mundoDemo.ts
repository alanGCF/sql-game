import { GameClock, Shell } from "../engine";
import { type Entrada, vfsDesde } from "../engine/vfs";

// shortcut: mundo fijo del Turno 1 para el spike; se reemplaza por content/mundo/ con variables en F2-07.
const LEEME = `Para quien me reemplace:

1. El usuario es "becario". La contraseña está en el post-it.
2. Los tickets llegan a ~/tickets/. Uno por archivo.
3. Si la impresora de la Línea 2 falla, casi siempre es el cable.

Y una cosa más: no confíes en los números del turno nocturno.
Revisa todo dos veces.
— R.
`;

const ENTRADAS: Entrada[] = [
  { ruta: "/home/", dueno: "root", mtime: "2026-10-01T09:00:00Z" },
  { ruta: "/home/becario/", dueno: "becario", mtime: "2026-10-27T15:30:00Z" },
  { ruta: "/home/becario/.bashrc", dueno: "becario", contenido: "# ~/.bashrc\nalias ls='ls --color=auto'\n" },
  { ruta: "/home/becario/.profile", dueno: "becario", contenido: "# ~/.profile\n" },
  {
    ruta: "/home/becario/LEEME.txt",
    dueno: "rsalcido",
    grupo: "sistemas",
    contenido: LEEME,
    mtime: "2026-10-23T23:41:00Z",
  },
  { ruta: "/home/becario/tickets/", dueno: "becario", mtime: "2026-10-28T15:35:00Z" },
  {
    ruta: "/home/becario/tickets/T-1042.txt",
    dueno: "becario",
    contenido:
      "Ticket T-1042\nSolicita: Ing. Karla Ibáñez (Calidad)\nAsunto: ¿Con qué inicial firmó la nota la ingeniera anterior?\n",
    mtime: "2026-10-28T15:32:00Z",
  },
  { ruta: "/home/becario/.r/", dueno: "rsalcido", grupo: "sistemas", mtime: "2026-10-23T23:50:00Z" },
  {
    ruta: "/home/becario/.r/hola",
    dueno: "rsalcido",
    grupo: "sistemas",
    contenido: "Si encontraste esto, vas bien.\n— R.\n",
  },
  { ruta: "/srv/lineas/linea1/estado.txt", contenido: "Línea 1: OPERANDO\n" },
  {
    ruta: "/srv/lineas/linea2/estado.txt",
    contenido: "Línea 2: OPERANDO (impresora de etiquetas intermitente)\n",
  },
  {
    ruta: "/srv/lineas/linea3/estado.txt",
    contenido: "Línea 3: OPERANDO\nNota: paros sin causa registrados a las 23:59\n",
  },
];

export function crearShellDemo(): Shell {
  const reloj = GameClock.desde("2026-10-28T15:40:00Z");
  const vfs = vfsDesde(ENTRADAS, reloj.now());
  return Shell.crear(
    vfs,
    reloj,
    { name: "becario", groups: ["becario", "sistemas"], home: "/home/becario" },
    "srv-sistemas",
  );
}
