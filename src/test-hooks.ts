/** Ganchos para pruebas E2E. Solo se exponen con ?test=1 (ver docs/plan/07-calidad-harness.md §5). */
export interface TestHooks {
  webgl: boolean;
  ready: boolean;
  info?: () => { calls: number; triangles: number };
  setVista?: (vista: string) => void;
  mirar?: (x: number, y: number) => void;
  /** Responde un objetivo (mientras llega la app Tickets, F3-03). */
  responder?: (mision: string, objetivo: string, valor: string) => Promise<{ correcta: boolean }>;
  partida?: () => { mision: string | null; pendientes: string[]; eventos: string[] };
}

declare global {
  interface Window {
    __planta7?: TestHooks;
  }
}

export const isTestMode = new URLSearchParams(window.location.search).has("test");

export function setTestHook<K extends keyof TestHooks>(key: K, value: TestHooks[K]): void {
  if (!isTestMode) return;
  window.__planta7 ??= { webgl: false, ready: false };
  window.__planta7[key] = value;
}
