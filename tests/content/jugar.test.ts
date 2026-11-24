import { describe, expect, it } from "vitest";
import { buscarMision, cargarMundo } from "../../scripts/lib/contenido";
import { correrSolucion, presentar, procesar } from "../../scripts/lib/jugar";
import { MisionEnCurso } from "../../src/engine/mision/runtime";

const mundo = cargarMundo();
const abrir = (semilla = 3) => MisionEnCurso.sobreMundo(buscarMision("t1-m02-el-leeme"), mundo, semilla);

describe("npm run play --mision (lógica)", () => {
  it("presenta el briefing con nombres y los pendientes del pizarrón", () => {
    const texto = presentar(abrir());
    expect(texto).toContain("Ing. Karla Ibáñez: Hola, soy Karla");
    expect(texto).toContain("[ ] Leer LEEME.txt");
    expect(texto).toContain("?pista");
  });

  it("un comando muestra su salida y avisa del objetivo cumplido", async () => {
    const mc = abrir();
    const salida = await procesar(mc, "cat LEEME.txt");
    expect(salida).toContain("— R.");
    expect(salida).toContain("✓ Leer LEEME.txt");
  });

  it("?responder evalúa la respuesta y ?pista da el siguiente nivel", async () => {
    const mc = abrir();
    expect(await procesar(mc, "?responder responder-firma Rebeca")).toContain("No es correcto");
    expect(await procesar(mc, "?responder responder-firma R")).toContain("✓");
    expect(await procesar(mc, "?pista")).toMatch(/^Eduardo \(pista 1\/3, leer-leeme\):/);
    expect(await procesar(mc, "?pista responder-conteo")).toMatch(/pista 1\/3, responder-conteo/);
    expect(await procesar(mc, "?responder nada 1")).toContain("objetivo inexistente: nada");
  });

  it("lo fuera de alcance se queda en el globo de pensamiento", async () => {
    expect(await procesar(abrir(), "awk '{print $1}' x")).toMatch(/^\(pensamiento\) /);
  });

  it("la solución completa la misión y muestra las estrellas", async () => {
    const r = await correrSolucion(abrir(11));
    expect(r.completada).toBe(true);
    expect(r.texto).toContain("Misión completada ★★★");
  });

  it("buscarMision falla con un id que no existe", () => {
    expect(() => buscarMision("t9-m99-nada")).toThrow(/no existe la misión t9-m99-nada/);
  });
});
