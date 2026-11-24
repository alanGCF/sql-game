import { describe, expect, it } from "vitest";
import { normalizar, VfsError, vfsDesde } from "../../src/engine/vfs";

const becario = { name: "becario", groups: ["becario"], home: "/home/becario" };
const root = { name: "root", groups: ["root"], home: "/root" };

function mundo() {
  return vfsDesde(
    [
      { ruta: "/home/becario/", dueno: "becario" },
      { ruta: "/home/becario/a.txt", dueno: "becario", contenido: "hola\n" },
      { ruta: "/home/otro/", dueno: "otro", modo: "700" },
      { ruta: "/home/otro/x.txt", dueno: "otro", contenido: "x" },
      { ruta: "/srv/solo-lectura.txt", dueno: "root", modo: "444", contenido: "ro" },
    ],
    0,
  );
}

describe("vfs", () => {
  it.each([
    ["/home/becario", "a.txt", "/home/becario/a.txt"],
    ["/home/becario", "../otro/./x", "/home/otro/x"],
    ["/home/becario", "/", "/"],
    ["/", "..", "/"],
    ["/a/b", "../../../c//d/", "/c/d"],
  ])("normalizar(%s, %s) = %s", (cwd, ruta, esperado) => {
    expect(normalizar(cwd, ruta)).toBe(esperado);
  });

  it("respeta permisos de lectura, escritura y paso", () => {
    const v = mundo();
    expect(v.readFile("/home/becario/a.txt", becario)).toBe("hola\n");
    expect(() => v.readFile("/home/otro/x.txt", becario)).toThrowError(VfsError);
    expect(v.readFile("/home/otro/x.txt", root)).toBe("x");
    expect(() => v.writeFile("/srv/solo-lectura.txt", "z", becario, 1)).toThrowError(VfsError);
    expect(() => v.writeFile("/srv/nuevo.txt", "z", becario, 1)).toThrowError(VfsError);
  });

  it("crea, agrega y distingue archivos de directorios", () => {
    const v = mundo();
    v.writeFile("/home/becario/b.txt", "1\n", becario, 5);
    v.writeFile("/home/becario/b.txt", "2\n", becario, 6, true);
    expect(v.readFile("/home/becario/b.txt", becario)).toBe("1\n2\n");
    expect(() => v.readFile("/home/becario", becario)).toThrowError(/EISDIR/);
    v.mkdir("/home/becario/sub", becario, 7);
    expect(() => v.mkdir("/home/becario/sub", becario, 8)).toThrowError(/EEXIST/);
  });

  it("clone() es independiente del original", () => {
    const v = mundo();
    const c = v.clone();
    c.writeFile("/home/becario/a.txt", "cambiado", becario, 9);
    expect(v.readFile("/home/becario/a.txt", becario)).toBe("hola\n");
  });
});
