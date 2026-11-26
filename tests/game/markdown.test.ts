import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { leerMarkdown } from "../../src/game/markdown";

describe("markdown de la libreta (F4-05)", () => {
  it("títulos, párrafos con código e itálicas, listas y bloques de código", () => {
    const md =
      "# `cat`\n\n## Para qué sirve\n\n`cat` muestra *todo* lo de **un** archivo.\nSigue aquí.\n\n```\n$ cat a\nhola\n```\n\n- `-n`: numera.\n- otra\n";
    expect(leerMarkdown(md)).toEqual([
      { tipo: "titulo", nivel: 1, inline: [{ tipo: "codigo", texto: "cat" }] },
      { tipo: "titulo", nivel: 2, inline: [{ tipo: "texto", texto: "Para qué sirve" }] },
      {
        tipo: "parrafo",
        inline: [
          { tipo: "codigo", texto: "cat" },
          { tipo: "texto", texto: " muestra " },
          { tipo: "cursiva", texto: "todo" },
          { tipo: "texto", texto: " lo de " },
          { tipo: "negrita", texto: "un" },
          { tipo: "texto", texto: " archivo. Sigue aquí." },
        ],
      },
      { tipo: "codigo", texto: "$ cat a\nhola" },
      {
        tipo: "lista",
        items: [
          [
            { tipo: "codigo", texto: "-n" },
            { tipo: "texto", texto: ": numera." },
          ],
          [{ tipo: "texto", texto: "otra" }],
        ],
      },
    ]);
  });

  it("nada se interpreta como HTML: el texto sale tal cual", () => {
    expect(leerMarkdown("<b>hola</b> & <script>")).toEqual([
      { tipo: "parrafo", inline: [{ tipo: "texto", texto: "<b>hola</b> & <script>" }] },
    ]);
  });

  it("todas las páginas de content/libreta/comandos se leen sin perder texto", () => {
    for (const f of readdirSync("content/libreta/comandos")) {
      const md = readFileSync(`content/libreta/comandos/${f}`, "utf8");
      const bloques = leerMarkdown(md);
      expect(bloques[0]?.tipo, f).toBe("titulo");
      const texto = JSON.stringify(bloques);
      for (const palabra of md
        .replace(/[`*#-]/g, " ")
        .split(/\s+/)
        .filter((p) => p.length > 3)
        .slice(0, 40))
        expect(texto, `${f}: ${palabra}`).toContain(palabra.replace(/["\\]/g, ""));
    }
  });
});
