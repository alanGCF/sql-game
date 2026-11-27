import { type Ajustes, useAjustes } from "../game/ajustes";
import type { Ambiental } from "../game/ambientales";

/**
 * Sonido escaso (F4-10, D-19, direccion-arte.md §Audio): todo se sintetiza con Web Audio (sin archivos ni
 * descargas). Tres buses con su volumen (efectos, voces, ambiente) y el modo silencio. El contexto de audio
 * se crea con el primer gesto del jugador (política de autoplay de los navegadores).
 */
type Bus = "efectos" | "voces" | "ambiente";

let ctx: AudioContext | null = null;
let maestro: GainNode | null = null;
const buses: Partial<Record<Bus, GainNode>> = {};

function aplicarVolumenes(a: Ajustes): void {
  if (!ctx || !maestro) return;
  maestro.gain.value = a.silencio ? 0 : (a.general / 100) ** 2;
  for (const b of ["efectos", "voces", "ambiente"] as const) {
    const g = buses[b];
    if (g) g.gain.value = (a[b] / 100) ** 2;
  }
}

/** Crea el contexto si se puede (después de un gesto); null si el navegador no tiene audio. */
function contexto(): AudioContext | null {
  if (ctx) return ctx;
  const Ctor = window.AudioContext;
  if (!Ctor) return null;
  try {
    ctx = new Ctor();
  } catch {
    return null;
  }
  maestro = ctx.createGain();
  maestro.connect(ctx.destination);
  for (const b of ["efectos", "voces", "ambiente"] as const) {
    const g = ctx.createGain();
    g.connect(maestro);
    buses[b] = g;
  }
  aplicarVolumenes(useAjustes.getState());
  useAjustes.subscribe(aplicarVolumenes);
  return ctx;
}

/** Solo después de un gesto: si el contexto no existe todavía, el sonido simplemente no suena. */
function listo(): AudioContext | null {
  if (!ctx) return null;
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

if (typeof window !== "undefined") {
  const despertar = () => {
    contexto();
    if (ctx?.state === "suspended") void ctx.resume();
  };
  window.addEventListener("pointerdown", despertar, { capture: true });
  window.addEventListener("keydown", despertar, { capture: true });
}

/** Un tono con envolvente rápida. */
function tono(
  bus: Bus,
  frecuencia: number,
  inicio: number,
  duracion: number,
  volumen: number,
  forma: OscillatorType = "sine",
  destino?: AudioNode,
): void {
  const c = listo();
  const salida = destino ?? buses[bus];
  if (!c || !salida) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = forma;
  o.frequency.value = frecuencia;
  g.gain.setValueAtTime(0, inicio);
  g.gain.linearRampToValueAtTime(volumen, inicio + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, inicio + duracion);
  o.connect(g).connect(salida);
  o.start(inicio);
  o.stop(inicio + duracion + 0.02);
}

/** Ruido blanco filtrado (impresora, puerta, teclas). */
function ruido(
  bus: Bus,
  inicio: number,
  duracion: number,
  volumen: number,
  filtro: number,
  destino?: AudioNode,
): void {
  const c = listo();
  const salida = destino ?? buses[bus];
  if (!c || !salida) return;
  const largo = Math.max(1, Math.floor(c.sampleRate * duracion));
  const buffer = c.createBuffer(1, largo, c.sampleRate);
  const datos = buffer.getChannelData(0);
  // Ruido de interfaz (no del motor): Math.random no afecta el mundo ni la partida.
  for (let i = 0; i < largo; i++) datos[i] = Math.random() * 2 - 1;
  const fuente = c.createBufferSource();
  fuente.buffer = buffer;
  const f = c.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.value = filtro;
  const g = c.createGain();
  g.gain.setValueAtTime(volumen, inicio);
  g.gain.exponentialRampToValueAtTime(0.0001, inicio + duracion);
  fuente.connect(f).connect(g).connect(salida);
  fuente.start(inicio);
}

/** "A lo lejos": un poco a un lado y sin agudos. */
function lejos(pan: number): AudioNode | undefined {
  const c = listo();
  const bus = buses.ambiente;
  if (!c || !bus) return undefined;
  const filtro = c.createBiquadFilter();
  filtro.type = "lowpass";
  filtro.frequency.value = 1400;
  const p = c.createStereoPanner();
  p.pan.value = pan;
  filtro.connect(p).connect(bus);
  return filtro;
}

export const sonido = {
  /** Clic de un objeto o un botón. */
  clic(): void {
    const c = listo();
    if (c) tono("efectos", 620, c.currentTime, 0.06, 0.12);
  },
  /** Una tecla del teclado del escritorio (solo con "Que suene el teclado", D-19). */
  tecla(): void {
    const c = listo();
    if (c && useAjustes.getState().teclear) ruido("efectos", c.currentTime, 0.025, 0.05, 3000);
  },
  /** Objetivo cumplido: dos notas cortas, discretas. */
  logro(): void {
    const c = listo();
    if (!c) return;
    tono("efectos", 660, c.currentTime, 0.12, 0.08);
    tono("efectos", 880, c.currentTime + 0.1, 0.18, 0.08);
  },
  /** Timbre de tu teléfono (una ráfaga; quien llama lo repite mientras suena). */
  timbre(): void {
    const c = listo();
    if (!c) return;
    for (let i = 0; i < 8; i++) {
      tono("efectos", 440, c.currentTime + i * 0.05, 0.05, 0.08);
      tono("efectos", 480, c.currentTime + i * 0.05, 0.05, 0.08);
    }
  },
  /** Plumón sobre el pizarrón o lápiz sobre la libreta. */
  trazo(): void {
    const c = listo();
    if (c) ruido("efectos", c.currentTime, 0.4, 0.04, 2200);
  },
  /** Balbuceo de un personaje mientras aparece su globo: sílabas cortas con su tono de voz. */
  balbuceo(quien: string, texto: string): void {
    const c = listo();
    if (!c) return;
    const base = VOZ[quien] ?? 200;
    const silabas = Math.min(10, Math.max(2, Math.round(texto.length / 14)));
    let h = 0;
    for (let i = 0; i < texto.length; i++) h = (h * 31 + texto.charCodeAt(i)) >>> 0;
    for (let i = 0; i < silabas; i++) {
      const variacion = ((h >> (i % 24)) & 7) - 3;
      tono("voces", base * (1 + variacion * 0.04), c.currentTime + i * 0.085, 0.07, 0.07, "triangle");
    }
  },
  /** Algo a lo lejos en la planta (ver ambientales.ts). */
  ambiental(tipo: Ambiental): void {
    const c = listo();
    if (!c) return;
    const t = c.currentTime;
    const pan = ((t * 1000) % 2) - 1;
    const destino = lejos(pan * 0.6);
    if (!destino) return;
    switch (tipo) {
      case "impresora":
        for (let i = 0; i < 10; i++) ruido("ambiente", t + i * 0.28, 0.2, 0.06, 900, destino);
        break;
      case "telefono_lejano":
        for (let i = 0; i < 16; i++) {
          tono("ambiente", 440, t + i * 0.05, 0.05, 0.04, "sine", destino);
          tono("ambiente", 480, t + i * 0.05, 0.05, 0.04, "sine", destino);
        }
        break;
      case "voceo":
        tono("ambiente", 660, t, 0.5, 0.06, "sine", destino);
        tono("ambiente", 523, t + 0.45, 0.7, 0.06, "sine", destino);
        for (let i = 0; i < 10; i++)
          tono("ambiente", 170 + (i % 3) * 18, t + 1.2 + i * 0.12, 0.1, 0.03, "triangle", destino);
        break;
      case "montacargas":
        for (let i = 0; i < 3; i++) tono("ambiente", 1000, t + i * 0.5, 0.25, 0.04, "square", destino);
        break;
      case "puerta":
        tono("ambiente", 70, t, 0.4, 0.15, "sine", destino);
        ruido("ambiente", t, 0.15, 0.05, 500, destino);
        break;
    }
  },
};

/** Tono de voz de cada personaje (Hz). */
const VOZ: Record<string, number> = {
  companero: 175,
  don_chuy: 120,
  karla: 245,
  trevino: 150,
  comedor: 230,
  vigilancia: 135,
  conmutador: 260,
};
