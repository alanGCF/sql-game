# Skills y plugins para el proyecto

Investigación del 2026-11-07. Criterio: que ayuden a **este** proyecto (juego web móvil, motor TS, mucho contenido validado, diseño en Claude Design) sin meter ruido de contexto ni frameworks que se pisen entre sí.

**Regla general:** no instales dos frameworks de proceso completos a la vez (ECC, superpowers, spec-kit, the-architect y mattpocock se solapan en planear/TDD/revisar). Elegimos **superpowers** como metodología base y tomamos piezas puntuales de los demás.

## Tier 1 — instalar

| Skill / plugin | Qué aporta aquí | Cuándo se usa | Instalación (Claude Code) |
|---|---|---|---|
| **superpowers** (obra) | `brainstorming`, `writing-plans`, `test-driven-development`, `systematic-debugging`, `verification-before-completion`, `subagent-driven-development`, `requesting-code-review` | Todo F1–F8: diseñar → plan → TDD → verificar | `/plugin install superpowers@claude-plugins-official` *(ya declarado en `.claude/settings.json` → se ofrece al abrir el repo)* |
| **ponytail** (DietrichGebert) | Cambio mínimo completo; nunca recorta validación, seguridad ni accesibilidad; `shortcut:` como deuda explícita; `/ponytail-review` | Al implementar y antes de cada commit | **Ya tienes** `ponytail`, `ponytail-review` y `ponytail-debt` en tu cuenta. El plugin completo agrega `/ponytail-audit` y `/ponytail-gain`: `/plugin marketplace add DietrichGebert/ponytail` y luego `/plugin install ponytail@ponytail` (no lo instales encima de las skills que ya tienes o quedarán duplicadas) |
| **Context7** (upstash) | Documentación actualizada de React, Vite, sql.js, Playwright, vite-plugin-pwa, Zod | Antes de escribir código contra APIs que cambian (F0-04 en adelante) | Ya tienes el plugin configurado en tu cuenta. Alternativa CLI+skill: `npx ctx7 setup --claude` (Node ≥ 22.13; OAuth; API key gratis recomendada). **En este entorno cloud no conectó:** la política de red bloqueó `mcp.context7.com` (ver abajo) |
| **emilkowalski/skills** | `mobile-native` (hover pegado, tap highlight, bug de 100vh, zoom en inputs, safe areas — justo nuestros riesgos), `emil-design-eng`, `break-ui` (datos extremos), `animation-performance`, `review-animations` | F3 en adelante, al implementar el diseño | `npx skills@latest add emilkowalski/skills` |
| **anthropics/skills** → `example-skills` | `frontend-design` (UI con criterio), `webapp-testing` (Playwright), `skill-creator` (para mejorar nuestras skills del proyecto) | F3 (UI), E2E, mantenimiento del harness | `/plugin marketplace add anthropics/skills` y luego `/plugin install example-skills@anthropic-agent-skills` |
| **design** (plugin ya activo en tu cuenta) | `design:ux-copy` (glosas, pistas, errores), `design:accessibility-review`, `design:design-handoff`, `design:design-critique`, `design:user-research`, `design:research-synthesis` | Textos de la UI, auditoría a11y, handoff de Claude Design, playtests | Ya disponible |

## Tier 2 — usar piezas puntuales

| Skill / plugin | Qué tomar | Qué NO | Instalación |
|---|---|---|---|
| **mattpocock/skills** | `grill-me` (cerrar `decisiones-abiertas.md` con un interrogatorio), `to-tickets` (convertir el backlog en issues de GitHub con dependencias), `domain-modeling` (mantener `glosario.md` y ADRs), `handoff` | Su `tdd`, `code-review` e `implement` duplican a superpowers | `/plugin install mattpocock-skills@claude-plugins-official`, luego `/setup-matt-pocock-skills` una vez |
| **the-architect** (Hainrixz, tiene versión en español) | `/architect-audit` o `/architect-brownfield` como **segunda opinión** del plan; su Gate B (pre-mortem adversarial desde 8 ángulos) es valioso antes de F1 | No regenerar el plan desde cero: ya existe y duplicaría `docs/` | `/plugin marketplace add Hainrixz/the-architect` y luego `/plugin install the-architect@soyenriquerocha` |
| **Playwright CLI skills** | Alternativa a `webapp-testing` para E2E móvil | Elegir una de las dos, no ambas | `npm install -g @playwright/cli@latest` y `playwright-cli install --skills` *(fuente no oficial; verificar antes)* |

## Tier 3 — no instalar (por ahora)

| Repo | Por qué no | Qué ya tomamos de él |
|---|---|---|
| **ECC** (affaan-m) | 71 agentes, 314 skills, 98 comandos y hooks globales: se solapa con superpowers y mete mucho ruido de contexto; su propio README advierte no apilar instalaciones | La idea de `eval-harness` / `verification-loop` / `quality-gate` → nuestro harness de contenido y la skill `verificar` |
| **spec-kit** (GitHub) | Flujo formal constitution → spec → plan → tasks; requiere Python 3.11 + `uv`; duplicaría `CLAUDE.md` + `docs/plan/` + `backlog.md` | La "constitución" = `CLAUDE.md`; el patrón spec/plan/tasks = `docs/plan/` + `backlog.md` |
| **opusgamelabs/game-creator** | Pensado para Phaser/Three.js (canvas); nuestro juego es DOM | Su `qa-game` (boot, gameplay, regresión visual, rendimiento) inspiró `qa-movil` |
| **donchitos/claude-code-game-studios** | 49 agentes / 72 skills, muy pesado; no pude verificar el contenido de sus SKILL.md | Su `team-narrative` y `playtest-report` inspiraron `disenador-narrativo` y `playtester-novato` |
| Skills de Phaser (`phaserjs/phaser`, etc.) | No usamos motor de juego canvas | — |

## Skills propias del proyecto (ya creadas en `.claude/`)

`siguiente-tarea`, `verificar`, `nueva-mision`, `nuevo-comando`, `handoff-diseno` + subagentes `disenador-narrativo`, `revisor-curricular`, `verificador-fidelidad`, `qa-movil`, `playtester-novato`. Detalle en `docs/plan/07-calidad-harness.md`.

## Context7 en sesiones cloud (Claude Code web)

En esta sesión el servidor MCP de Context7 falló al conectar porque la política de red del entorno denegó `mcp.context7.com`. Para usarlo en sesiones web: menú del entorno cloud en la barra de título de la sesión → **Edit** → **Network access** → agregar `mcp.context7.com` (y `context7.com` si usas el CLI) en *Allowed domains*, dejando marcada la casilla de gestores de paquetes. Pasos oficiales: https://code.claude.com/docs/en/cloud-environments#network-access. En tu Claude Code local no hace falta nada.

## Fuentes

- https://github.com/affaan-m/ECC
- https://github.com/Hainrixz/the-architect
- https://github.com/obra/superpowers
- https://github.com/github/spec-kit
- https://github.com/emilkowalski/skills
- https://github.com/mattpocock/skills
- https://github.com/upstash/context7 · https://context7.mintlify.dev/docs/clients/claude-code · https://tessl.io/registry/skills/github/upstash/context7/context7-cli
- https://github.com/DietrichGebert/ponytail · https://skillselion.com/guides/ponytail-skill-claude-code-guide
- https://github.com/anthropics/skills
- https://skills.sh/donchitos/claude-code-game-studios/team-narrative · https://opusgamelabs.github.io/game-creator
- https://qaskills.sh/blog/playwright-cli-install-quickstart-2026
- https://github.com/xtermjs/xterm.js/issues/3600 · https://github.com/xtermjs/xterm.js/issues/5377 (problemas de xterm.js en móvil → ADR-002)
- https://www.pistack.xyz/posts/2026-11-03-postgres-in-the-browser-pglite-libsql-turso-postgres-wasm/ · https://www.infoq.com/news/2024/05/pglite-wasm-postgres-browser (sql.js vs PGlite → ADR-003)
