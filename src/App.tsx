import { useMemo } from "react";
import { usePartida } from "./game/partidaStore";
import { useEscena, type Vista } from "./game/store";
import { Escena } from "./scene/Escena";
import { estiloDesdeUrl } from "./scene/estilos";
import { setTestHook } from "./test-hooks";
import { Capas } from "./ui/Capas";

setTestHook("setVista", (v) => useEscena.getState().setVista(v as Vista));
setTestHook("mirar", (x, y) => useEscena.getState().setMirarForzado({ x, y }));
setTestHook("responder", (m, o, v) => usePartida.getState().responder(m, o, v));
setTestHook("partida", () => {
  const s = usePartida.getState();
  return {
    mision: s.jornada.actual()?.mision.id ?? null,
    pendientes: s.pendientes.map((p) => `${p.cumplido ? "x" : " "} ${p.mision}/${p.id}`),
    eventos: s.eventos.map((e) => e.tipo),
  };
});

export function App() {
  const estilo = useMemo(estiloDesdeUrl, []);
  return (
    <div className={`juego estilo-${estilo.id}`}>
      <Escena estilo={estilo} />
      <Capas />
    </div>
  );
}
