import { usePartida } from "../game/partidaStore";
import { useEscena } from "../game/store";
import { Terminal } from "./Terminal";
import { Tickets } from "./Tickets";

/** Pantalla del monitor al acercarse: pestañas de apps sobre el rectángulo proyectado del monitor. */
export function Monitor() {
  const rect = useEscena((s) => s.rectMonitor);
  const app = useEscena((s) => s.app);
  const setApp = useEscena((s) => s.setApp);
  const abiertos = usePartida((s) => s.tickets.filter((t) => !t.resuelto).length);
  if (!rect) return null;
  return (
    <div className="monitor" style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }}>
      <div className="monitor-pestanas" role="tablist" aria-label="Apps del servidor">
        <button
          type="button"
          role="tab"
          aria-selected={app === "terminal"}
          onClick={() => setApp("terminal")}
        >
          Terminal
        </button>
        <button type="button" role="tab" aria-selected={app === "tickets"} onClick={() => setApp("tickets")}>
          Tickets{abiertos > 0 && <span className="insignia">{abiertos}</span>}
        </button>
      </div>
      <div className="monitor-app">{app === "terminal" ? <Terminal /> : <Tickets />}</div>
    </div>
  );
}
