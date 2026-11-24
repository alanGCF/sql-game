---
name: revision-visual
description: Revisión visual y funcional con Playwright de la escena 3D y las capas DOM del juego, mirando las capturas. Usar después de cualquier cambio visible (src/scene, src/ui, src/game, estilos, assets), antes de cerrar una tarea, o cuando se pida "revisa cómo se ve", "toma capturas", "¿se rompió algo?".
---

# Revisión visual

1. **Pruebas:** `npm run e2e -- --trace off`. Si fallan comparaciones de capturas, abre el diff (`test-results/**/*-diff.png`) antes de decidir: ¿regresión o cambio intencional?
2. **Cambio intencional** → actualiza referencias solo de las capturas afectadas (`npm run e2e -- --update-snapshots <archivo>`) y dilo en el reporte. **Regresión** → corrige el código, no la referencia.
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
