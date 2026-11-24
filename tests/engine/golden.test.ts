import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { GameClock, Shell } from "../../src/engine";
import { type Entrada, vfsDesde } from "../../src/engine/vfs";

/** Compara el motor contra salidas capturadas del sistema real (scripts/capture-goldens.mjs). */
interface Fixture {
  cwd: string;
  home?: string;
  usuario: string;
  usuarios?: Record<string, string[]>;
  ahora: string;
  entradas: Entrada[];
}

const RAIZ = "tests/golden";
const casos: string[] = [];
for (const cmd of readdirSync(RAIZ)) {
  for (const caso of readdirSync(join(RAIZ, cmd))) {
    if (existsSync(join(RAIZ, cmd, caso, "stdout.txt"))) casos.push(join(RAIZ, cmd, caso));
  }
}

describe("goldens de fidelidad", () => {
  it("hay casos capturados", () => {
    expect(casos.length).toBeGreaterThan(0);
  });

  for (const dir of casos) {
    it(dir.replace(`${RAIZ}/`, ""), async () => {
      const fx = JSON.parse(readFileSync(join(dir, "fixture.json"), "utf8")) as Fixture;
      const leer = (f: string) => readFileSync(join(dir, f), "utf8");
      const reloj = GameClock.desde(fx.ahora);
      const vfs = vfsDesde(fx.entradas, reloj.now());
      const grupos = fx.usuarios?.[fx.usuario] ?? [];
      const usuario = { name: fx.usuario, groups: [fx.usuario, ...grupos], home: fx.home ?? fx.cwd };
      const shell = Shell.crear(vfs, reloj, usuario, "srv-sistemas", fx.cwd);
      const tty = existsSync(join(dir, "cmd_real.txt"));
      const r = await shell.ejecutar(leer("cmd.txt").trim(), { sinTerminal: !tty });
      const stdout = r.fragmentos
        .filter((f) => f.tipo === "stdout")
        .map((f) => f.texto)
        .join("");
      const stderr = r.fragmentos
        .filter((f) => f.tipo === "stderr")
        .map((f) => f.texto)
        .join("");
      expect(stdout).toBe(leer("stdout.txt"));
      expect(stderr).toBe(leer("stderr.txt"));
      expect(shell.sesion.ultimoCodigo).toBe(Number(leer("code.txt")));
    });
  }
});
