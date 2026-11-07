---
name: siguiente-tarea
description: Elige y ejecuta la siguiente tarea desbloqueada del backlog del proyecto (docs/plan/backlog.md). Usar con /siguiente-tarea, "¿qué sigue?", "continúa con el plan" o al retomar el proyecto en una sesión nueva.
---

# Siguiente tarea

1. Lee `docs/plan/backlog.md`. Toma la **primera** tarea con estado `pendiente` cuyas dependencias estén todas en `hecha`. Si el usuario nombró una tarea (`F1-03`), usa esa y verifica sus dependencias.
2. Muestra en pocas líneas: ID, Hacer, Listo cuando, Verificar y los archivos que probablemente toques.
3. Si la tarea depende de una decisión de `docs/plan/decisiones-abiertas.md` que siga `abierta`, **detente y pregunta** esa decisión. No la decidas tú.
4. Cambia el estado a `en-progreso` en el backlog.
5. Ejecuta con TDD: test que falla → implementación mínima → test pasa → refactor. Si la skill `test-driven-development` (superpowers) está disponible, síguela. Aplica ponytail: el cambio mínimo completo; un atajo deliberado lleva `// shortcut: …`.
6. Si la tarea toca contenido usa `nueva-mision`; si toca un comando, `nuevo-comando`; si toca diseño, `handoff-diseno`.
7. Corre la skill `verificar`. Si algo falla, corrígelo; si no puedes, deja la tarea `en-progreso` y reporta el fallo con la salida real.
8. En verde: estado `hecha (AAAA-MM-DD)`, actualiza los docs afectados y haz commit `F#-##: <resumen>`.

Reporta al final: qué se hizo, cómo se verificó (comandos y resultado), qué quedó fuera y cuál es la siguiente tarea desbloqueada.
