import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { CurriculoEsquema, codigoDeId, PersonajesEsquema } from "../../src/engine/mision/curriculo";

const leer = (f: string) => parse(readFileSync(f, "utf8"));

describe("currículo y personajes en datos", () => {
  it("content/curriculo.yaml es válido: cada prerequisito se enseña antes", () => {
    const r = CurriculoEsquema.safeParse(leer("content/curriculo.yaml"));
    expect(r.success ? [] : r.error.issues.map((i) => i.message)).toEqual([]);
    expect(Object.keys(r.data?.conceptos ?? {}).length).toBe(65);
  });

  it("detecta un prerequisito que se enseña después", () => {
    const c = leer("content/curriculo.yaml");
    c.conceptos["linux.nav.pwd"].requiere = ["sql.join.inner"];
    const r = CurriculoEsquema.safeParse(c);
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]?.message).toMatch(/se enseña después/);
  });

  it("content/personajes.yaml es válido", () => {
    expect(PersonajesEsquema.safeParse(leer("content/personajes.yaml")).success).toBe(true);
  });

  it("convierte ids de misión a códigos del currículo", () => {
    expect(codigoDeId("t1-m02-el-leeme")).toBe("T1-M2");
    expect(codigoDeId("t3-f01-menus")).toBe("T3-F1");
  });
});
