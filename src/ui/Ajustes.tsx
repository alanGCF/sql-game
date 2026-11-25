import { type Letra, useAjustes } from "../game/ajustes";

const LETRAS: [Letra, string][] = [
  ["normal", "Normal"],
  ["grande", "Grande"],
  ["muy-grande", "Muy grande"],
];

/** Controles de accesibilidad (F3-08). Se usan en el gafete y en el panel dentro del juego. */
export function ControlesAjustes() {
  const a = useAjustes();
  return (
    <div className="ajustes">
      <label className="ajuste">
        <input
          type="checkbox"
          checked={a.reducirMovimiento}
          onChange={(e) => a.cambiar({ reducirMovimiento: e.target.checked })}
        />
        Reducir movimiento (la cámara no se desliza)
      </label>
      <label className="ajuste">
        <input
          type="checkbox"
          checked={a.contrasteAlto}
          onChange={(e) => a.cambiar({ contrasteAlto: e.target.checked })}
        />
        Contraste alto
      </label>
      <fieldset className="ajuste">
        <legend>Tamaño de letra</legend>
        {LETRAS.map(([valor, texto]) => (
          <label key={valor}>
            <input
              type="radio"
              name="letra"
              value={valor}
              checked={a.letra === valor}
              onChange={() => a.cambiar({ letra: valor })}
            />
            {texto}
          </label>
        ))}
      </fieldset>
    </div>
  );
}
