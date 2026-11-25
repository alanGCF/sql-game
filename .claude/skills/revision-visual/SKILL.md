---
name: revision-visual
description: Revisión visual y funcional con Playwright de la escena 3D y las capas DOM del juego, mirando las capturas. Usar después de cualquier cambio visible (src/scene, src/ui, src/game, estilos, assets), antes de cerrar una tarea, o cuando se pida "revisa cómo se ve", "toma capturas", "¿se rompió algo?".
---

# Revisión visual

1. **Pruebas:** `npm run e2e -- --trace off` (flujos). Las capturas de referencia (`tests/e2e/capturas.spec.ts`) solo se comparan en CI, en el contenedor de Playwright: las fuentes del sandbox difieren. Si el job `capturas` falla, baja el artefacto `capturas-diferencias` y mira los `*-diff.png` antes de decidir: ¿regresión o cambio intencional?
2. **Cambio intencional** → regenera las referencias en CI con un commit a `develop` cuyo mensaje (el último del push) lleve `[capturas]`; el job `capturas-subir` las sube como commit del bot. Dilo en el reporte y manda las capturas nuevas al usuario si cambió el aspecto. **Regresión** → corrige el código, no la referencia.
   Para mirarlas en local: `CAPTURAS=1 npx playwright test tests/e2e/capturas.spec.ts --project desktop-720 --update-snapshots=all` y **borra** `tests/e2e/capturas.spec.ts-snapshots/` antes de hacer commit (esas no valen como referencia).
3. **Capturas de revisión:** con `?test=1&semilla=1` toma (deviceScaleFactor 1, 1920×1080 y 1280×720) vista general, izquierda, derecha, abajo y cada vista acercada que el cambio toque. Guárdalas en el scratchpad.
4. **Míralas** (Read de cada imagen) contra `docs/diseno/direccion-arte.md`:
   - encuadre: se ve lo que debe y no más (la oficina solo parcialmente);
   - legibilidad: texto DOM nítido, contraste suficiente, tamaños correctos;
   - nada cortado, encimado o fuera del monitor;
   - coherencia de estilo (materiales, luz, paleta) con el estilo elegido;
   - estados correctos (pendientes tachados, teléfono sonando, etc.).
5. Lanza el subagente `qa-visual` si el cambio afecta flujos o interacción.
6. Si el cambio implica una **decisión estética** (algo nuevo, no solo corregir), envía las capturas al usuario con `SendUserFile` y pregunta; no lo des por aprobado.

Reporta: pruebas (conteos), capturas revisadas (rutas absolutas), problemas encontrados y corregidos, decisiones pendientes del usuario.
