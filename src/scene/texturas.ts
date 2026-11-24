/** Dibujos 2D para texturas del cubículo (spike F0-07). Fuentes del sistema: no se descarga nada. */

const MONO = "ui-monospace, 'DejaVu Sans Mono', monospace";
const SANS = "system-ui, 'DejaVu Sans', sans-serif";
const MANO = "'Comic Neue', 'Segoe Print', 'DejaVu Sans', cursive";

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

export function dibujarCalendario(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = "#f6f3ec";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#e0702b";
  ctx.fillRect(0, 0, w, 70);
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold 34px ${SANS}`;
  ctx.fillText("NOVIEMBRE 2026", 22, 48);
  const dias = ["L", "M", "M", "J", "V", "S", "D"];
  const celda = w / 7;
  ctx.font = `bold 22px ${SANS}`;
  ctx.fillStyle = "#555";
  dias.forEach((d, i) => {
    ctx.fillText(d, i * celda + celda / 2 - 7, 100);
  });
  // Semana del 26 oct al 16 nov (4 filas).
  const fechas = [26, 27, 28, 29, 30, 31, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
  ctx.font = `24px ${SANS}`;
  fechas.forEach((f, i) => {
    const col = i % 7;
    const fila = Math.floor(i / 7);
    const x = col * celda + 10;
    const y = 140 + fila * 92;
    ctx.strokeStyle = "#d8d2c4";
    ctx.strokeRect(col * celda, y - 30, celda, 92);
    ctx.fillStyle = col >= 5 ? "#9a9a9a" : "#222";
    ctx.fillText(String(f), x, y);
    if (i >= 2 && i <= 6 && col < 5) {
      ctx.fillStyle = "#e0a400";
      ctx.fillText("★★★", x, y + 34);
    }
    if (f === 3 && i > 6) {
      ctx.strokeStyle = "#c0392b";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(x + 14, y - 8, 26, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 1;
    }
    if (f === 7) {
      ctx.fillStyle = "#3d5a80";
      ctx.font = `16px ${SANS}`;
      ctx.fillText("T. extra", x, y + 34);
      ctx.font = `24px ${SANS}`;
    }
  });
}

export function dibujarPizarron(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = "#f4f5f1";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#1f3b73";
  ctx.font = `bold 40px ${MANO}`;
  ctx.fillText("PENDIENTES", 30, 60);
  const items = [
    ["✓ Leer LEEME.txt", true],
    ["✓ Ticket de Karla", true],
    ["□ ¿Qué dice la Línea 3?", false],
    ["□ Pregúntale al manual", false],
  ] as const;
  ctx.font = `30px ${MANO}`;
  items.forEach(([t, hecho], i) => {
    const y = 120 + i * 56;
    ctx.fillStyle = hecho ? "#2e7d32" : "#1f3b73";
    ctx.fillText(t, 36, y);
    if (hecho) {
      ctx.strokeStyle = "#c62828";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(70, y - 10);
      ctx.lineTo(70 + ctx.measureText(t).width - 30, y - 10);
      ctx.stroke();
    }
  });
}

export function dibujarPostIt(texto: string[]) {
  return (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.fillStyle = "#f4d35e";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#3a3320";
    ctx.font = `26px ${MANO}`;
    texto.forEach((t, i) => {
      ctx.fillText(t, 14, 44 + i * 34);
    });
  };
}

export function dibujarGafete(ctx: CanvasRenderingContext2D, w: number, h: number) {
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
  ctx.fillText("BECARIO", 96, 84);
  ctx.font = `18px ${MONO}`;
  ctx.fillText("K7QF-29XM-PL4D", 96, 118);
}

export function dibujarReloj(ctx: CanvasRenderingContext2D, w: number, h: number) {
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
    ctx.beginPath();
    ctx.moveTo(r, r);
    ctx.lineTo(r + Math.sin(ang) * largo, r - Math.cos(ang) * largo);
    ctx.stroke();
  };
  aguja(((7 + 5 / 60) / 12) * Math.PI * 2, r * 0.5, 10); // 19:05
  aguja((5 / 60) * Math.PI * 2, r * 0.75, 6);
  void h;
}

export function dibujarVentana(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#2b3a67");
  g.addColorStop(0.55, "#d9744a");
  g.addColorStop(0.8, "#f2b35b");
  g.addColorStop(1, "#6b4a3a");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#2d2320";
  // Siluetas de la planta y del desierto.
  ctx.beginPath();
  ctx.moveTo(0, h * 0.82);
  ctx.lineTo(w * 0.2, h * 0.78);
  ctx.lineTo(w * 0.45, h * 0.84);
  ctx.lineTo(w * 0.7, h * 0.76);
  ctx.lineTo(w, h * 0.8);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.fill();
  ctx.fillRect(w * 0.55, h * 0.62, w * 0.3, h * 0.2);
  ctx.fillRect(w * 0.62, h * 0.5, w * 0.03, h * 0.14);
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

export function dibujarDirectorio(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#222";
  ctx.font = `bold 24px ${SANS}`;
  ctx.fillText("EXTENSIONES", 16, 34);
  ctx.font = `20px ${MONO}`;
  const filas = [
    "Eduardo (Sist.) 214",
    "Don Chuy (Mtto) 301",
    "Karla (Calidad) 402",
    "Comedor         150",
    "Vigilancia      900",
    "Conmutador        0",
  ];
  filas.forEach((f, i) => {
    ctx.fillText(f, 16, 74 + i * 30);
  });
}
