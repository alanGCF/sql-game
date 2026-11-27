import { type Letra, useAjustes } from "../game/ajustes";

const LETRAS: [Letra, string][] = [
  ["normal", "Normal"],
  ["grande", "Grande"],
  ["muy-grande", "Muy grande"],
];

const VOLUMENES: ["general" | "efectos" | "voces" | "ambiente", string][] = [
  ["general", "Volumen general"],
  ["efectos", "Efectos (teclas, teléfono, plumón)"],
  ["voces", "Voces (balbuceo de quien habla)"],
  ["ambiente", "Ambiente (lo que suena a lo lejos)"],
];

/** Controles de accesibilidad (F3-08) y de sonido (F4-10). Se usan en el gafete y en el panel del juego. */
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
      <label className="ajuste">
        <input
          type="checkbox"
          checked={a.silencio}
          onChange={(e) => a.cambiar({ silencio: e.target.checked })}
        />
        Modo silencio (los subtítulos siguen saliendo)
      </label>
      <label className="ajuste">
        <input
          type="checkbox"
          checked={a.teclear}
          onChange={(e) => a.cambiar({ teclear: e.target.checked })}
        />
        Que suene el teclado al escribir
      </label>
      {VOLUMENES.map(([clave, texto]) => (
        <label key={clave} className="ajuste ajuste-volumen">
          <span>{texto}</span>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={a[clave]}
            disabled={a.silencio}
            onChange={(e) => a.cambiar({ [clave]: Number(e.target.value) })}
          />
        </label>
      ))}
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
