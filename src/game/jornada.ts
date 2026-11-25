import type { ResultadoLinea, Shell } from "../engine";
import { inicioTurno } from "../engine/calendario";
import type { TurnoCompilado } from "../engine/mision/compilar";
import type { Mision } from "../engine/mision/esquema";
import { type Avance, type Efecto, MisionEnCurso } from "../engine/mision/runtime";
import { crearShellBase, type MundoBase } from "../engine/mundo-base";
import type { Variables } from "../engine/vars";

/** Lo que la interfaz tiene que mostrar, en orden. */
export type EventoJornada =
  | { tipo: "mision_iniciada"; mision: string; titulo: string; favor: boolean }
  | { tipo: "dialogo"; mision: string; entrega: Mision["entrega"]; quien: string; texto: string }
  | { tipo: "objetivo_cumplido"; mision: string; objetivo: string; pendiente: string }
  | { tipo: "efecto"; mision: string; efecto: Efecto }
  | { tipo: "mision_completada"; mision: string; estrellas: 1 | 2 | 3; favor: boolean }
  | { tipo: "turno_completado"; turno: TurnoCompilado["turno"] };

/**
 * Orquestador de un turno (F3-01): un solo mundo por partida que persiste entre misiones, misiones
 * principales en orden, favores que se activan al iniciar la misión de su `disponible_desde`, y una
 * cola de eventos para la interfaz. Sin DOM ni React.
 */
/** Minuto del día en que entra el turno vespertino (15:30). */
const ENTRADA = 15 * 60 + 30;
/** Cerrar todas las misiones principales lleva el reloj hasta las 23:30 (deja aire para el cierre). */
const MINUTOS_DE_MISIONES = 8 * 60;

export class Jornada {
  private indice = -1;
  private principal: MisionEnCurso | null = null;
  private readonly favores: MisionEnCurso[] = [];
  private readonly cola: EventoJornada[] = [];

  private constructor(
    readonly turno: TurnoCompilado,
    readonly shell: Shell,
    private readonly semilla: number,
    private readonly vars: Variables,
    readonly flags: Set<string>,
  ) {}

  static iniciar(
    turno: TurnoCompilado,
    mundo: MundoBase,
    semilla: number,
    flags = new Set<string>(),
  ): Jornada {
    const primera = turno.misiones[0];
    if (!primera) throw new Error(`el turno ${turno.turno} no tiene misiones`);
    const { shell, vars } = crearShellBase(mundo, semilla, {
      host: primera.host_inicial,
      usuario: primera.usuario_inicial,
      ahora: inicioTurno(turno.turno),
    });
    const j = new Jornada(turno, shell, semilla, vars, flags);
    j.siguiente();
    return j;
  }

  actual(): MisionEnCurso | null {
    return this.principal;
  }

  favoresActivos(): readonly MisionEnCurso[] {
    return this.favores;
  }

  misionDe(id: string): MisionEnCurso | undefined {
    return [this.principal, ...this.favores].find((m) => m?.mision.id === id) ?? undefined;
  }

  turnoCompletado(): boolean {
    return this.indice >= this.turno.misiones.length;
  }

  /** Minutos desde las 00:00 del día del turno (24:00 = 1440): la escena ilumina con esto. */
  minutoDelDia(): number {
    const inicio = Date.parse(inicioTurno(this.turno.turno));
    return ENTRADA + (this.shell.mundo.reloj.now() - inicio) / 60_000;
  }

  /** Saca los eventos pendientes (p. ej. el briefing de la primera misión). */
  tomarEventos(): EventoJornada[] {
    return this.cola.splice(0);
  }

  async ejecutar(linea: string): Promise<{ resultado: ResultadoLinea; eventos: EventoJornada[] }> {
    const resultado = await this.shell.ejecutar(linea);
    if (resultado.ejecutada) for (const mc of this.activas()) this.registrar(mc, await mc.revisar());
    return { resultado, eventos: this.tomarEventos() };
  }

  async responder(
    misionId: string,
    objetivo: string,
    valor: string,
  ): Promise<{ correcta: boolean; comentario?: string; eventos: EventoJornada[] }> {
    const mc = this.misionDe(misionId);
    if (!mc) throw new Error(`la misión ${misionId} no está activa`);
    const r = await mc.responder(objetivo, valor);
    this.registrar(mc, r);
    return {
      correcta: r.correcta,
      ...(r.comentario ? { comentario: r.comentario } : {}),
      eventos: this.tomarEventos(),
    };
  }

  private activas(): MisionEnCurso[] {
    return [...(this.principal ? [this.principal] : []), ...this.favores];
  }

  private iniciarMision(m: Mision, favor: boolean): MisionEnCurso {
    // shortcut: los archivos leídos se reinician con cada misión principal; un favor a medias que dependa
    // de archivo_leido perdería esas lecturas. Ningún favor de T1 lo hace; revisar si alguno lo necesita.
    if (!favor) this.shell.registro.leidos.clear();
    const mc = new MisionEnCurso(m, this.shell, this.semilla, this.vars, this.flags, {
      colocarSesion: !favor,
    });
    this.cola.push({ tipo: "mision_iniciada", mision: m.id, titulo: m.titulo, favor });
    for (const b of mc.briefing())
      this.cola.push({ tipo: "dialogo", mision: m.id, entrega: m.entrega, ...b });
    return mc;
  }

  private siguiente(): void {
    this.indice++;
    const m = this.turno.misiones[this.indice];
    if (!m) {
      this.principal = null;
      this.cola.push({ tipo: "turno_completado", turno: this.turno.turno });
      return;
    }
    this.principal = this.iniciarMision(m, false);
    for (const f of this.turno.favores)
      if (f.disponible_desde === m.id) this.favores.push(this.iniciarMision(f, true));
  }

  private registrar(mc: MisionEnCurso, a: Avance): void {
    const id = mc.mision.id;
    const pendientes = mc.pendientes();
    for (const o of a.cumplidos) {
      const pendiente = pendientes.find((p) => p.id === o)?.pendiente ?? o;
      this.cola.push({ tipo: "objetivo_cumplido", mision: id, objetivo: o, pendiente });
    }
    for (const efecto of a.efectos) this.cola.push({ tipo: "efecto", mision: id, efecto });
    if (!a.completada || !a.cumplidos.length) return;
    const favor = mc !== this.principal;
    this.cola.push({ tipo: "mision_completada", mision: id, estrellas: mc.estrellas(), favor });
    if (favor) this.favores.splice(this.favores.indexOf(mc), 1);
    else {
      this.adelantarReloj();
      this.siguiente();
    }
  }

  /**
   * El reloj avanza con lo que haces (04-mecanicas.md): 15 s por comando y, al cerrar la misión k de n,
   * al menos hasta 15:30 + k/n del turno. Así la ventana pasa de la tarde a la noche aunque se teclee poco.
   */
  // shortcut: reparto uniforme por misión; revisar cuando F4 traiga eventos `reloj:HH:MM` y llamadas.
  private adelantarReloj(): void {
    const meta = ENTRADA + ((this.indice + 1) / this.turno.misiones.length) * MINUTOS_DE_MISIONES;
    const falta = meta - this.minutoDelDia();
    if (falta > 0) this.shell.mundo.reloj.avanzar(Math.round(falta * 60));
  }
}
