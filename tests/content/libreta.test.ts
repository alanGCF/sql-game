import { existsSync, readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { COMANDOS } from "../../src/engine/commands";

const DIR = "content/libreta/comandos";
const SECCIONES = ["## Para qué sirve", "## Ejemplo", "## En este servidor", "## En tu Linux real"];

describe("libreta: una página por comando simulado (CLAUDE.md §Reglas de código)", () => {
  it.each([...COMANDOS.keys()])("%s tiene página con sus secciones", (nombre) => {
    const ruta = `${DIR}/${nombre}.md`;
    expect(existsSync(ruta), `falta ${ruta}`).toBe(true);
    const texto = readFileSync(ruta, "utf8");
    expect(texto.startsWith(`# \`${nombre}\`\n`)).toBe(true);
    for (const s of SECCIONES) expect(texto, `${ruta}: falta "${s}"`).toContain(`\n${s}\n`);
  });

  it("no hay páginas de comandos que el motor no tenga", () => {
    const paginas = readdirSync(DIR).map((f) => f.replace(/\.md$/, ""));
    expect(paginas.filter((p) => !COMANDOS.has(p))).toEqual([]);
  });
});
