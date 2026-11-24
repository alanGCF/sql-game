import { describe, expect, it } from "vitest";
import { GameClock, Shell } from "../../src/engine";
import { vfsDesde } from "../../src/engine/vfs";

function shell() {
  const reloj = GameClock.desde("2026-10-28T15:40:00Z");
  const vfs = vfsDesde(
    [
      { ruta: "/home/becario/", dueno: "becario" },
      { ruta: "/home/becario/LEEME.txt", dueno: "becario" },
      { ruta: "/home/becario/tickets/T-1042.txt", dueno: "becario" },
      { ruta: "/home/becario/tickets/T-1043.txt", dueno: "becario" },
      { ruta: "/home/becario/.r/hola", dueno: "becario" },
      { ruta: "/srv/lineas/linea1/estado.txt" },
      { ruta: "/srv/lineas/linea2/estado.txt" },
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

const tab = (linea: string) => shell().completar(linea, linea.length);

describe("autocompletado con Tab", () => {
  it.each([
    ["cat LE", "cat LEEME.txt "],
    ["cd tic", "cd tickets/"],
    ["cat tickets/T-1042", "cat tickets/T-1042.txt "],
    ["cd /srv/li", "cd /srv/lineas/"],
    ["ls ~/tic", "ls ~/tickets/"],
    ["cat .r/h", "cat .r/hola "],
    ["pw", "pwd "],
    ["ls | gr", "ls | grep "],
    ["cat tickets/T", "cat tickets/T-104"],
  ])("%s → %s", (linea, esperado) => {
    expect(tab(linea).linea).toBe(esperado);
  });

  it("con varias opciones y sin prefijo común lista los candidatos", () => {
    const r = tab("cat tickets/T-104");
    expect(r.linea).toBe("cat tickets/T-104");
    expect(r.candidatos).toEqual(["T-1042.txt", "T-1043.txt"]);
    expect(tab("cd /srv/lineas/linea").candidatos).toEqual(["linea1/", "linea2/"]);
  });

  it("no muestra ocultos salvo que el prefijo empiece con punto", () => {
    expect(tab("ls ").candidatos).toEqual(["LEEME.txt", "tickets/"]);
    expect(tab("ls .").linea).toBe("ls .r/");
  });

  it("no hace nada si no hay coincidencias o la palabra tiene comillas", () => {
    expect(tab("cat zzz").linea).toBe("cat zzz");
    expect(tab("cat 'LE").linea).toBe("cat 'LE");
  });
});
