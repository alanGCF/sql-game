import { describe, expect, it } from "vitest";
import { COMANDOS } from "../../src/engine/commands";
import { PAGINAS } from "../../src/engine/commands/man";
import { SUPERFICIE } from "../../src/engine/shell/superficie";

describe("man: cada comando del motor tiene su página", () => {
  it.each([...COMANDOS.keys()])("man %s", (nombre) => {
    const p = PAGINAS[nombre];
    expect(p, `falta la página de ${nombre}`).toBeDefined();
    expect(p?.nombre.startsWith(`${nombre} - `)).toBe(true);
  });

  it.each(Object.entries(SUPERFICIE).filter(([n]) => COMANDOS.has(n)))(
    "las opciones de %s en su página son las de la superficie",
    (nombre, spec) => {
      const enPagina = (PAGINAS[nombre]?.opciones ?? []).flatMap(([o]) =>
        [...o.matchAll(/(?<![\w-])-([a-zA-Z0-9])\b/g)].map((m) => m[1]),
      );
      for (const letra of enPagina) expect(spec.cortas, `${nombre}: -${letra}`).toContain(letra);
    },
  );
});
