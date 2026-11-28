import { describe, expect, it } from "vitest";
import { conUsuario, USUARIO_POR_OMISION, usuarioDe } from "../../src/engine/usuario";

describe("usuario de Linux con el nombre del jugador (F4-17)", () => {
  it("toma el primer nombre, sin acentos ni mayúsculas", () => {
    expect(usuarioDe("Sofía Ramírez")).toBe("sofia");
    expect(usuarioDe("  ÑOÑO  ")).toBe("nono");
    expect(usuarioDe("José-Luis")).toBe("jose-luis");
    expect(usuarioDe("Zoë")).toBe("zoe");
    expect(usuarioDe("ana_maria")).toBe("ana_maria");
  });

  it("siempre es un nombre de usuario válido de Debian (empieza con letra, ≤ 16, [a-z0-9_-])", () => {
    for (const n of ["123abc", "R2-D2", "x".repeat(40), "Ángel🙂", "o'Brien", "_raro", "-guion"]) {
      expect(usuarioDe(n)).toMatch(/^[a-z][a-z0-9_-]{0,15}$/);
    }
    expect(usuarioDe("123abc")).toBe("abc");
    expect(usuarioDe("x".repeat(40))).toHaveLength(16);
  });

  it("sin letras usables cae en el usuario por omisión; nunca choca con otra cuenta del servidor", () => {
    expect(usuarioDe("🙂🙂")).toBe(USUARIO_POR_OMISION);
    expect(usuarioDe("12345")).toBe(USUARIO_POR_OMISION);
    expect(usuarioDe("")).toBe(USUARIO_POR_OMISION);
    expect(usuarioDe("Root")).toBe("root2");
    expect(usuarioDe("etellez")).toBe("etellez2");
    expect(usuarioDe("Delta_svc")).toBe("delta_svc2");
    expect(usuarioDe("nobody")).toBe("nobody2");
  });

  it("conUsuario pone el usuario en todos los textos y llaves, y nada más", () => {
    const x = {
      usuarios: { "{{usuario}}": { home: "/home/{{usuario}}" } },
      lista: ["cd /home/{{usuario}}/tickets", "{{lote}}"],
      n: 3,
    };
    expect(conUsuario(x, "sofia")).toEqual({
      usuarios: { sofia: { home: "/home/sofia" } },
      lista: ["cd /home/sofia/tickets", "{{lote}}"],
      n: 3,
    });
    expect(() => conUsuario(x, 'mal"o')).toThrow();
  });
});
