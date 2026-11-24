import { type Curriculo, codigoDeId, compararMisiones, type Personajes } from "./curriculo";
import type { Mision } from "./esquema";
import type { Hallazgo } from "./harness";

/** Reglas del harness que usan el currículo y los personajes (C6, C7, C9, C10, C15, C16, C18). */

/** Escapa todos los metacaracteres de una expresión regular (incluida la diagonal invertida). */
function escaparRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function codigoDisponible(d: string): string {
  return /^T\d+-M\d+$/.test(d) ? d : codigoDeId(d);
}

/** Momento en que el jugador puede hacer la misión (los favores, desde disponible_desde). */
function momento(m: Mision): string {
  return m.tipo === "favor" && m.disponible_desde ? codigoDisponible(m.disponible_desde) : codigoDeId(m.id);
}

function textosVisibles(m: Mision): string[] {
  return [
    ...m.briefing.map((b) => b.texto),
    ...m.objetivos.flatMap((o) => [o.pendiente, ...o.pistas]),
    ...Object.values(m.eventos ?? {}).flatMap((es) => es.flatMap((e) => ("texto" in e ? [e.texto] : []))),
  ];
}

export function revisarConCurriculo(m: Mision, c: Curriculo, p?: Personajes): Hallazgo[] {
  const h: Hallazgo[] = [];
  const error = (regla: string, mensaje: string) => h.push({ regla, severidad: "error", mensaje });
  const aviso = (regla: string, mensaje: string) => h.push({ regla, severidad: "aviso", mensaje });
  const codigo = codigoDeId(m.id);
  const cuando = momento(m);

  // C10: referencias a conceptos y personajes.
  const conceptos = [
    ...m.ensena,
    ...m.requiere,
    ...(m.refuerza ?? []),
    ...(m.libreta ?? []).flatMap((l) => (l.concepto ? [l.concepto] : [])),
  ];
  for (const k of conceptos)
    if (!c.conceptos[k]) error("C10", `concepto inexistente en content/curriculo.yaml: ${k}`);
  if (p) {
    const quienes = [
      ...m.briefing.map((b) => b.quien),
      ...Object.values(m.eventos ?? {}).flatMap((es) => es.flatMap((e) => ("de" in e ? [e.de] : []))),
    ];
    for (const q of quienes)
      if (!p.personajes[q]) error("C10", `personaje inexistente en content/personajes.yaml: ${q}`);
  }

  // C7: lo que enseña coincide con el currículo.
  for (const k of m.ensena) {
    const con = c.conceptos[k];
    if (con && con.mision !== codigo)
      error("C7", `${k} se enseña en ${con.mision} según el currículo, no en ${codigo}`);
  }

  // C6: los prerequisitos (y lo que refuerza un favor) ya se enseñaron.
  for (const k of [...m.requiere, ...(m.refuerza ?? [])]) {
    const con = c.conceptos[k];
    if (con && compararMisiones(con.mision, cuando) >= 0)
      error("C6", `${k} se enseña en ${con.mision}, después de ${cuando}`);
  }

  // C16: un favor llega 1–2 misiones después del concepto más reciente que refuerza.
  if (m.tipo === "favor" && m.refuerza?.length) {
    const principales = [...new Set(Object.values(c.conceptos).map((x) => x.mision))].sort(compararMisiones);
    const ultimo = m.refuerza
      .map((k) => c.conceptos[k]?.mision)
      .filter((x): x is string => !!x)
      .sort(compararMisiones)
      .pop();
    if (ultimo) {
      const distancia = principales.indexOf(cuando) - principales.indexOf(ultimo);
      if (principales.indexOf(cuando) < 0 || distancia < 1 || distancia > 2) {
        error("C16", `el favor aparece en ${cuando}; debe ser 1–2 misiones después de ${ultimo}`);
      }
    }
  }

  // C15: el diálogo no regala la solución.
  const comandos = m.objetivos.flatMap((o) =>
    [...(o.pistas[2] ?? "").matchAll(/`([^`]+)`/g)].map((x) => x[1] as string),
  );
  for (const b of m.briefing)
    for (const cmd of comandos)
      if (b.texto.includes(cmd)) aviso("C15", `el briefing contiene la solución "${cmd}"`);

  // C18: valores que dependen de la semilla escritos a mano (IPs, horas y enteros grandes).
  const textos = textosVisibles(m).join("\n");
  for (const [nombre, g] of Object.entries(m.variables ?? {})) {
    if (g.tipo === "ip") {
      const base = g.red.split("/")[0]?.split(".").slice(0, 3).join(".") ?? "";
      for (const ip of textos.match(new RegExp(`${escaparRegex(base)}\\.(\\d+)`, "g")) ?? []) {
        const oct = Number(ip.split(".")[3]);
        if (oct >= g.min && oct <= g.max) error("C18", `"${ip}" debería ser {{${nombre}}}`);
      }
    } else if (g.tipo === "entero" && g.min >= 100) {
      for (const n of textos.match(/\d+/g) ?? []) {
        if (Number(n) >= g.min && Number(n) <= g.max) error("C18", `"${n}" debería ser {{${nombre}}}`);
      }
    } else if (g.tipo === "hora") {
      for (const hora of textos.match(/\b\d{2}:\d{2}(:\d{2})?\b/g) ?? []) {
        const s = hora.length === 5 ? `${hora}:00` : hora;
        if (s >= g.desde && s <= g.hasta) error("C18", `"${hora}" debería ser {{${nombre}}}`);
      }
    }
  }
  return h;
}

/** C9: cada concepto enseñado se repasa al menos 2 veces después (solo con contenido de varios turnos). */
export function revisarRepasos(misiones: readonly Mision[]): Hallazgo[] {
  const turnos = new Set(misiones.map((m) => m.turno));
  if (turnos.size < 2) return [];
  const h: Hallazgo[] = [];
  for (const m of misiones) {
    if (m.turno === 13) continue;
    for (const k of m.ensena) {
      const usos = misiones.filter(
        (o) =>
          compararMisiones(momento(o), codigoDeId(m.id)) > 0 &&
          [...o.requiere, ...(o.refuerza ?? [])].includes(k),
      ).length;
      if (usos < 2)
        h.push({ regla: "C9", severidad: "aviso", mensaje: `${k} (de ${m.id}) se repasa ${usos} vez/veces` });
    }
  }
  return h;
}
