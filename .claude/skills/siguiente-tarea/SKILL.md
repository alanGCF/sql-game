---
name: siguiente-tarea
description: Elige y ejecuta la siguiente tarea desbloqueada del backlog (docs/plan/backlog.md) en la rama develop. Usar con /siguiente-tarea, "¿qué sigue?", "continúa con el plan" o al retomar el proyecto en una sesión nueva.
---

# Siguiente tarea

1. Asegúrate de estar en `develop` y actualizado (`git checkout develop && git pull`). No crees ramas.
2. Lee `docs/plan/backlog.md`. Toma la **primera** `pendiente` con dependencias `hecha`. Si el usuario nombró una tarea, usa esa y verifica sus dependencias.
3. Muestra en pocas líneas: ID, Hacer, Listo cuando, Verificar, archivos probables.
4. Si la tarea depende de una decisión de **funcionalidad o estética** abierta (`docs/plan/decisiones-abiertas.md`), pregúntala (con capturas u opciones concretas) y **toma otra tarea desbloqueada mientras tanto**. Las decisiones de código las tomas tú y las registras en `docs/decisiones/adr.md`.
5. Marca la tarea `en-progreso`.
6. TDD (skill `test-driven-development` de superpowers si está). Ponytail: cambio mínimo completo; atajos con `// shortcut: …`. Consulta documentación actual de las librerías que toques.
7. Usa `nueva-mision`, `nuevo-comando` o `revision-visual` según el tipo de tarea.
8. `verificar`. Si hubo cambios visibles, `revision-visual`. Si tocó servidor/dependencias/cabeceras, `auditor-seguridad`.
9. En verde: estado `hecha (AAAA-MM-DD)`, docs afectados actualizados, **un commit** `F#-##: <resumen>` en `develop`, push a `origin develop`.
10. Continúa con la siguiente tarea desbloqueada sin esperar, salvo que necesites una decisión del usuario.

Nunca hagas push a `main` sin aprobación explícita del usuario (ver `CLAUDE.md` §Cómo se trabaja).
