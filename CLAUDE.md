# CLAUDE.md — Turno Nocturno

Juego web móvil-primero que enseña Linux, SQL y redes desde cero mediante una historia de misterio en una planta de manufactura ficticia. El plan completo vive en `docs/` (índice: `docs/README.md`). Este archivo es la **constitución**: si algo aquí choca con otro documento, gana este archivo y se corrige el otro.

Idioma del proyecto: **español** (docs, contenido, commits, comentarios). Identificadores de código en inglés.

## Estado actual

Fase 0 (planeación + harness). No existe `package.json` todavía; los scripts `npm run …` de abajo se crean en la tarea F0-04 del backlog. Si un script no existe, dilo; no asumas que pasa.

## Pilares no negociables

1. **Móvil primero.** Todo se diseña y prueba primero a 360–430 px de ancho, en vertical, con el teclado del teléfono abierto.
2. **La herramienta avanza la trama.** Cada concepto enseñado revela información o cambia el estado del mundo que la historia necesita. Si se puede quitar la herramienta y la historia sigue igual, la misión está mal diseñada.
3. **Validación por resultado.** Los objetivos se cumplen por el estado del mundo o por una respuesta del jugador, nunca comparando la cadena exacta del comando. Cualquier solución correcta debe valer.
4. **Fidelidad.** Lo que se aprende funciona igual en un Linux real (GNU coreutils/bash), en SQLite real y con herramientas de red reales. La salida de los comandos se imprime en inglés como en el sistema real; las explicaciones van en español (glosas).
5. **Una idea nueva por misión** (máximo dos). Cada concepto se reutiliza después.
6. **Contenido como datos; motor sin DOM.** `src/engine/` es TypeScript puro sin React ni `window`. Las misiones son YAML en `content/`, validadas en build.
7. **Ligero y offline.** Presupuestos en `docs/plan/05-arquitectura.md` §Presupuestos. Funciona sin red después de la primera carga.
8. **Accesible.** WCAG 2.1 AA. El estado nunca depende solo del color.
9. **Seguridad responsable.** El jugador siempre actúa como empleado autorizado administrando/defendiendo su propia red. Nada de técnicas ofensivas reales.

## Flujo de trabajo para agentes

1. `/siguiente-tarea` toma la siguiente tarea desbloqueada de `docs/plan/backlog.md`.
2. Si hay ambigüedad de diseño, usa brainstorming (superpowers) o pregunta; si toca una decisión de `docs/plan/decisiones-abiertas.md` sin resolver, **detente y pregunta**.
3. Implementa con TDD (rojo → verde → refactor). Cambio mínimo completo (ponytail): nada de abstracciones especulativas. Un atajo deliberado se marca con `// shortcut: <qué y cuándo revisarlo>`.
4. `/verificar` antes de declarar algo terminado. Reporta resultados reales, incluidos fallos.
5. Commit por tarea: `F#-##: <resumen en español>`.

Skills del proyecto (`.claude/skills/`): `siguiente-tarea`, `verificar`, `nueva-mision`, `nuevo-comando`, `handoff-diseno`.
Subagentes (`.claude/agents/`): `disenador-narrativo`, `revisor-curricular`, `verificador-fidelidad`, `qa-movil`, `playtester-novato`.

Antes de escribir código contra una librería cuya API cambia (React, Vite, sql.js, Playwright, vite-plugin-pwa, Zod), consulta su documentación actual con Context7 si está disponible.

## Comandos (a partir de F0-04)

```bash
npm run dev              # servidor de desarrollo
npm run typecheck        # tsc --noEmit
npm run lint             # biome check
npm run test             # vitest: motor + harness de contenido
npm run validate:content # solo el harness de contenido (acepta rutas)
npm run play -- --mision <id> [--solucion]   # jugar una misión headless en terminal
npm run e2e              # playwright, proyectos móviles
npm run build && npm run size                # build + presupuestos
```

## Reglas de código

- TypeScript `strict`. Sin `any` salvo en fronteras con librerías, comentado.
- `src/engine/**` no importa de `src/ui/**`, React ni APIs del DOM. La UI consume el motor por su API pública.
- Un comando simulado = un archivo en `src/engine/commands/` + tests golden en `tests/golden/<comando>/` + página man en `content/man/<comando>.md`. Solo se implementan las banderas listadas en `docs/plan/03-curriculo.md` §Superficie de comandos.
- Determinismo: nada de `Date.now()` ni `Math.random()` en el motor; usa el reloj de juego y el RNG con semilla.
- Dependencia nueva = justificarla en `docs/decisiones/adr.md`.
- No desactives, saltes ni borres tests para que pase la compuerta.

## Reglas de contenido

- Español de México, tuteo, frases cortas. Máximo 280 caracteres por burbuja de diálogo.
- Toda misión trae `solucion`, al menos una `soluciones_alternativas` y al menos un `contraejemplos` (formato: `docs/ejemplos/mision-ejemplo.yaml`).
- Tres pistas por objetivo: empujón → concepto → solución ejecutable entre backticks. Las pistas no regañan.
- Personas, empresas, IPs y dominios son ficticios. Consistencia con la biblia del mundo (`docs/plan/02-trama.md` §Biblia del mundo).

## Definición de terminado

- Tests nuevos o actualizados que fallaban antes del cambio y pasan después.
- `/verificar` en verde (o el fallo reportado explícitamente al usuario).
- Si cambió contenido: harness de contenido en verde y revisión de `revisor-curricular`.
- Si cambió UI: `qa-movil` sin bloqueantes a 360×740 y 390×844 con teclado abierto.
- Docs afectados actualizados (currículo, superficie de comandos, backlog).

## Mapa de documentos

- `docs/plan/01-vision.md` — público, objetivos de aprendizaje, no-objetivos.
- `docs/plan/02-trama.md` — historia, personajes, turnos, finales, biblia del mundo.
- `docs/plan/03-curriculo.md` — grafo de conceptos, mapa misión↔concepto, superficie de comandos.
- `docs/plan/04-mecanicas.md` — loop, objetivos, pistas, progresión, entrada móvil.
- `docs/plan/05-arquitectura.md` — stack, módulos, interfaces, esquema de misión, presupuestos.
- `docs/plan/06-roadmap.md` — fases, versiones, criterios de salida.
- `docs/plan/07-calidad-harness.md` — harness de agentes, harness de contenido, pruebas, CI.
- `docs/plan/backlog.md` — tareas con Hacer / Listo cuando / Verificar.
- `docs/decisiones/adr.md` — decisiones de arquitectura tomadas.
- `docs/diseno/brief-claude-design.md` — requerimientos para Claude Design.
- `docs/glosario.md` — vocabulario del dominio.
