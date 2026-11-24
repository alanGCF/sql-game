import { useMemo } from "react";
import { useEscena, type Vista } from "./game/store";
import { Escena } from "./scene/Escena";
import { estiloDesdeUrl } from "./scene/estilos";
import { setTestHook } from "./test-hooks";
import { Capas } from "./ui/Capas";

setTestHook("setVista", (v) => useEscena.getState().setVista(v as Vista));
setTestHook("mirar", (x, y) => useEscena.getState().setMirarForzado({ x, y }));

export function App() {
  const estilo = useMemo(estiloDesdeUrl, []);
  return (
    <div className={`juego estilo-${estilo.id}`}>
      <Escena estilo={estilo} />
      <Capas />
    </div>
  );
}
