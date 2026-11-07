# Registro de decisiones de arquitectura (ADR)

Formato corto: contexto → decisión → consecuencias. Estado: `propuesta` (pendiente de tu visto bueno en F0-03), `aceptada`, `reemplazada por ADR-X`.

---

## ADR-001 · Shell simulado en TypeScript, no emulador de Linux · propuesta

**Contexto.** Opciones para "una terminal Linux en el navegador": emular una máquina x86 (v86, WebVM/CheerpX) o simular un shell. Los emuladores descargan decenas de MB, consumen CPU/batería en celulares de gama media y no permiten instrumentar objetivos (saber qué leyó o cambió el jugador) sin hacks.

**Decisión.** Intérprete propio en TS con VFS en memoria, red simulada y un subconjunto fiel de comandos (`03-curriculo.md` §Superficie de comandos).

**Consecuencias.** (+) Ligero, determinista, testeable, offline, predicados exactos. (−) Hay que mantener fidelidad a mano: goldens capturados de Linux real y subagente `verificador-fidelidad`. Comandos fuera de la superficie responden "command not found" + glosa.

## ADR-002 · Terminal propia en DOM, no xterm.js · propuesta

**Contexto.** xterm.js es excelente en escritorio, pero sus issues abiertos documentan problemas en móvil: entrada corrupta en Android, sin manejo táctil dedicado ni integración con teclado virtual (xtermjs/xterm.js #3600, #5377). Nuestro juego no necesita aplicaciones de pantalla completa (vim, top).

**Decisión.** Salida como lista de líneas en el DOM + `<input>` nativo de una línea + barra de accesos. `less` y `man` usan un visor paginado propio.

**Consecuencias.** (+) Teclado nativo, accesibilidad (lectores de pantalla), copiar/pegar nativo, estilos por tipo de línea. (−) Sin TUI. Validación temprana con el spike F0-07.

## ADR-003 · SQLite en WASM con `sql.js`, carga diferida · propuesta (depende de D-03)

**Contexto.** `sql.js` ≈ 1 MB de WASM; PGlite (Postgres) ≈ 3 MB gzip con persistencia integrada.

**Decisión.** `sql.js`, cargado al llegar a T3 y precargado en segundo plano durante T2.

**Consecuencias.** (+) Peso aceptable en datos móviles. (−) Dialecto SQLite: diferencias con Postgres/MySQL se documentan en la Bitácora (tipos dinámicos, `||` para concatenar, fechas como texto). Persistencia manual (exportar a IndexedDB) desde T11.

## ADR-004 · Contenido como datos (YAML validado) · propuesta

**Contexto.** 52 misiones con narrativa, mundo y validaciones. Si viven en código, cada misión exige programar y revisar TS.

**Decisión.** Misiones, mundo, personajes, currículo y páginas man en `content/` (YAML/Markdown), validados con Zod y convertidos a JSON en build.

**Consecuencias.** (+) Escribir misiones es barato y lo valida el harness; separa narrativa de motor; facilita traducción. (−) Los predicados están acotados a los del catálogo; un predicado nuevo es cambio de motor.

## ADR-005 · Validación por resultado · propuesta

**Contexto.** Comparar el comando exacto rechaza soluciones correctas (`cat ./LEEME.txt` vs `cat LEEME.txt`) y enseña a memorizar, no a resolver.

**Decisión.** Objetivos = predicados sobre el estado del mundo o respuestas del jugador. `comando_ejecutado` solo para comandos observacionales sin efecto.

**Consecuencias.** (+) Cualquier camino correcto vale; las respuestas se vuelven hallazgos de la historia. (−) Cada comando debe registrar lecturas/cambios; el harness exige alternativas y contraejemplos.

## ADR-006 · Salidas en inglés real + glosas en español · propuesta (depende de D-04)

**Contexto.** Traducir la salida de `ls` o los errores de SQLite haría que el jugador no reconozca nada en un sistema real.

**Decisión.** La salida es idéntica a GNU/Linux/SQLite (locale C). Debajo de errores y salidas nuevas aparece una glosa en español, desactivable.

**Consecuencias.** (+) Transferencia directa. (−) Más texto en pantalla; la glosa debe ser corta y tener estilo distinto.

## ADR-007 · Stack web estático · propuesta

**Contexto.** Juego 100 % cliente, offline, desplegable gratis; autor con experiencia en Python/Django (backend), el navegador exige JS/TS.

**Decisión.** Vite + React + TypeScript strict + CSS Modules/variables + Zustand + Vitest + Playwright + Biome + vite-plugin-pwa; persistencia en IndexedDB; GitHub Pages. Sin backend en v1.

**Consecuencias.** (+) Cero costo de hosting, un solo lenguaje en el cliente, Claude Design entrega componentes compatibles con React. (−) Sin sincronización entre dispositivos (exportar/importar partida mientras tanto); backend Django queda para v2 (D-07).

## ADR-008 · Mundo determinista · propuesta

**Contexto.** El harness necesita que la solución dé siempre el mismo resultado y las respuestas sean fijas.

**Decisión.** El motor no usa `Date.now()` ni `Math.random()`: reloj de juego y RNG con semilla por misión. Los datos de `mes.db` salen de un generador con semilla fija.

**Consecuencias.** (+) Pruebas reproducibles, respuestas estables. (−) Variedad en Modo Taller depende de cambiar la semilla explícitamente.
