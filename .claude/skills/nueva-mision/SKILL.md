---
name: nueva-mision
description: Crea o modifica una misión del juego (YAML en content/misiones/) siguiendo el currículo y la trama, y la valida con el harness. Usar al pedir "nueva misión", "escribe la misión T3-M2", "agrega un ticket", o al editar archivos de content/misiones/.
---

# Nueva misión

Entrada: ID de misión (`T3-M2`) o concepto(s) del currículo.

1. **Lee:** `docs/plan/03-curriculo.md` (fila de la misión, conceptos, prerequisitos), `docs/plan/02-trama.md` (beat del turno y biblia del mundo), `docs/plan/04-mecanicas.md` §Objetivos y §Pistas, y `docs/ejemplos/mision-ejemplo.yaml` (formato).
2. **Comprueba** que `requiere` ya se enseñó antes y que `ensena` tiene ≤ 2 conceptos.
3. **Diseña primero el resultado observable** que prueba el aprendizaje (predicado o `respuesta`), luego la narrativa que lo justifica. La herramienta debe desbloquear información o un cambio de estado que la historia necesita.
4. **Escribe el YAML** en `content/misiones/turno-NN/<id>.yaml`:
   - briefing de 2–4 burbujas, ≤ 280 caracteres cada una, sin la solución;
   - 1–3 objetivos, 3 pistas cada uno (empujón → concepto → solución ejecutable entre backticks);
   - `solucion`, ≥ 1 `soluciones_alternativas`, ≥ 1 `contraejemplos`;
   - `recompensas` y `eventos`.
5. **Mundo:** si necesitas archivos, hosts, servicios o filas nuevas, agrégalos como `mundo.parches` o en `content/mundo/`, consistentes con la biblia del mundo. Si cambias la biblia, actualiza `02-trama.md`.
6. **Valida:** `npm run validate:content -- <ruta>` hasta verde, y `npm run play -- --mision <id> --solucion`. Si esos scripts aún no existen (antes de F2), guarda la misión en `docs/borradores/` y dilo explícitamente.
7. **Revisión:** lanza en paralelo los subagentes `revisor-curricular` y `disenador-narrativo`; aplica todo hallazgo `bloqueante`.
8. Al cerrar un turno completo, lanza `playtester-novato` sobre su primera misión.

Reporta: conceptos enseñados, objetivos y predicados, resultado del harness (real), hallazgos de los revisores y qué quedó pendiente.
