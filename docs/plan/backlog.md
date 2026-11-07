# Backlog

Formato por tarea: **Hacer** (qué), **Listo cuando** (criterio observable), **Verificar** (comando o revisión). Estados: `pendiente`, `en-progreso`, `hecha`, `bloqueada`. `/siguiente-tarea` toma la primera `pendiente` con dependencias `hecha`.

F0–F2 están detalladas. F3+ se detallan al iniciar cada fase.

---

## F0 — Harness y base

### F0-01 · Plan y harness inicial · `hecha` (2026-11-07)
- **Hacer:** `docs/plan/*`, `docs/diseno/brief-claude-design.md`, `CLAUDE.md`, `.claude/`.
- **Listo cuando:** los documentos existen y son consistentes entre sí.
- **Verificar:** revisión del usuario.

### F0-02 · Instalar skills recomendadas · `pendiente` · depende: F0-01
- **Hacer:** instalar el set "Tier 1" de `docs/skills.md` en tu Claude Code local; permitir `mcp.context7.com` en el entorno cloud si se usará Context7 en sesiones web.
- **Listo cuando:** `/plugin list` muestra superpowers; `/skills` (o el listado de skills) muestra las de emilkowalski y anthropics; Context7 responde.
- **Verificar:** usuario.

### F0-03 · Cerrar decisiones abiertas · `pendiente` · depende: F0-01
- **Hacer:** responder `decisiones-abiertas.md` (o sesión de `grill-me`); reflejar respuestas en docs y ADR.
- **Listo cuando:** D-01 a D-05 tienen estado `decidida`; el resto puede quedar con la recomendación por defecto.
- **Verificar:** ningún documento menciona una opción descartada.

### F0-04 · Scaffold del proyecto · `pendiente` · depende: F0-03 (D-03, D-04)
- **Hacer:** Vite + React + TS strict; Biome; Vitest; Playwright con proyectos `pixel-7`, `iphone-13`, `desktop-chrome`; scripts `dev typecheck lint test validate:content play e2e build size` (los que aún no tengan implementación imprimen "no implementado: <tarea>" y salen con código 1); estructura de carpetas de `05-arquitectura.md`.
- **Listo cuando:** `npm run typecheck && npm run lint && npm run test && npm run build` pasan con un test trivial; el hook post-edit formatea un `.ts` editado.
- **Verificar:** `/verificar`.

### F0-05 · CI · `pendiente` · depende: F0-04
- **Hacer:** workflow de GitHub Actions con los pasos de `07` §CI; `size` con límites de `05` §Presupuestos (falla si se exceden).
- **Listo cuando:** un PR de prueba muestra todos los checks en verde.
- **Verificar:** checks del PR.

### F0-06 · Deploy a GitHub Pages · `pendiente` · depende: F0-05
- **Hacer:** deploy en `main`; `base` de Vite correcto para Pages.
- **Listo cuando:** la URL pública abre en Android Chrome e iPhone Safari.
- **Verificar:** usuario abre en su teléfono.

### F0-07 · Spike: input de terminal en móvil · `pendiente` · depende: F0-04
- **Hacer:** página desechable `spike/terminal-input.html` con input nativo + barra de accesos + salida que hace scroll; manejo de `visualViewport`. Sin diseño.
- **Listo cuando:** en Android y iPhone reales: el teclado no tapa el input, tocar la barra no cierra el teclado, no hay zoom al enfocar, el eco del comando aparece al instante.
- **Verificar:** usuario en su teléfono + E2E con viewport reducido. Resultado documentado en ADR-002.

---

## F1 — Motor: shell + VFS + comandos T0–T2

### F1-01 · VFS · `pendiente` · depende: F0-04
- **Hacer:** árbol en memoria, rutas absolutas/relativas, `..`, `~`, metadatos, permisos por usuario, capa de diferencias.
- **Listo cuando:** tests de resolución de rutas, permisos (lectura/escritura/ejecución), diferencias y restauración.
- **Verificar:** `npm run test -- vfs`.

### F1-02 · Reloj de juego y RNG con semilla · `pendiente` · depende: F0-04
- **Hacer:** `clock.ts` (avanza por comandos/eventos, no por tiempo real), `rng.ts`.
- **Listo cuando:** mismas entradas → mismas salidas (test de determinismo).
- **Verificar:** `npm run test -- clock rng`.

### F1-03 · Lexer y parser · `pendiente` · depende: F0-04
- **Hacer:** tokens, comillas, escapes, operadores `| > >> < 2> 2>&1 && || ;` → AST.
- **Listo cuando:** tabla de ≥ 40 casos (incluye errores de sintaxis con mensaje de bash real).
- **Verificar:** `npm run test -- parser`.

### F1-04 · Expansión y ejecutor · `pendiente` · depende: F1-01, F1-03
- **Hacer:** `~`, `$VAR`, `$?`, globs contra VFS; tuberías; redirecciones; códigos de salida; historial; entorno.
- **Listo cuando:** `echo hola > a && cat a | wc -c` produce `5` y código 0.
- **Verificar:** `npm run test -- shell`.

### F1-05 · Comandos T0 · `pendiente` · depende: F1-04
- **Hacer:** `pwd ls cd cat man help clear history exit` con banderas de la superficie; goldens; man en español.
- **Listo cuando:** goldens verdes; `verificador-fidelidad` sin desviaciones no documentadas.
- **Verificar:** `npm run test -- golden` + subagente.

### F1-06 · Comandos T1 · `pendiente` · depende: F1-05
- **Hacer:** `echo head tail less mkdir touch cp mv rm` (+ `ls -l -h` completo).
- **Listo cuando / Verificar:** igual que F1-05.

### F1-07 · Comandos T2 · `pendiente` · depende: F1-05
- **Hacer:** `grep wc sort uniq cut`.
- **Listo cuando / Verificar:** igual que F1-05.

### F1-08 · Glosas, "quisiste decir" y comandos de Windows · `pendiente` · depende: F1-05
- **Hacer:** glosas en español para errores comunes; sugerencia por distancia de edición; mapa `dir/cls/type/ipconfig/copy/del`.
- **Listo cuando:** tests de 20 errores típicos de novato con glosa esperada.
- **Verificar:** `npm run test -- gloss` + `playtester-novato` en modo `--exec`.

### F1-09 · Autocompletado · `pendiente` · depende: F1-05
- **Hacer:** comandos, rutas del VFS, banderas aprendidas.
- **Listo cuando:** `cat LE` + Tab → `cat LEEME.txt`; ambigüedad devuelve lista.
- **Verificar:** `npm run test -- complete`.

### F1-10 · `npm run play --exec` · `pendiente` · depende: F1-04
- **Hacer:** CLI headless para ejecutar comandos sobre un fixture.
- **Listo cuando:** `npm run play -- --exec "ls -la" --fixture tests/golden/ls/ocultos` imprime la salida.
- **Verificar:** manual + test de humo.

---

## F2 — Runtime de misiones + harness de contenido + Turno 0

### F2-01 · Esquema de misión y currículo en datos · `pendiente` · depende: F1-04
- **Hacer:** Zod para misión, personajes, hosts, currículo; migrar el grafo de `03-curriculo.md` a `content/curriculo.yaml`.
- **Listo cuando:** `docs/ejemplos/mision-ejemplo.yaml` valida; un YAML roto da error legible con ruta del campo.
- **Verificar:** `npm run test -- schema`.

### F2-02 · Pipeline de contenido · `pendiente` · depende: F2-01
- **Hacer:** `scripts/build-content.ts` YAML → JSON por turno (chunks); integración con Vite.
- **Listo cuando:** `npm run build` genera los chunks; error de esquema rompe el build.
- **Verificar:** `npm run build`.

### F2-03 · Predicados y runtime · `pendiente` · depende: F2-01
- **Hacer:** predicados de `04-mecanicas.md` (sin los de SQL/red, que llegan en F4/F5), combinadores, registro de lecturas/cambios por comando, eventos, pistas, calificación.
- **Listo cuando:** tests por predicado (positivo y negativo).
- **Verificar:** `npm run test -- mission`.

### F2-04 · Guardado y restauración · `pendiente` · depende: F2-03
- **Hacer:** `serialize`/carga con versión y migraciones; restaurar misión.
- **Listo cuando:** partida de ejemplo `save:v1` carga; restaurar regresa el hash del mundo al de inicio.
- **Verificar:** `npm run test -- save`.

### F2-05 · Harness de contenido · `pendiente` · depende: F2-03
- **Hacer:** `scripts/validate-content.ts` + suite Vitest con reglas C1–C15.
- **Listo cuando:** una misión con cada tipo de defecto (fixture) dispara su regla; el ejemplo pasa.
- **Verificar:** `npm run validate:content`.

### F2-06 · `npm run play --mision` · `pendiente` · depende: F2-03, F1-10
- **Hacer:** modo interactivo (briefing, objetivos, `?pista`, `?responder`), `--solucion`, modo por pasos `--sesion <json> --cmd "<línea>"` y lectura de stdin no-TTY (ver `05-arquitectura.md` §Herramienta headless).
- **Listo cuando:** se juega T0-M2 completo en la terminal y también con llamadas sucesivas `--cmd`.
- **Verificar:** manual + test de humo.

### F2-07 · Mundo base del Turno 0 · `pendiente` · depende: F2-01
- **Hacer:** `content/mundo/hosts/srv-sistemas.yaml` y `fs/` de T0 según la biblia del mundo.
- **Listo cuando:** valida (C10) y `ls -la ~` muestra lo esperado.
- **Verificar:** `npm run validate:content`.

### F2-08 · Misiones T0-M1 a T0-M4 · `pendiente` · depende: F2-05, F2-07
- **Hacer:** con la skill `nueva-mision`.
- **Listo cuando:** harness verde; revisores sin bloqueantes; `playtester-novato` completa T0.
- **Verificar:** `npm run validate:content` + subagentes.

---

## F3 en adelante (resumen; se detalla al iniciar la fase)

- **F3** UI móvil (depende de D2): tokens · app shell · Terminal/input/barra/autocompletado · Mensajes · Bitácora · briefing · objetivos · pistas · misión completada · mapa de turnos · ajustes · IndexedDB · PWA · E2E móviles · playtest ronda 1.
- **F4** SQL + T1–T3: contenido T1–T2 · generador `mes.db` · `sql.js` diferido · `sqlite3` · app Datos · predicados SQL · contenido T3.
- **F5** Red + T4: modelo de red · comandos de red · app Red · `wall` · contenido T4 · playtest ronda 2 · **release v0.2**.
- **F6** T5–T8 · logros · Modo Taller T0–T4.
- **F7** T9–T12 · scripts/cron · DML/transacciones · finales · DB persistida · playtest ronda 3.
- **F8** a11y completa · Lighthouse CI · offline total · tarjetas de campo · landing · **release v1.0**.
