---
name: nueva-mision
description: Crea o modifica una misión principal o un favor del juego (YAML en content/misiones/) siguiendo currículo, trama y variables de partida, y la valida con el harness con muchas semillas. Usar al pedir "nueva misión", "escribe la misión T4-M2", "agrega un favor", o al editar content/misiones/.
---

# Nueva misión o favor

Entrada: ID (`T4-M2`, `T3-F1`) o concepto(s).

1. **Lee:** `docs/plan/03-curriculo.md` (fila de la misión o del favor), `docs/plan/02-trama.md` (fecha y beat del turno, personajes, biblia, variables), `docs/plan/04-mecanicas.md` §Objetivos, §Pistas, §Aleatorización, y `docs/ejemplos/mision-ejemplo.yaml`.
2. **Comprueba** prerequisitos y ≤ 2 conceptos nuevos. Favor: `ensena: []`, `refuerza` ya enseñado y `disponible_desde` 1–2 misiones después.
3. **Diseña primero el resultado observable** (predicado o `respuesta` con `esperado_de`) y que cambie con la semilla; luego la narrativa que lo justifica y cómo llega (`entrega`: pizarrón, llamada, visita, ticket, correo).
4. **Escribe el YAML** en `content/misiones/turno-NN/<id>.yaml`: briefing 2–4 globos ≤ 280 car.; 1–3 objetivos con `pendiente` (texto del pizarrón) y 3 pistas en voz de Eduardo; `solucion`, ≥ 1 alternativa, ≥ 1 contraejemplo; `libreta`; recompensas; eventos. Todo dato variable como `{{variable}}`.
5. **Mundo:** archivos, hosts, servicios o filas nuevas como `mundo.parches` o generadores en `content/mundo/`, coherentes con la biblia.
6. **Valida:** `npm run validate:content -- <ruta>` (25 semillas) y `npm run play -- --mision <id> --solucion --semilla <n>` con 2–3 semillas. Si los scripts aún no existen (antes de F2), guarda en `docs/borradores/` y dilo.
7. **Revisión:** `revisor-curricular` y `disenador-narrativo` en paralelo; aplica todo hallazgo bloqueante.
8. Al cerrar un turno completo: `playtester-novato` sobre su primera misión.

Reporta: conceptos, objetivos y predicados, variables usadas, resultado real del harness, hallazgos de los revisores y pendientes.
