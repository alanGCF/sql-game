# 07 — Calidad y harness

"Harness" aquí son dos cosas:

1. **Harness de agentes** — todo lo que rodea a Claude Code para que construya el juego de forma consistente: `CLAUDE.md`, skills, subagentes, hooks, permisos, backlog con criterios verificables.
2. **Harness de contenido y pruebas** — el código que demuestra automáticamente que cada misión es resoluble, enseña lo que dice y respeta el currículo; más las pruebas del motor y de la UI móvil.

## 1. Harness de agentes (`.claude/`)

| Pieza | Archivo | Para qué |
|---|---|---|
| Constitución | `CLAUDE.md` | Pilares, reglas de código y contenido, definición de terminado |
| Permisos | `.claude/settings.json` | Permite sin preguntar `npm run *`, vitest, playwright, tsc, biome y `git status/diff/log`; niega `git push --force` y leer `.env` |
| Hook post-edición | `.claude/hooks/post-edit.mjs` | Tras cada `Edit`/`Write`: `biome check --write` del archivo; si es YAML de `content/`, corre `validate:content` de ese archivo. Si falla, devuelve el error a Claude (exit 2) para que lo corrija. No hace nada mientras no exista el tooling |
| Plugin habilitado | `.claude/settings.json` → `enabledPlugins` | `superpowers` (brainstorming, planes, TDD, debugging, verificación) |
| Skill `siguiente-tarea` | `.claude/skills/siguiente-tarea/` | Toma la siguiente tarea desbloqueada del backlog y la ejecuta con TDD |
| Skill `verificar` | `.claude/skills/verificar/` | Compuerta completa: typecheck → lint → test → build/size → e2e |
| Skill `nueva-mision` | `.claude/skills/nueva-mision/` | Flujo para escribir una misión correcta y validada |
| Skill `nuevo-comando` | `.claude/skills/nuevo-comando/` | Flujo para implementar un comando fiel (goldens desde Linux real) |
| Skill `handoff-diseno` | `.claude/skills/handoff-diseno/` | Integrar el export de Claude Design |
| Subagente `disenador-narrativo` | `.claude/agents/` | Revisa acoplamiento herramienta→trama, voz, consistencia, longitud móvil |
| Subagente `revisor-curricular` | `.claude/agents/` | Revisa prerequisitos, ≤ 2 conceptos, validación por resultado, pistas |
| Subagente `verificador-fidelidad` | `.claude/agents/` | Compara comando simulado vs Linux/SQLite real en el sandbox |
| Subagente `qa-movil` | `.claude/agents/` | Playwright móvil: teclado abierto, tamaños táctiles, a11y, persistencia |
| Subagente `playtester-novato` | `.claude/agents/` | Juega una misión como principiante usando solo `npm run play` |

Flujo típico de una tarea:

```
/siguiente-tarea → (brainstorming si hay ambigüedad) → test que falla → implementación mínima → /verificar → revisores (si aplica) → commit
```

## 2. Harness de contenido (`npm run validate:content`)

Corre en cada build, en CI y en el hook al editar YAML. Cada regla tiene severidad **error** (rompe CI) o **aviso**.

| # | Regla | Severidad |
|---|---|---|
| C1 | El YAML cumple el esquema Zod (campos, tipos, longitudes: título ≤ 40, burbuja ≤ 280, 2–4 burbujas, 1–3 objetivos, 3 pistas) | error |
| C2 | **Autosolución:** en un mundo recién cargado, ejecutar `solucion` cumple todos los objetivos y la misión termina | error |
| C3 | Cada `soluciones_alternativas` también completa la misión (garantiza validación por resultado) | error |
| C4 | Ningún `contraejemplos` cumple el objetivo al que apunta | error |
| C5 | La pista 3 de cada objetivo contiene al menos un bloque entre backticks que, ejecutado tras los pasos previos de la solución, cumple ese objetivo | error |
| C6 | `requiere` ⊆ conceptos de `ensena` de misiones anteriores (por `turno`, `orden`) | error |
| C7 | `ensena` tiene ≤ 2 conceptos y todos existen en `curriculo.yaml` | error |
| C8 | Todo comando y bandera usados en `solucion` están en la superficie de comandos y fueron enseñados en esta misión o antes | error |
| C9 | Cada concepto se reutiliza ≥ 2 veces en misiones posteriores (salvo Turno 12) | aviso |
| C10 | Referencias válidas: personajes, hosts, rutas, tablas y conceptos existen | error |
| C11 | Determinismo: dos ejecuciones de `solucion` producen el mismo estado final (hash) | error |
| C12 | Todos los finales de T12 son alcanzables (una ruta de solución por final) | error |
| C13 | Duración estimada 3–8 min y ≤ 3 objetivos | aviso |
| C14 | Ortografía es-MX con diccionario del proyecto (`cspell`) en textos visibles | aviso |
| C15 | Ningún texto de briefing contiene literalmente la solución de un objetivo | aviso |

## 3. Pruebas del motor

- **Unitarias (Vitest):** lexer, parser, expansión, VFS, permisos, red, predicados, guardado/migraciones.
- **Goldens de fidelidad:** `tests/golden/<comando>/<caso>/` con `setup.sh` (crea el estado), `cmd.txt`, `stdout.txt`, `stderr.txt`, `code.txt`, capturados **ejecutando el comando real** con `LC_ALL=C TZ=UTC` en el sandbox. El test reproduce `setup.sh` en el VFS y compara exacto. Desviaciones permitidas (documentadas en el propio caso): fechas del reloj de juego, nombres de usuario/grupo del mundo.
- **SQL:** cada consulta de contenido se ejecuta también con `python3 -I -c 'import sqlite3 …'` sobre la misma base para comparar resultados y mensajes de error.
- **Red:** sin equivalente real en el sandbox; los goldens citan el formato de la documentación (iputils, iproute2, bind9 dig, curl) en un comentario `# fuente:`.
- **Rendimiento:** `vitest bench` para `exec` (≤ 16 ms comando simple).

## 4. Pruebas de UI (Playwright)

Proyectos: `pixel-7` (Chromium), `iphone-13` (WebKit), `desktop-chrome`. Chromium ya está preinstalado en el sandbox de Claude Code: `require('playwright')` funciona, **no** correr `playwright install`.

| Prueba | Qué verifica |
|---|---|
| Loop T0-M1 | nueva partida → briefing → teclear comandos → responder → misión completada |
| Teclado abierto | con viewport reducido a la altura con teclado: input y barra de accesos visibles, última línea visible, sin scroll horizontal |
| Barra de accesos | tocar `|`, `Tab`, `↑` no quita el foco del input |
| Persistencia | recargar a mitad de misión conserva historial, mundo y objetivos |
| Restaurar misión | `rm -r` de algo importante → restaurar → mundo de inicio |
| Offline | segunda carga sin red funciona (service worker) |
| Accesibilidad | `@axe-core/playwright` sin violaciones *serious/critical* en cada pantalla |
| Tamaños táctiles | todo control interactivo ≥ 44×44 px |

## 5. CI (GitHub Actions)

En cada push y PR:

1. `npm ci`
2. `npm run typecheck`
3. `npm run lint`
4. `npm run test` (motor + harness de contenido)
5. `npm run build` + `npm run size` (presupuestos de `05-arquitectura.md`)
6. `npm run e2e` (Chromium móvil + WebKit)

En `main`: deploy a GitHub Pages. Desde F8: Lighthouse CI móvil (rendimiento ≥ 90, accesibilidad ≥ 95).

## 6. Playtests con personas

Protocolo (se apoya en la skill `design:user-research`):

- 5 personas por ronda que nunca hayan usado terminal; en su propio teléfono.
- Pensar en voz alta; el observador no ayuda.
- Medir: tiempo por misión, pistas usadas, errores repetidos, punto de abandono, frases de confusión.
- Al final, ejercicio de transferencia en un Linux real (o un emulador web) con 3 tareas equivalentes.
- Síntesis con `design:research-synthesis`; hallazgos bloqueantes entran al backlog antes del release.

Rondas: fin de F3 (T0), fin de F5 (MVP), fin de F7 (v0.9).

## 7. Definición de terminado

Ver `CLAUDE.md` §Definición de terminado (fuente de verdad).
