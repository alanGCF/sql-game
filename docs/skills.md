# Skills y plugins para el proyecto

Investigación del 2026-11-07, actualizada el 2026-11-24 con el cambio a escritorio y escena 3D.

**Regla general:** no instalar dos frameworks de proceso completos a la vez. Base: **superpowers**. Lo demás, piezas puntuales.

## Tier 1 — instalar

| Skill / plugin | Qué aporta aquí | Instalación (Claude Code) |
|---|---|---|
| **superpowers** (obra) | Lluvia de ideas, planes, TDD, depuración sistemática, verificación | `/plugin install superpowers@claude-plugins-official` *(ya declarado en `.claude/settings.json`)* |
| **ponytail** (DietrichGebert) | Cambio mínimo completo; `shortcut:`; `/ponytail-review` | Ya tienes `ponytail`, `ponytail-review`, `ponytail-debt` en tu cuenta |
| **Context7** (upstash) | Documentación vigente de three.js, R3F, drei, Vite, Fastify, sql.js, Playwright, Zod | Ya configurado en tu cuenta, **pero requiere autorizarlo** en los conectores de claude.ai; alternativa: `npx ctx7 setup --claude` |
| **react-three-fiber-game** (openai/plugins) | Guía para juegos 3D en el navegador con R3F + drei y capas DOM, HUD, carga de GLB | `npx skills add https://github.com/openai/plugins --skill react-three-fiber-game` *(verificar contenido antes de instalar)* |
| **anthropics/skills** → `example-skills` | `frontend-design` (capas DOM con criterio), `webapp-testing` (Playwright), `skill-creator` | `/plugin marketplace add anthropics/skills` → `/plugin install example-skills@anthropic-agent-skills` |
| **emilkowalski/skills** | `emil-design-eng`, `animate`, `choreograph`, `animation-performance`, `review-animations` para transiciones e interfaz | `npx skills@latest add emilkowalski/skills` |
| **design** (plugin activo) | `ux-copy` (glosas, pistas, diálogos), `accessibility-review`, `user-research` / `research-synthesis` (playtests) | Ya disponible |

## Tier 2 — piezas puntuales

| Skill / plugin | Qué tomar | Instalación |
|---|---|---|
| **react-three-fiber** (anthemflynn/ccmp) | Referencia de R3F v9 + React 19 (hooks, rendimiento) | `npx skills add anthemflynn/ccmp --skill react-three-fiber` *(verificar)* |
| **mattpocock/skills** | `grill-me` (cerrar decisiones), `to-tickets` (backlog → issues), `domain-modeling` (glosario/ADR) | `/plugin install mattpocock-skills@claude-plugins-official` |
| **the-architect** | `/architect-audit` como segunda opinión y pre-mortem del plan | `/plugin marketplace add Hainrixz/the-architect` → `/plugin install the-architect@soyenriquerocha` |

## Tier 3 — no instalar

| Repo | Por qué no |
|---|---|
| ECC, spec-kit | Se solapan con superpowers y con `docs/plan/`; sus ideas ya están en el harness |
| Skills de Phaser / game-creator | Motores 2D/canvas distintos a nuestro stack |
| claude-code-game-studios | Demasiado pesado; no se pudo verificar su contenido |
| Skills genéricas de three.js sin mantenimiento claro | Riesgo de prácticas viejas; preferir Context7 + docs oficiales |

## ¿Claude Design o Claude Code? (D-08)

Respuesta corta: **seguir en Claude Code** (ADR-016). Claude Design produce pantallas y prototipos 2D; el juego es una escena 3D en una sola pantalla con interfaz diegética, y el look se define en el código de la escena (materiales, luz, postprocesado). Iteramos con capturas reales de Playwright. Claude Design queda opcional para explorar el look de las capas 2D (terminal, libreta, teléfono).

## Skills y subagentes propios (`.claude/`)

Skills: `siguiente-tarea`, `verificar`, `revision-visual`, `nueva-mision`, `nuevo-comando`.
Subagentes: `disenador-narrativo`, `revisor-curricular`, `verificador-fidelidad`, `qa-visual`, `playtester-novato`, `auditor-seguridad`.

## Fuentes

- https://github.com/obra/superpowers · https://github.com/DietrichGebert/ponytail · https://github.com/upstash/context7
- https://tessl.io/registry/skills/github/openai/plugins/react-three-fiber-game · https://skills.sh/anthemflynn/ccmp/react-three-fiber · https://github.com/cloudai-x/threejs-skills
- https://github.com/anthropics/skills · https://github.com/emilkowalski/skills · https://github.com/mattpocock/skills · https://github.com/Hainrixz/the-architect
- https://github.com/affaan-m/ECC · https://github.com/github/spec-kit
