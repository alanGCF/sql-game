/**
 * Luz de la ventana según la hora del juego (05-arquitectura.md §Iluminación por hora del juego). El turno
 * va de 15:30 a 00:00 en Ciudad Juárez a fines de octubre: el sol se mete cerca de las 18:20. Puro, sin
 * three.js: la escena solo lee colores e intensidades.
 */
export interface Iluminacion {
  cielo: string;
  horizonte: string;
  montes: string;
  planta: string;
  sol: string;
  intensidadSol: number;
  /** Factor de la luz de oficina del techo: de noche baja un poco y la lámpara de escritorio destaca. */
  ambiente: number;
  /** 0 = apagadas, 1 = todas las luces de la planta prendidas. */
  lucesPlanta: number;
  /** Cambia solo tres veces por turno: sirve como llave para rehacer los reflejos del entorno. */
  etapa: "tarde" | "atardecer" | "noche";
}

type Clave = Omit<Iluminacion, "etapa"> & { minuto: number };

const CLAVES: readonly Clave[] = [
  {
    minuto: 15 * 60 + 30,
    cielo: "#7fb2e0",
    horizonte: "#f4dcae",
    montes: "#9a7f66",
    planta: "#77736c",
    sol: "#fff1d8",
    intensidadSol: 1.6,
    ambiente: 1,
    lucesPlanta: 0,
  },
  {
    minuto: 17 * 60 + 30,
    cielo: "#6f9ccf",
    horizonte: "#f7c98a",
    montes: "#8a6a55",
    planta: "#66605a",
    sol: "#ffd9a3",
    intensidadSol: 1.45,
    ambiente: 1,
    lucesPlanta: 0,
  },
  {
    minuto: 18 * 60 + 20,
    cielo: "#4a5f96",
    horizonte: "#ef8a4f",
    montes: "#5a4048",
    planta: "#3e3a40",
    sol: "#ffa066",
    intensidadSol: 1,
    ambiente: 0.95,
    lucesPlanta: 0.2,
  },
  {
    minuto: 19 * 60,
    cielo: "#25305a",
    horizonte: "#7a5578",
    montes: "#2a2638",
    planta: "#24232e",
    sol: "#9c88c0",
    intensidadSol: 0.4,
    ambiente: 0.85,
    lucesPlanta: 0.7,
  },
  {
    minuto: 20 * 60,
    cielo: "#0e1630",
    horizonte: "#1f2a4a",
    montes: "#151a2a",
    planta: "#1a1c26",
    sol: "#6a7cb5",
    intensidadSol: 0.12,
    ambiente: 0.78,
    lucesPlanta: 1,
  },
];

function canal(hex: string, i: number): number {
  return Number.parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
}

export function mezclarColor(a: string, b: string, t: number): string {
  let s = "#";
  for (let i = 0; i < 3; i++) {
    const v = Math.round(canal(a, i) + (canal(b, i) - canal(a, i)) * t);
    s += v.toString(16).padStart(2, "0");
  }
  return s;
}

/** `minuto` = minutos desde las 00:00 del día del turno (24:00 = 1440). */
export function iluminacion(minuto: number): Iluminacion {
  const primera = CLAVES[0] as Clave;
  const ultima = CLAVES[CLAVES.length - 1] as Clave;
  const etapa = minuto < 17 * 60 + 50 ? "tarde" : minuto < 19 * 60 + 30 ? "atardecer" : "noche";
  let a = primera;
  let b = primera;
  if (minuto >= ultima.minuto) a = b = ultima;
  else if (minuto > primera.minuto)
    for (let i = 1; i < CLAVES.length; i++) {
      b = CLAVES[i] as Clave;
      a = CLAVES[i - 1] as Clave;
      if (minuto <= b.minuto) break;
    }
  const t = b.minuto === a.minuto ? 0 : (minuto - a.minuto) / (b.minuto - a.minuto);
  const num = (x: number, y: number) => x + (y - x) * t;
  return {
    cielo: mezclarColor(a.cielo, b.cielo, t),
    horizonte: mezclarColor(a.horizonte, b.horizonte, t),
    montes: mezclarColor(a.montes, b.montes, t),
    planta: mezclarColor(a.planta, b.planta, t),
    sol: mezclarColor(a.sol, b.sol, t),
    intensidadSol: num(a.intensidadSol, b.intensidadSol),
    ambiente: num(a.ambiente, b.ambiente),
    lucesPlanta: num(a.lucesPlanta, b.lucesPlanta),
    etapa,
  };
}

/** "HH:MM" de un minuto del día; 24:10 se muestra como 00:10. */
export function horaTexto(minuto: number): string {
  const m = ((Math.floor(minuto) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}
