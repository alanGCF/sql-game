import type { ResultadoLinea, Shell } from "../index";
import { crearRng, subSemilla } from "../rng";
import { plantilla, resolverVariables, type Variables } from "../vars";
import { agregarEntradas, type Entrada, normalizar, type Vfs } from "../vfs";
import { aplicarDiferencias, type DiffVfs, diferencias } from "../vfs-diff";
import type { Mision } from "./esquema";
import { GENERADORES } from "./generadores";
import { evaluar, NoImplementado } from "./predicados";

export type Efecto = NonNullable<Mision["eventos"]>[string][number];

export interface Avance {
  /** Objetivos que se cumplieron con esta acción. */
  cumplidos: string[];
  completada: boolean;
  efectos: Efecto[];
}

export interface Pista {
  nivel: 1 | 2 | 3;
  texto: string;
}

export interface GuardadoMision {
  id: string;
  cumplidos: string[];
  respuestas: Record<string, string>;
  pistas: Record<string, number>;
  diff: DiffVfs;
  historial: string[];
  cwd: string;
}

/**
 * Una misión en curso sobre el mundo de la partida: aplica parches, evalúa objetivos por resultado
 * después de cada acción, dispara eventos, da pistas por nivel, califica y se puede restaurar o guardar.
 */
export class MisionEnCurso {
  readonly cumplidos = new Set<string>();
  readonly respuestas = new Map<string, string>();
  readonly pistasUsadas = new Map<string, number>();
  readonly vars: Variables;
  private readonly base: Vfs;
  private completada = false;

  constructor(
    readonly mision: Mision,
    readonly shell: Shell,
    semilla: number,
    varsPartida: Variables,
    readonly flags: Set<string>,
  ) {
    this.vars = { ...varsPartida, ...resolverVariables(semilla, mision.variables ?? {}) };
    this.aplicarParches(semilla);
    this.base = shell.mundo.vfs.clone();
    this.colocarSesion();
  }

  private texto(t: string): string {
    return plantilla(t, this.vars);
  }

  private aplicarParches(semilla: number): void {
    const vfs = this.shell.mundo.vfs;
    const ahora = this.shell.mundo.reloj.now();
    for (const p of this.mision.mundo?.parches ?? []) {
      if (p.tipo === "archivo" || p.tipo === "carpeta") {
        const e: Entrada = { ruta: p.tipo === "carpeta" ? `${p.ruta.replace(/\/$/, "")}/` : p.ruta };
        if (p.tipo === "archivo" && p.contenido !== undefined) e.contenido = this.texto(p.contenido);
        if (p.propietario) e.dueno = p.propietario;
        if (p.tipo === "archivo" && p.grupo) e.grupo = p.grupo;
        if (p.modo) e.modo = p.modo.replace(/^0(?=\d{3}$)/, "");
        if (p.tipo === "archivo" && p.modificado) e.mtime = `${p.modificado.replace(/Z?$/, "")}Z`;
        agregarEntradas(vfs, [e], ahora);
      } else if (p.tipo === "borrar") {
        if (vfs.exists(p.ruta)) vfs.remove(p.ruta, { name: "root", groups: ["root"], home: "/root" }, true);
      } else if (p.tipo === "generador") {
        const gen = GENERADORES[p.generador];
        if (!gen) throw new NoImplementado(`generador desconocido: ${p.generador}`);
        const cantidad = Number(this.texto(String(p.cantidad)));
        const rng = crearRng(subSemilla(semilla, `${this.mision.id}:${p.generador}`));
        agregarEntradas(vfs, gen(rng, p.destino, cantidad, this.mision.usuario_inicial), ahora);
      } else {
        throw new NoImplementado("parches SQL llegan con el motor SQL (F5)");
      }
    }
  }

  private colocarSesion(): void {
    const s = this.shell.sesion;
    s.cwd = this.mision.cwd_inicial;
    s.env.set("PWD", s.cwd);
  }

  /** Diálogo inicial con las variables ya sustituidas. */
  briefing(): { quien: string; texto: string }[] {
    return this.mision.briefing.map((b) => ({ quien: b.quien, texto: this.texto(b.texto) }));
  }

  pendientes(): { id: string; pendiente: string; cumplido: boolean }[] {
    return this.mision.objetivos.map((o) => ({
      id: o.id,
      pendiente: this.texto(o.pendiente),
      cumplido: this.cumplidos.has(o.id),
    }));
  }

  efectosAlIniciar(): Efecto[] {
    return this.mision.eventos?.al_iniciar ?? [];
  }

  private async revisar(): Promise<Avance> {
    const nuevos: string[] = [];
    const efectos: Efecto[] = [];
    const estado = { shell: this.shell, respuestas: this.respuestas, flags: this.flags };
    for (const o of this.mision.objetivos) {
      if (this.cumplidos.has(o.id)) continue;
      if (await evaluar(o.cuando, estado, o.id)) {
        this.cumplidos.add(o.id);
        nuevos.push(o.id);
        efectos.push(...(this.mision.eventos?.[`al_cumplir:${o.id}`] ?? []));
      }
    }
    const ahoraCompleta = this.cumplidos.size === this.mision.objetivos.length;
    if (ahoraCompleta && !this.completada) {
      this.completada = true;
      efectos.push(...(this.mision.eventos?.al_completar ?? []));
    }
    for (const e of efectos) if (e.tipo === "flag") this.flags.add(e.nombre);
    return {
      cumplidos: nuevos,
      completada: this.completada,
      efectos: efectos.map((e) => this.efectoConTexto(e)),
    };
  }

  private efectoConTexto(e: Efecto): Efecto {
    return "texto" in e ? { ...e, texto: this.texto(e.texto) } : e;
  }

  async ejecutar(linea: string): Promise<ResultadoLinea & Avance> {
    const r = await this.shell.ejecutar(linea);
    if (!r.ejecutada) return { ...r, cumplidos: [], completada: this.completada, efectos: [] };
    return { ...r, ...(await this.revisar()) };
  }

  async responder(objetivo: string, valor: string): Promise<Avance & { correcta: boolean }> {
    if (!this.mision.objetivos.some((o) => o.id === objetivo))
      throw new Error(`objetivo inexistente: ${objetivo}`);
    this.respuestas.set(objetivo, valor.slice(0, 200));
    const avance = await this.revisar();
    return { ...avance, correcta: this.cumplidos.has(objetivo) };
  }

  /** Siguiente nivel de pista del objetivo (Eduardo por teléfono); null si ya dio las tres. */
  pista(objetivo: string): Pista | null {
    const o = this.mision.objetivos.find((x) => x.id === objetivo);
    if (!o) throw new Error(`objetivo inexistente: ${objetivo}`);
    const usado = this.pistasUsadas.get(objetivo) ?? 0;
    if (usado >= 3) return null;
    const nivel = (usado + 1) as 1 | 2 | 3;
    this.pistasUsadas.set(objetivo, nivel);
    return { nivel, texto: this.texto(o.pistas[nivel - 1] ?? "") };
  }

  /** ★★★ sin pistas · ★★ con pistas de nivel 1–2 · ★ si usó alguna de nivel 3 (D-09). */
  estrellas(): 1 | 2 | 3 {
    const max = Math.max(0, ...this.pistasUsadas.values());
    return max === 0 ? 3 : max >= 3 ? 1 : 2;
  }

  /** Regresa el mundo y el avance al inicio de la misión. Las pistas usadas se conservan. */
  restaurar(): void {
    const vfs = this.shell.mundo.vfs;
    const copia = this.base.clone();
    vfs.root.children = copia.root.children;
    Object.assign(vfs.root, { mode: copia.root.mode, owner: copia.root.owner, mtime: copia.root.mtime });
    this.shell.registro.leidos.clear();
    this.shell.registro.cambiados.clear();
    this.cumplidos.clear();
    this.respuestas.clear();
    this.completada = false;
    this.colocarSesion();
  }

  guardar(): GuardadoMision {
    return {
      id: this.mision.id,
      cumplidos: [...this.cumplidos],
      respuestas: Object.fromEntries(this.respuestas),
      pistas: Object.fromEntries(this.pistasUsadas),
      diff: diferencias(this.base, this.shell.mundo.vfs),
      historial: [...this.shell.sesion.historial],
      cwd: this.shell.sesion.cwd,
    };
  }

  /** Aplica un guardado sobre una misión recién iniciada con la misma semilla. */
  cargar(g: GuardadoMision): void {
    if (g.id !== this.mision.id) throw new Error(`el guardado es de otra misión: ${g.id}`);
    const reconstruido = aplicarDiferencias(this.base, g.diff);
    this.shell.mundo.vfs.root.children = reconstruido.root.children;
    for (const c of g.cumplidos) this.cumplidos.add(c);
    for (const [k, v] of Object.entries(g.respuestas)) this.respuestas.set(k, v);
    for (const [k, v] of Object.entries(g.pistas)) this.pistasUsadas.set(k, v);
    this.completada = this.cumplidos.size === this.mision.objetivos.length;
    this.shell.sesion.historial.splice(0, Infinity, ...g.historial);
    this.shell.sesion.cwd = normalizar("/", g.cwd);
    this.shell.sesion.env.set("PWD", this.shell.sesion.cwd);
  }
}
