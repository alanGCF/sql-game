---
name: handoff-diseno
description: Integra al código el resultado de Claude Design (tokens, componentes, pantallas) para el juego. Usar cuando el usuario traiga un export o handoff de Claude Design, un enlace de diseño, capturas de pantallas diseñadas, o pida "implementa el diseño".
---

# Handoff de diseño

1. Lee `docs/diseno/brief-claude-design.md` (§6 Pantallas, §7 Componentes, §10 Entregables). Es el checklist contra el que se compara lo recibido.
2. **Inventario de huecos:** escribe `docs/diseno/gaps.md` con lo que falta o no cumple restricciones duras (§3): teclado abierto, estados vacío/error/cargando, alto contraste, tamaños táctiles, input ≥ 16 px. Si faltan cosas bloqueantes para F3, pregúntale al usuario antes de inventarlas.
3. **Tokens:** pasa los valores a `src/ui/tokens.css` como CSS custom properties con los nombres de rol del brief (§5), para los temas oscuro, claro y alto contraste (`[data-theme]`).
4. **Componentes:** implementa primero los de la pantalla de juego: `TerminalLine`, `CommandInput`, `AccessoryKeyBar`, `SuggestionChips`, `AppSwitcher`, `MissionHeader`. Luego hojas inferiores (objetivos, pistas) y el resto. La UI consume el motor solo por su API pública.
5. Si están instaladas, aplica las skills `mobile-native` y `emil-design-eng` (emilkowalski) y `frontend-design` (Anthropic). Usa `design:design-handoff` para extraer specs si el export es visual.
6. **Verifica** con el subagente `qa-movil` y la skill `design:accessibility-review`; corrige bloqueantes.
7. Skill `verificar`.

Reporta: pantallas y componentes implementados vs el checklist, huecos abiertos (`gaps.md`) y resultados de QA.
