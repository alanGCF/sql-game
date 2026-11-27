/** Dibujos 2D para texturas del cubículo. Fuentes del sistema: no se descarga nada. */

import { FUENTE_MONO, FUENTE_UI } from "../ui/fuentes";

// Las mismas fuentes empaquetadas que la interfaz (D-25): las texturas se ven igual en todos los sistemas.
const MONO = FUENTE_MONO;
const SANS = FUENTE_UI;
// shortcut: la letra de mano del pizarrón y los post-its usa la fuente de la interfaz hasta elegir una
// manuscrita OFL empaquetada (F4-05). Antes caía en una distinta en cada sistema (Segoe Print, DejaVu, cursiva).
const MANO = FUENTE_UI;

export function dibujarPantalla(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = "#0b1110";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#1d2a27";
  ctx.fillRect(0, 0, w, 34);
  ctx.fillStyle = "#9fd3c0";
  ctx.font = `20px ${SANS}`;
  ctx.fillText("Planta 7 · srv-sistemas", 16, 24);
  const lineas = [
    ["#7fd1a8", "becario@srv-sistemas:~$ ls"],
    ["#e6e1d3", "LEEME.txt  tickets"],
    ["#7fd1a8", "becario@srv-sistemas:~$ cat LEEME.txt"],
    ["#e6e1d3", "Para quien me reemplace:"],
    ["#e6e1d3", "no confíes en los números del"],
    ["#e6e1d3", "turno nocturno."],
    ["#e6e1d3", "— R."],
    ["#7fd1a8", "becario@srv-sistemas:~$ █"],
  ] as const;
  ctx.font = `26px ${MONO}`;
  lineas.forEach(([color, texto], i) => {
    ctx.fillStyle = color;
    ctx.fillText(texto, 18, 78 + i * 38);
  });
}

const MESES = [
  "ENERO",
  "FEBRERO",
  "MARZO",
  "ABRIL",
  "MAYO",
  "JUNIO",
  "JULIO",
  "AGOSTO",
  "SEPTIEMBRE",
  "OCTUBRE",
  "NOVIEMBRE",
  "DICIEMBRE",
];

/**
 * Calendario de pared del 26 de octubre al 16 de noviembre de 2026 (el periodo del juego). `hoy` va
 * encerrado y el título es su mes; el sábado 7 es el tiempo extra.
 */
// shortcut: las estrellas por turno terminado llegan con la partida guardada (F4); hoy no se dibujan.
export function dibujarCalendario(hoy: string) {
  return (ctx: CanvasRenderingContext2D, w: number) => {
    const [, mesHoy = 10, diaHoy = 28] = hoy.split("-").map(Number);
    ctx.fillStyle = "#f6f3ec";
    ctx.fillRect(0, 0, w, 520);
    ctx.fillStyle = "#e0702b";
    ctx.fillRect(0, 0, w, 70);
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold 34px ${SANS}`;
    ctx.fillText(`${MESES[mesHoy - 1] ?? ""} 2026`, 22, 48);
    const dias = ["L", "M", "M", "J", "V", "S", "D"];
    const celda = w / 7;
    ctx.font = `bold 22px ${SANS}`;
    ctx.fillStyle = "#555";
    for (const [i, d] of dias.entries()) ctx.fillText(d, i * celda + celda / 2 - 7, 100);
    // Del lunes 26 de octubre al lunes 16 de noviembre (4 filas).
    const fechas: [number, number][] = [];
    for (let d = 26; d <= 31; d++) fechas.push([10, d]);
    for (let d = 1; d <= 16; d++) fechas.push([11, d]);
    ctx.font = `24px ${SANS}`;
    for (const [i, [mes, dia]] of fechas.entries()) {
      const col = i % 7;
      const fila = Math.floor(i / 7);
      const x = col * celda + 10;
      const y = 140 + fila * 92;
      ctx.strokeStyle = "#d8d2c4";
      ctx.strokeRect(col * celda, y - 30, celda, 92);
      ctx.fillStyle = mes !== mesHoy ? "#a8a29a" : col >= 5 ? "#9a9a9a" : "#222";
      ctx.fillText(String(dia), x, y);
      if (mes === mesHoy && dia === diaHoy) {
        ctx.strokeStyle = "#c0392b";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(x + 14, y - 8, 26, 0, Math.PI * 2);
        ctx.stroke();
        ctx.lineWidth = 1;
      }
      if (mes === 11 && dia === 7) {
        ctx.fillStyle = "#3d5a80";
        ctx.font = `16px ${SANS}`;
        ctx.fillText("T. extra", x, y + 34);
        ctx.font = `24px ${SANS}`;
      }
    }
  };
}

/** Parte un texto en renglones que caben en `ancho` píxeles con la fuente actual del contexto. */
function envolver(ctx: CanvasRenderingContext2D, texto: string, ancho: number): string[] {
  const renglones: string[] = [];
  let actual = "";
  for (const palabra of texto.split(/\s+/)) {
    const prueba = actual ? `${actual} ${palabra}` : palabra;
    if (actual && ctx.measureText(prueba).width > ancho) {
      renglones.push(actual);
      actual = palabra;
    } else actual = prueba;
  }
  if (actual) renglones.push(actual);
  return renglones;
}

/** Pizarrón con los pendientes de la misión: los cumplidos se tachan con plumón rojo. */
/**
 * Pizarrón de pendientes. `tachando` (F4-07): textos que el plumón está rayando ahora y cuánto lleva (0..1);
 * la raya crece de izquierda a derecha y la palomita aparece al final.
 */
export function dibujarPizarron(
  renglones: readonly { texto: string; hecho: boolean }[],
  tachando: ReadonlyMap<string, number> = new Map(),
) {
  return (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.fillStyle = "#f4f5f1";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#1f3b73";
    ctx.font = `bold 40px ${MANO}`;
    ctx.fillText("PENDIENTES", 30, 60);
    ctx.font = `26px ${MANO}`;
    if (!renglones.length) {
      ctx.fillText("Nada por ahora.", 36, 120);
      return;
    }
    let y = 115;
    for (const r of renglones) {
      const lineas = envolver(ctx, r.texto, w - 110);
      if (y + (lineas.length - 1) * 32 > h - 16) break;
      const avance = r.hecho ? (tachando.get(r.texto) ?? 1) : 0;
      const palomita = r.hecho && avance >= 1;
      ctx.fillStyle = palomita ? "#2e7d32" : "#1f3b73";
      ctx.fillText(palomita ? "✓" : "□", 30, y);
      // La raya recorre todos los renglones del pendiente, uno tras otro.
      const anchos = lineas.map((l) => ctx.measureText(l).width + 4);
      let porRayar = avance * anchos.reduce((a, b) => a + b, 0);
      lineas.forEach((l, i) => {
        const yl = y + i * 32;
        ctx.fillStyle = r.hecho ? "#2e7d32" : "#1f3b73";
        ctx.fillText(l, 66, yl);
        const largo = Math.min(porRayar, anchos[i] ?? 0);
        porRayar -= largo;
        if (largo > 0) {
          ctx.strokeStyle = "#c62828";
          ctx.lineWidth = 3;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(64, yl - 9);
          ctx.lineTo(64 + largo, yl - 9 + Math.sin(largo / 40) * 1.5);
          ctx.stroke();
        }
      });
      y += lineas.length * 32 + 16;
    }
  };
}

export function dibujarPostIt(texto: string[], color = "#f4d35e") {
  return (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#3a3320";
    ctx.font = `26px ${MANO}`;
    texto.forEach((t, i) => {
      ctx.fillText(t, 14, 44 + i * 34);
    });
  };
}

/** Gafete del escritorio: nombre y número enmascarado (D-26); sin partida, el del becario genérico. */
export function dibujarGafete(nombre: string, numero: string) {
  return (ctx: CanvasRenderingContext2D, w: number, h: number) => gafete(ctx, w, h, nombre, numero);
}

function gafete(ctx: CanvasRenderingContext2D, w: number, h: number, nombre: string, numero: string) {
  ctx.fillStyle = "#fafafa";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#e0702b";
  ctx.fillRect(0, 0, w, 40);
  ctx.fillStyle = "#fff";
  ctx.font = `bold 22px ${SANS}`;
  ctx.fillText("INDUSTRIAS OCOTILLO", 12, 28);
  ctx.fillStyle = "#bbb";
  ctx.fillRect(14, 56, 70, 86);
  ctx.fillStyle = "#222";
  ctx.font = `bold 24px ${SANS}`;
  ctx.fillText(nombre.toUpperCase().slice(0, 16), 96, 84);
  ctx.font = `18px ${MONO}`;
  ctx.fillText(numero, 96, 118);
}

/** Reloj de pared con la hora del juego (`minuto` = minutos desde las 00:00). */
export function dibujarReloj(minuto: number) {
  return (ctx: CanvasRenderingContext2D, w: number) => {
    const r = w / 2;
    ctx.fillStyle = "#f2efe8";
    ctx.beginPath();
    ctx.arc(r, r, r - 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#222";
    ctx.lineWidth = 8;
    ctx.stroke();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(r + Math.sin(a) * (r - 18), r - Math.cos(a) * (r - 18));
      ctx.lineTo(r + Math.sin(a) * (r - 34), r - Math.cos(a) * (r - 34));
      ctx.stroke();
    }
    const aguja = (ang: number, largo: number, grosor: number) => {
      ctx.lineWidth = grosor;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(r, r);
      ctx.lineTo(r + Math.sin(ang) * largo, r - Math.cos(ang) * largo);
      ctx.stroke();
    };
    const m = Math.floor(minuto) % 720;
    aguja((m / 720) * Math.PI * 2, r * 0.5, 10);
    aguja(((m % 60) / 60) * Math.PI * 2, r * 0.75, 6);
    ctx.fillStyle = "#222";
    ctx.beginPath();
    ctx.arc(r, r, 9, 0, Math.PI * 2);
    ctx.fill();
  };
}

/** Colores de la ventana a una hora dada (los calcula src/game/hora.ts). */
export interface ColoresVentana {
  cielo: string;
  horizonte: string;
  montes: string;
  planta: string;
  lucesPlanta: number;
}

// Estrellas fijas (posición relativa) para que la noche no cambie entre cuadros.
const ESTRELLAS = [
  [0.06, 0.12],
  [0.14, 0.3],
  [0.22, 0.08],
  [0.31, 0.22],
  [0.4, 0.1],
  [0.47, 0.34],
  [0.55, 0.16],
  [0.63, 0.06],
  [0.71, 0.26],
  [0.78, 0.12],
  [0.86, 0.32],
  [0.93, 0.18],
  [0.1, 0.42],
  [0.67, 0.4],
] as const;

/**
 * La planta vista por la ventana del fondo: cielo de Juárez, la sierra, la nave de manufactura con su
 * chimenea y el tanque de agua. De noche se prenden las luces de la nave y el foco rojo de la chimenea.
 */
export function dibujarVentana(c: ColoresVentana) {
  return (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const g = ctx.createLinearGradient(0, 0, 0, h * 0.45);
    g.addColorStop(0, c.cielo);
    g.addColorStop(1, c.horizonte);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    if (c.lucesPlanta > 0.5) {
      ctx.fillStyle = `rgba(255,255,240,${(c.lucesPlanta - 0.5) * 1.4})`;
      for (const [x, y] of ESTRELLAS) ctx.fillRect(x * w, y * h, 2, 2);
    }
    // Sierra al fondo.
    ctx.fillStyle = c.montes;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.42);
    const sierra = [0.4, 0.32, 0.36, 0.27, 0.3, 0.38, 0.35, 0.41, 0.37, 0.43, 0.45];
    for (const [i, y] of sierra.entries()) ctx.lineTo((i / (sierra.length - 1)) * w, y * h);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.fill();
    // Nave de manufactura, chimenea y tanque de agua.
    ctx.fillStyle = c.planta;
    ctx.fillRect(0, h * 0.52, w, h * 0.48);
    ctx.fillRect(w * 0.12, h * 0.38, w * 0.42, h * 0.16);
    ctx.fillRect(w * 0.6, h * 0.44, w * 0.3, h * 0.1);
    ctx.fillRect(w * 0.47, h * 0.12, w * 0.022, h * 0.28);
    ctx.fillRect(w * 0.77, h * 0.18, w * 0.006, h * 0.27);
    ctx.fillRect(w * 0.81, h * 0.18, w * 0.006, h * 0.27);
    ctx.beginPath();
    ctx.ellipse(w * 0.793, h * 0.16, w * 0.04, h * 0.07, 0, 0, Math.PI * 2);
    ctx.fill();
    if (c.lucesPlanta > 0) {
      ctx.fillStyle = `rgba(255,214,120,${c.lucesPlanta})`;
      for (let i = 0; i < 9; i++) ctx.fillRect(w * (0.15 + i * 0.042), h * 0.44, w * 0.018, h * 0.03);
      for (let i = 0; i < 6; i++) ctx.fillRect(w * (0.62 + i * 0.045), h * 0.48, w * 0.02, h * 0.025);
      for (let i = 0; i < 14; i++) ctx.fillRect(w * (0.03 + i * 0.07), h * 0.6, w * 0.006, h * 0.012);
      ctx.fillStyle = `rgba(255,60,50,${c.lucesPlanta})`;
      ctx.beginPath();
      ctx.arc(w * 0.481, h * 0.11, Math.max(3, w * 0.004), 0, Math.PI * 2);
      ctx.fill();
    }
    // Marco y parteluces.
    ctx.fillStyle = "#3a3d42";
    const grosor = Math.max(6, w * 0.008);
    for (let i = 0; i <= 4; i++) {
      const x = Math.min(w - grosor, (i / 4) * w - (i ? grosor / 2 : 0));
      ctx.fillRect(x, 0, grosor, h);
    }
    ctx.fillRect(0, 0, w, grosor);
    ctx.fillRect(0, h - grosor, w, grosor);
  };
}

export function dibujarFoto(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#8ec5e8");
  g.addColorStop(1, "#e8d2a6");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#5b4636";
  ctx.beginPath();
  ctx.arc(w * 0.4, h * 0.55, w * 0.12, 0, Math.PI * 2);
  ctx.arc(w * 0.62, h * 0.58, w * 0.1, 0, Math.PI * 2);
  ctx.fill();
}

/** Directorio de extensiones pegado en la mampara (F4-01): sale de personajes.yaml, como el del teléfono. */
export function dibujarDirectorio(filas: ReadonlyArray<readonly [string, string]>) {
  return (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#222";
    ctx.font = `bold 24px ${SANS}`;
    ctx.fillText("EXTENSIONES", 16, 34);
    ctx.font = `19px ${MONO}`;
    filas.forEach(([quien, ext], i) => {
      const y = 70 + i * 27;
      ctx.textAlign = "left";
      ctx.fillText(quien, 16, y);
      ctx.textAlign = "right";
      ctx.fillText(ext, w - 16, y);
    });
    ctx.textAlign = "left";
  };
}
