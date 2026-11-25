import { usePartida } from "./game/partidaStore";
import { favoresPizarron, renglonesPizarron } from "./game/pizarron";
import { useEscena, type Vista } from "./game/store";
import { Escena } from "./scene/Escena";
import { setTestHook } from "./test-hooks";
import { Capas } from "./ui/Capas";

setTestHook("setVista", (v) => useEscena.getState().setVista(v as Vista));
setTestHook("mirar", (x, y) => useEscena.getState().setMirarForzado({ x, y }));
setTestHook("responder", (m, o, v) => usePartida.getState().responder(m, o, v));
setTestHook("dialogo", () => usePartida.getState().dialogos[0] ?? null);
setTestHook("pizarron", () => {
  const { pendientes } = usePartida.getState();
  return {
    renglones: renglonesPizarron(pendientes).map((r) => `[${r.hecho ? "x" : " "}] ${r.texto}`),
    favores: favoresPizarron(pendientes),
  };
});
setTestHook("hora", (hhmm) => {
  const [h = 0, m = 0] = hhmm.split(":").map(Number);
  usePartida.setState({ minuto: h * 60 + m });
});
setTestHook("partida", () => {
  const s = usePartida.getState();
  return {
    mision: s.jornada.actual()?.mision.id ?? null,
    pendientes: s.pendientes.map((p) => `${p.cumplido ? "x" : " "} ${p.mision}/${p.id}`),
    eventos: s.eventos.map((e) => e.tipo),
    nombre: s.nombre,
    codigo: s.codigo,
    guardado: s.guardado,
  };
});

export function App() {
  return (
    <div className="juego">
      <Escena />
      <Capas />
    </div>
  );
}
