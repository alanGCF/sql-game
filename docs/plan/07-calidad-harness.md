# 07 — Calidad y harness

"Harness" son dos cosas:

1. **Harness de agentes** — lo que rodea a Claude Code para que construya el juego de forma consistente: `CLAUDE.md`, skills, subagentes, hooks, permisos, backlog verificable.
2. **Harness de pruebas** — código que demuestra automáticamente que el motor es fiel, que cada misión se resuelve con cualquier semilla, que la escena se ve como debe y que el servidor resiste abuso.

## 1. Harness de agentes (`.claude/`)

| Pieza | Para qué |
|---|---|
| `CLAUDE.md` | Constitución: pilares, flujo de ramas, autonomía, reglas, definición de terminado |
| `settings.json` | Permisos sin preguntar para `npm run *`, vitest, playwright, tsc, biome, `git status/diff/log`; niega `git push --force` y leer `.env`; habilita superpowers |
| `hooks/post-edit.mjs` | Tras cada edición: `biome check --write` del archivo; si es YAML de `content/`, valida ese archivo. Si falla, devuelve el error a Claude (exit 2) |
| Skill `siguiente-tarea` | Toma la siguiente tarea desbloqueada y la ejecuta con TDD |
| Skill `verificar` | Compuerta: typecheck → lint → test → build/size → e2e |
| Skill `revision-visual` | Corre las capturas de Playwright, las compara contra la referencia y **las mira** para juzgar si se ven bien |
| Skill `nueva-mision` | Escribir una misión o favor correcto, con variables de partida, validado con muchas semillas |
| Skill `nuevo-comando` | Implementar un comando fiel y vigente (goldens en `debian:stable`) |
| Subagente `disenador-narrativo` | Acoplamiento herramienta→trama, voz, consistencia, longitud de globos |
| Subagente `revisor-curricular` | Prerequisitos, ≤ 2 conceptos, validación por resultado, pistas, favores |
| Subagente `verificador-fidelidad` | Comando simulado vs real y **vigencia** (nada obsoleto) |
| Subagente `qa-visual` | Playwright en escritorio: escena, transiciones, capas DOM, accesibilidad, rendimiento |
| Subagente `playtester-novato` | Juega una misión como principiante con `npm run play` |
| Subagente `auditor-seguridad` | Revisa el diff contra `08-seguridad.md` antes de ir a `main` |

Flujo de una tarea: `/siguiente-tarea` → test que falla → implementación mínima → `/verificar` → `/revision-visual` (si hay cambios visibles) → revisores → commit en `develop`.

## 2. Harness de contenido (`npm run validate:content`)

Corre en cada build, en CI y en el hook al editar YAML. Severidad **error** (rompe CI) o **aviso**.

| # | Regla | Severidad |
|---|---|---|
| C1 | Esquema Zod (campos, tipos, longitudes: título ≤ 40, globo ≤ 280, 2–4 globos, 1–3 objetivos, 3 pistas) | error |
| C2 | **Autosolución con muchas semillas:** `solucion` completa la misión con cada semilla del conjunto (25 en CI, 500 nocturno) | error |
| C3 | Cada `soluciones_alternativas` también completa la misión | error |
| C4 | Ningún `contraejemplos` cumple su objetivo | error |
| C5 | La pista 3 de cada objetivo contiene un comando entre backticks que, ejecutado tras los pasos previos, cumple el objetivo | error |
| C6 | `requiere` ⊆ conceptos enseñados antes | error |
| C7 | `ensena` ≤ 2 conceptos, todos existen en `curriculo.yaml` | error |
| C8 | Comandos y banderas de `solucion` están en la superficie y ya se enseñaron | error |
| C9 | Cada concepto se repasa ≥ 2 veces después (misiones o favores), salvo T13 | aviso |
| C10 | Referencias válidas: personajes, contactos, hosts, rutas, tablas, conceptos, variables | error |
| C11 | Determinismo: misma semilla → mismo estado final (hash) | error |
| C12 | Todos los finales del T13 son alcanzables | error |
| C13 | Duración 3–8 min y ≤ 3 objetivos | aviso |
| C14 | Ortografía es-MX de los textos visibles (`cspell-lib` con el español de cspell y `content/diccionario.txt`; ignora código entre backticks, `{{variables}}` y rutas) | aviso |
| C15 | Ningún texto visible contiene la solución de un objetivo | aviso |
| C16 | **Favores:** `ensena: []`, `refuerza` ya enseñado, `disponible_desde` entre 1 y 2 misiones después de la que enseña el concepto más reciente; no modifica banderas de la historia | error |
| C17 | **Variabilidad:** al menos el 80 % de las respuestas esperadas cambian entre semillas (si no, la respuesta se puede memorizar) | aviso |
| C18 | Ningún texto contiene un valor que debería ser `{{variable}}` (detecta valores de ejemplo pegados a mano) | error |
| C19 | **Llamadas** (`content/llamadas/`): un archivo por contacto con extensión, nombrado como su id; el contacto tiene paciencia; hay al menos una conversación general (sin `turnos` ni `requiere`); ids únicos; `requiere` pide una bandera que existe (efecto `flag` de una misión, `flag` de una opción o `llamo_<contacto>`); sin `{{variables}}` | error |

## 3. Pruebas del motor

- **Unitarias (Vitest):** lexer, parser, clasificador de entrada, expansión, VFS, permisos, red, variables/RNG, predicados, guardado y migraciones.
- **Goldens de fidelidad y vigencia:** `tests/golden/<comando>/<caso>/` con `setup.sh`, `cmd.txt`, `stdout.txt`, `stderr.txt`, `code.txt`, `version.txt`. Se capturan **ejecutando el comando real en `debian:stable`** con `LC_ALL=C TZ=UTC` (job de CI `goldens`, también ejecutable localmente con Docker). El test reproduce `setup.sh` en el VFS y compara exacto. Desviaciones permitidas solo si están anotadas en el caso.
- **SQL:** cada consulta de referencia del contenido se ejecuta también en SQLite nativo (Python `sqlite3`) para comparar resultados y errores.
- **Red:** sin equivalente real; el golden cita la fuente del formato (`# fuente:` iputils, iproute2, bind9, curl).
- **Clasificador:** tabla de ≥ 100 entradas (soportadas, typos, reales fuera de alcance, avanzadas, peligrosas, anómalas).
- **Rendimiento:** `vitest bench` para `exec` (≤ 16 ms comando simple).

## 4. Pruebas del servidor

`fastify.inject` con almacén en memoria + pruebas de integración contra PostgreSQL real (servicio de CI):
- formato de código inválido → 400 sin tocar la base; código inexistente → respuesta uniforme;
- cuerpo > 64 KB → 413; claves desconocidas → 400; tipos incorrectos → 400;
- límite de tasa → 429;
- cabeceras de seguridad presentes en estáticos y API (CSP, HSTS, nosniff, frame-ancestors);
- `revision` vieja → 409; inyección en campos (`'; DROP TABLE`) se guarda como texto inerte;
- errores sin trazas.

## 5. Revisión visual y funcional (Playwright)

**Siempre** que cambie la escena, una interfaz o un flujo. Chromium está preinstalado en el sandbox (`require('playwright')`); no correr `playwright install`.

- **Modo de prueba `?test=1`:** cámara sin amortiguación, animaciones desactivadas o instantáneas, reloj de juego fijo, semilla fija, ambientales apagados, `window.__game` expone acciones de prueba (girar cámara a un ángulo, acercarse a un objeto, ejecutar comando).
- **Proyecto `desktop-1080` (1920×1080) y `desktop-720` (1280×720).** WebGL por software (SwiftShader) en headless.
- **Capturas de referencia** (`tests/e2e/capturas.spec.ts`, `toHaveScreenshot`, tolerancia `maxDiffPixelRatio` 0.015, a 1280×720) de: menú, cubículo al frente con el briefing y de tarde, atardecer y noche, mirando a izquierda/derecha/escritorio, cada vista acercada (teléfono, libreta, pizarrón, calendario), terminal con salida, app Tickets, llamada en curso. Globo de pensamiento y visita con opciones se agregan cuando existan (F4). Se generan y comparan **solo en CI**, en el contenedor oficial de Playwright fijado por digest (mismas fuentes y Chromium); un push del dueño del repo a `develop` con `[capturas]` en el mensaje del último commit las regenera y un job sin dependencias las sube validadas (nombres, cantidad, tamaño y estructura PNG 1280×720 revisados antes de tener repo y token en disco). Sin referencias, la comparación falla. Ese commit del bot llega a `develop` sin CI: **antes de llevar `develop` a `main` se revisan su diff y sus imágenes**. La imagen del contenedor (etiqueta y digest) se sube a mano junto con `@playwright/test`; un paso falla si no coinciden.
- **Flujos funcionales:** nuevo ingreso → código mostrado → T0 completo → recargar → checar entrada con el código → mismo estado; zoom in/out; pegar bloqueado en terminal y libreta; texto de libreta no seleccionable; teclado completo (`Tab`/`Enter`/`Esc`).
- **Accesibilidad:** axe sobre las capas DOM sin violaciones *serious/critical*; subtítulos presentes para cada audio disparado.
- **Rendimiento:** medición de FPS y draw calls con `renderer.info` en una vista fija (umbral relajado en SwiftShader; la medición real se hace en hardware en F9). La escena se dibuja a demanda (ADR-018): quieta no gasta GPU, y las capturas salen en ~100 ms aun con WebGL por software.
- **Revisión humana-agente:** la skill `revision-visual` además **abre las capturas** y las evalúa contra `docs/diseno/direccion-arte.md` (encuadre, legibilidad, contraste, que nada se salga o se encime). Las capturas del cambio se envían al usuario cuando hay decisiones estéticas.

## 6. CI (GitHub Actions)

En cada push a `develop` y `main` y en PRs:

1. `npm ci`
2. `npm run typecheck` · `npm run lint`
3. `npm run test` (motor, servidor, contenido con 25 semillas)
4. `npm run build` + `npm run size`
5. `npm run e2e` (flujos) y job `capturas` (referencias en el contenedor de Playwright)
6. `npm audit --audit-level=high` · CodeQL (repo público; sube a Security y falla con hallazgos) · escaneo de secretos de GitHub
7. Job `goldens` (`debian:stable`): recaptura y compara goldens (falla si el sistema real cambió)
8. Job `imagen`: construye el Dockerfile, arranca el contenedor, comprueba `/healthz`, cabeceras, usuario `node` y que no pueda escribir su código

Nocturno: contenido con 500 semillas, goldens, auditoría de dependencias.
Despliegue: Railway despliega `main` (configurado en el panel de Railway: rama `main`, "esperar a CI").

## 7. Playtests con personas

Protocolo (skills `design:user-research` y `design:research-synthesis`):
- 5 personas por ronda que nunca hayan usado terminal, en su propia computadora.
- Pensar en voz alta; el observador no ayuda.
- Medir: tiempo por misión, pistas pedidas, llamadas "de más", errores repetidos, punto de abandono, favores completados.
- Al final, ejercicio de transferencia en un Linux real con 3 tareas equivalentes.
- Rondas: fin de F4 (T0–T1), fin de F6 (MVP T0–T5), fin de F8 (v0.9).

## 8. Definición de terminado

Ver `CLAUDE.md` §Definición de terminado (fuente de verdad).
