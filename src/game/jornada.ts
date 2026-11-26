import type { ResultadoLinea, Shell } from "../engine";
import { inicioTurno } from "../engine/calendario";
import { elegirLlamada, type GuionLlamadas, type Llamada } from "../engine/llamadas";
import type { TurnoCompilado } from "../engine/mision/compilar";
import type { Mision } from "../engine/mision/esquema";
import { type Avance, type AvanceMision, type Efecto, MisionEnCurso } from "../engine/mision/runtime";
import { crearShellBase, type MundoBase } from "../engine/mundo-base";
import type { Variables } from "../engine/vars";
import type { Vfs } from "../engine/vfs";
import { aplicarDiferencias, type DiffVfs, diferencias } from "../engine/vfs-diff";

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
/** Lo que se guarda de un turno a medias (F4-12): el mundo como diferencias contra el mundo base. */
export interface EstadoJornada {
  reloj: number;
  mundo: DiffVfs;
  /** Misión principal en curso; null con el turno terminado. */
  mision: AvanceMision | null;
  completadas: Record<string, 1 | 2 | 3>;
  /** Favores terminados (los que van a medias se reinician al cargar). */
  favores: string[];
  flags: string[];
  /** Llamadas del jugador a cada contacto en el turno: lo que lleva gastado de su paciencia (F4-02). */
  llamadas: Record<string, number>;
}

/** Minuto del día en que entra el turno vespertino (15:30). */
const ENTRADA = 15 * 60 + 30;
/** Una llamada contestada toma 2 minutos de reloj de juego. */
const SEGUNDOS_POR_LLAMADA = 120;
/** Cerrar todas las misiones principales lleva el reloj hasta las 23:30 (deja aire para el cierre). */
const MINUTOS_DE_MISIONES = 8 * 60;

export class Jornada {
  private indice = -1;
  private principal: MisionEnCurso | null = null;
  private readonly favores: MisionEnCurso[] = [];
  private readonly cola: EventoJornada[] = [];
  private readonly hechas = new Map<string, 1 | 2 | 3>();
  private readonly favoresHechos: string[] = [];
  private readonly llamadas = new Map<string, number>();
  /** El mundo base con la semilla, antes de cualquier misión: contra él se guardan las diferencias. */
  private readonly mundoInicial: Vfs;

  private constructor(
    readonly turno: TurnoCompilado,
    readonly shell: Shell,
    private readonly semilla: number,
    private readonly vars: Variables,
    readonly flags: Set<string>,
  ) {
    this.mundoInicial = shell.mundo.vfs.clone();
  }

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

  /**
   * Retoma un turno guardado: reconstruye el mundo, el reloj, la misión en curso y su avance, y los favores
   * pendientes (desde cero). No vuelve a encolar briefings ni diálogos.
   */
  static restaurar(turno: TurnoCompilado, mundo: MundoBase, semilla: number, e: EstadoJornada): Jornada {
    const indice = e.mision ? turno.misiones.findIndex((m) => m.id === e.mision?.id) : turno.misiones.length;
    if (indice < 0) throw new Error(`la partida va en una misión que ya no existe: ${e.mision?.id}`);
    const ref = turno.misiones[Math.min(indice, turno.misiones.length - 1)];
    if (!ref) throw new Error(`el turno ${turno.turno} no tiene misiones`);
    const { shell, vars } = crearShellBase(mundo, semilla, {
      host: ref.host_inicial,
      usuario: ref.usuario_inicial,
      ahora: inicioTurno(turno.turno),
    });
    const j = new Jornada(turno, shell, semilla, vars, new Set(e.flags));
    shell.mundo.vfs.root.children = aplicarDiferencias(j.mundoInicial, e.mundo).root.children;
    const falta = e.reloj - shell.mundo.reloj.now();
    if (falta > 0) shell.mundo.reloj.avanzar(falta / 1000);
    for (const [id, estrellas] of Object.entries(e.completadas)) j.hechas.set(id, estrellas);
    j.favoresHechos.push(...e.favores);
    for (const [id, n] of Object.entries(e.llamadas)) j.llamadas.set(id, n);
    j.indice = indice;
    if (e.mision) {
      j.principal = new MisionEnCurso(ref, shell, semilla, vars, j.flags, { restaurando: true });
      j.principal.cargarAvance(e.mision);
    }
    // Favores ya ofrecidos (su misión de arranque ya empezó) y sin terminar: sus parches ya están en el mundo.
    const inicioDe = (id: string) => turno.misiones.findIndex((m) => m.id === id);
    for (const f of turno.favores) {
      const desde = f.disponible_desde ? inicioDe(f.disponible_desde) : -1;
      if (desde >= 0 && desde <= indice && !j.favoresHechos.includes(f.id))
        j.favores.push(
          new MisionEnCurso(f, shell, semilla, vars, j.flags, { colocarSesion: false, restaurando: true }),
        );
    }
    return j;
  }

  guardar(): EstadoJornada {
    return {
      reloj: this.shell.mundo.reloj.now(),
      mundo: diferencias(this.mundoInicial, this.shell.mundo.vfs),
      mision: this.principal?.avance() ?? null,
      completadas: Object.fromEntries(this.hechas),
      favores: [...this.favoresHechos],
      flags: [...this.flags],
      llamadas: Object.fromEntries(this.llamadas),
    };
  }

  /** Misiones y favores terminados en el turno, con sus estrellas. */
  completadas(): Record<string, 1 | 2 | 3> {
    return Object.fromEntries(this.hechas);
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

  /**
   * El jugador llama a un contacto (F4-02): gasta su paciencia del turno y elige qué dice. Si contesta, deja
   * la bandera llamo_<contacto> (T0 pide marcarle a Eduardo), toma 2 minutos y se revisan los objetivos.
   */
  async llamar(
    contacto: string,
    guion: GuionLlamadas,
    paciencia: number,
  ): Promise<{ llamada: Llamada; eventos: EventoJornada[] }> {
    const n = (this.llamadas.get(contacto) ?? 0) + 1;
    this.llamadas.set(contacto, n);
    const llamada = elegirLlamada(guion, {
      turno: this.turno.turno,
      llamada: n,
      paciencia,
      flags: this.flags,
      semilla: this.semilla,
    });
    if (llamada.tipo !== "no_contesta") {
      this.shell.mundo.reloj.avanzar(SEGUNDOS_POR_LLAMADA);
      await this.decidir(`llamo_${contacto}`);
    }
    return { llamada, eventos: this.tomarEventos() };
  }

  /** Una bandera nueva por algo que el jugador eligió (opción de una llamada); revisa los objetivos. */
  async decidir(flag: string): Promise<EventoJornada[]> {
    this.flags.add(flag);
    for (const mc of this.activas()) this.registrar(mc, await mc.revisar());
    return this.tomarEventos();
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
    const estrellas = mc.estrellas();
    this.hechas.set(id, estrellas);
    this.cola.push({ tipo: "mision_completada", mision: id, estrellas, favor });
    if (favor) {
      this.favores.splice(this.favores.indexOf(mc), 1);
      this.favoresHechos.push(id);
    } else {
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
