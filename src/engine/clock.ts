/** Reloj de juego: avanza con las acciones del jugador, no con el tiempo real (ADR-008). */
export class GameClock {
  constructor(private ms: number) {}

  static desde(iso: string): GameClock {
    return new GameClock(Date.parse(iso));
  }

  now(): number {
    return this.ms;
  }

  avanzar(segundos: number): void {
    this.ms += segundos * 1000;
  }
}
