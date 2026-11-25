import { describe, expect, it } from "vitest";
import { GameClock, Shell } from "../../src/engine";
import { vfsDesde } from "../../src/engine/vfs";
import { aplicarDiferencias, diferencias } from "../../src/engine/vfs-diff";

describe("diferencias del mundo (guardado compacto)", () => {
  it("base + diff reconstruye exactamente el mundo modificado", async () => {
    const reloj = GameClock.desde("2026-10-28T15:40:00Z");
    const base = vfsDesde(
      [
        { ruta: "/home/becario/", dueno: "becario" },
        { ruta: "/home/becario/a.txt", dueno: "becario", contenido: "a\n" },
        { ruta: "/home/becario/viejo/", dueno: "becario" },
        { ruta: "/home/becario/viejo/x.txt", dueno: "becario", contenido: "x" },
        { ruta: "/srv/grande.csv", contenido: "fila\n".repeat(5000) },
      ],
      reloj.now(),
    );
    const shell = Shell.crear(
      base.clone(),
      reloj,
      { name: "becario", groups: ["becario"], home: "/home/becario" },
      "h",
    );
    await shell.ejecutar("mkdir -p b/c && echo hola > b/c/d.txt && echo mas >> a.txt && rm -r viejo");
    const diff = diferencias(base, shell.mundo.vfs);
    expect(diff.borrados).toEqual(["/home/becario/viejo"]);
    expect(JSON.stringify(diff).length).toBeLessThan(2000); // no incluye el archivo grande sin cambios
    const reconstruido = aplicarDiferencias(base, diff);
    expect(diferencias(shell.mundo.vfs, reconstruido)).toEqual({ cambiados: [], borrados: [] });
    expect(base.exists("/home/becario/viejo/x.txt")).toBe(true);
  });
});

describe("aplicarDiferencias con rutas hostiles (segunda defensa)", () => {
  it("rechaza nombres vacíos, '.' y '..' en vez de romper el árbol", async () => {
    const base = vfsDesde([{ ruta: "/home/" }], 0);
    const entrada = { tipo: "dir" as const, mode: 0o755, owner: "root", group: "root", mtime: 0 };
    for (const ruta of ["//", "/a/..", "/."]) {
      expect(() => aplicarDiferencias(base, { cambiados: [{ ruta, ...entrada }], borrados: [] })).toThrow(
        /diff inválido/,
      );
      expect(() => aplicarDiferencias(base, { cambiados: [], borrados: [ruta] })).toThrow(/diff inválido/);
    }
  });
});
