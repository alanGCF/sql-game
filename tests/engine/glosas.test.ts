import { describe, expect, it } from "vitest";
import { GameClock, Shell } from "../../src/engine";
import { vfsDesde } from "../../src/engine/vfs";

function shell() {
  const reloj = GameClock.desde("2026-10-28T15:40:00Z");
  const vfs = vfsDesde(
    [
      { ruta: "/home/becario/", dueno: "becario" },
      { ruta: "/home/becario/LEEME.txt", dueno: "becario", contenido: "hola\n" },
      { ruta: "/home/becario/tickets/", dueno: "becario" },
    ],
    reloj.now(),
  );
  return Shell.crear(
    vfs,
    reloj,
    { name: "becario", groups: ["becario"], home: "/home/becario" },
    "srv-sistemas",
  );
}

async function glosaDe(linea: string): Promise<string> {
  const r = await shell().ejecutar(linea);
  return r.fragmentos
    .filter((f) => f.tipo === "glosa")
    .map((f) => f.texto)
    .join(" | ");
}

async function pensamientoDe(linea: string): Promise<string> {
  return (await shell().ejecutar(linea)).pensamiento ?? "";
}

/** Errores típicos de una persona que nunca ha usado una terminal. */
describe("glosas para errores de novato", () => {
  it.each([
    ["cat leeme.txt", "¿será LEEME.txt?"],
    ["cd leeme.txt", "No existe"],
    ["cd LEEME.txt", "es un archivo"],
    ["cat tickets", "es una carpeta"],
    ["ls Tickets", "¿será tickets?"],
    ["sl", "¿Quisiste decir `ls`?"],
    ["cta LEEME.txt", "¿Quisiste decir `cat`?"],
    ["pdw", "¿Quisiste decir `pwd`?"],
    ["ifconfig", "Hoy se usa `ip a`"],
    ["netstat", "Hoy se usa `ss`"],
    ["route", "Hoy se usa `ip route`"],
    ["cp tickets x", "agrega -r"],
    ["rm tickets", "rm -r"],
    ["man", "por ejemplo: `man ls`"],
    ["zzz", "Revisa cómo lo escribiste"],
  ])("%s → %s", async (linea, esperado) => {
    expect(await glosaDe(linea)).toContain(esperado);
  });

  it.each([
    ["dir", "`ls`"],
    ["cls", "`clear`"],
    ["ipconfig", "`ip a`"],
    ["type LEEME.txt", "`cat`"],
    ["copy a b", "`cp`"],
    ["del a", "`rm`"],
    ["awk 1 a", "mejor no le doy Enter"],
    ["rm -rf /", "me corren"],
    ["echo $(ls)", "avanzado"],
    ["exit", "Todavía no acaba mi turno"],
  ])("%s → pensamiento con %s", async (linea, esperado) => {
    expect(await pensamientoDe(linea)).toContain(esperado);
  });

  it("cd.. (sin espacio) es un comando inexistente, como en bash", async () => {
    const r = await shell().ejecutar("cd..");
    expect(r.fragmentos.find((f) => f.tipo === "stderr")?.texto).toBe("bash: cd..: command not found\n");
  });
});
