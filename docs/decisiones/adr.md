# Registro de decisiones técnicas (ADR)

Formato corto: contexto → decisión → consecuencias. Las decisiones de código las toma el agente; las de funcionalidad/estética están en `docs/plan/decisiones-abiertas.md`.

---

## ADR-001 · Shell simulado en TypeScript, no emulador de Linux · aceptada

**Contexto.** Emular x86 (v86, WebVM) descarga decenas de MB, consume CPU y no permite saber qué leyó o cambió el jugador; además ejecutaría cualquier cosa.
**Decisión.** Intérprete propio con VFS, red simulada y un subconjunto fiel y vigente de comandos.
**Consecuencias.** (+) Ligero, determinista, testeable, controlable (globo de pensamiento). (−) Fidelidad a mano: goldens de `debian:stable` y `verificador-fidelidad`.

## ADR-002 · Terminal propia en DOM sobre el monitor, no xterm.js · aceptada

**Contexto.** Con el cambio a escritorio xterm.js sería viable, pero emula una terminal real de PTY: dificulta interceptar cada línea antes de ejecutarla (clasificador), bloquear pegar, insertar glosas y estilos por tipo de línea, y testear con Playwright.
**Decisión.** Lista de líneas en DOM + input propio, posicionado sobre el monitor de la escena cuando el jugador se acerca. `less`/`man` con visor propio.
**Consecuencias.** (+) Control total de la entrada, accesible, fácil de probar. (−) Sin aplicaciones de pantalla completa (vim, top), que están fuera de alcance de todas formas.

## ADR-003 · SQLite en WASM con `sql.js`, en Web Worker, carga diferida · aceptada (D-03)

**Decisión.** `sql.js` cargado al llegar al T4 (precarga durante T3) dentro de un Worker para no bloquear el render 3D. La base se genera con la semilla.
**Consecuencias.** Dialecto SQLite; diferencias con otros motores documentadas en la libreta.

## ADR-004 · Contenido como datos (YAML validado) · aceptada

Misiones, favores, mundo, personajes, contactos, rumores, visitas, currículo y libreta en `content/`, validados con Zod y convertidos a JSON en build.

## ADR-005 · Validación por resultado · aceptada

Objetivos = predicados sobre el estado o respuestas; respuestas esperadas calculadas del mundo (`esperado_de`). Exige alternativas y contraejemplos en cada misión.

## ADR-006 · Salidas en inglés real + glosas en español · aceptada (D-04)

## ADR-007 · Stack web · aceptada (actualizada)

**Decisión.** Vite + React + TypeScript strict + Zustand + Vitest + Playwright + Biome. Despliegue en Railway (ADR-010). Sin GitHub Pages.

## ADR-008 · Mundo determinista por semilla · aceptada

El motor no usa `Date.now()` ni `Math.random()`. Reloj de juego y RNG con semilla.

## ADR-009 · Escena 3D con three.js + React Three Fiber + drei · aceptada

**Contexto.** El juego ocurre en un cubículo 3D en primera persona con interfaz diegética y capas DOM (terminal, libreta, teléfono). Opciones: three.js directo, React Three Fiber (R3F), Babylon.js, PlayCanvas, motores con exportación web (Godot, Unity).
**Decisión.** three.js con R3F (declarativo, mismo React que las capas DOM) y drei (cámaras, `Html`, cargadores, utilidades de interacción). Postprocesado solo si el estilo elegido lo necesita.
**Consecuencias.** (+) Un solo lenguaje y árbol de componentes; DOM nítido y accesible para texto; ecosistema grande; el estado del juego se comparte sin puentes. (−) Hay que cuidar rendimiento (draw calls, texturas) y evitar re-renders de React en el bucle de render (`useFrame`, refs). Godot/Unity se descartan por peso del build web, integración pobre con DOM y pruebas con Playwright más difíciles.

## ADR-010 · Servidor Fastify + PostgreSQL en Railway para el código de partida · aceptada

**Contexto.** El código de partida debe permitir continuar en otra computadora → hace falta guardar en servidor desde v1. El usuario usa Railway (Hobby). Antes se había aceptado Django para v2.
**Decisión.** Un solo servicio Node (Fastify) que sirve el build estático y `/api/partidas`, con PostgreSQL de Railway. Esquemas Zod compartidos con el cliente (`shared/`).
**Consecuencias.** (+) Un solo lenguaje, un solo despliegue, la misma validación en cliente y servidor (menos huecos de seguridad), costo bajo. (−) Se descarta Django para no mantener dos backends; si en v2 se necesitan cuentas o modo salón, se agregan al mismo servicio.

## ADR-011 · Variables de partida y respuestas calculadas · aceptada

**Decisión.** Semilla por partida; variables declaradas con generadores; textos y datos con `{{variable}}`; respuestas esperadas calculadas con una solución de referencia sobre una copia oculta del mundo. El harness prueba cada misión con muchas semillas.
**Consecuencias.** (+) No se pueden memorizar respuestas; la historia no cambia. (−) El contenido no puede depender de valores fijos (regla C18).

## ADR-012 · Entrada solo tecleada · aceptada

**Decisión.** Bloquear `paste`/`drop`/`insertFromPaste` en terminal, Datos, tickets y libreta; texto de libreta, pistas y post-its no seleccionable. Es un empujón de diseño, no un control de seguridad.

## ADR-013 · Línea base de seguridad · aceptada

Controles de `docs/plan/08-seguridad.md`: validación Zod en servidor, SQL parametrizado, código de 55 bits guardado como hash, límites de tamaño y tasa, CSP estricta y cabeceras, contenedor no root, `npm audit`, CodeQL, auditoría antes de `main`.

## ADR-014 · Ramas `main` y `develop` · aceptada

Solo dos ramas. Se trabaja en `develop` (un commit por tarea). `main` recibe `develop` con `--ff-only` tras CI, verificación, revisión visual, revisión de seguridad y aprobación del usuario. Railway despliega `main`.

## ADR-015 · Audio con Web Audio vía three.js · aceptada (actualizada con D-19)

**Decisión.** `AudioListener`/`PositionalAudio` de three.js (sin librería extra) para eventos ambientales posicionales (teléfono, impresora, montacargas) y voces. Sonidos de interfaz y balbuceo de voces **sintetizados** con Web Audio (osciladores y envolventes, parámetros por personaje); solo los ambientales reales son archivos `.ogg` CC0 cortos. Un **planificador de audio** con semilla aplica las reglas de `direccion-arte.md` §Audio (sin ruido continuo, máximo un evento ambiental cada 2–4 min, nunca dos a la vez, silencio durante diálogos). El audio arranca tras la primera interacción (política de autoplay). Subtítulos para todo sonido relevante.
**Consecuencias.** (+) Casi sin peso de descarga ni licencias que rastrear; el planificador se prueba sin DOM. (−) Hay que diseñar los sintetizadores a mano; si cuesta demasiado, ZzFX (MIT) con su propio ADR.

## ADR-016 · Diseño visual dentro de Claude Code, no en Claude Design · aceptada

**Contexto.** El usuario preguntó si diseñar en Claude Design o seguir en Claude Code. Claude Design trabaja interfaces 2D (pantallas, componentes, prototipos HTML). Este juego es una escena 3D en una sola pantalla con interfaz diegética.
**Decisión.** Todo el desarrollo visual en Claude Code: escena en R3F, estilos como código, iteración con capturas de Playwright que se envían al usuario para decidir. Skills de apoyo: R3F/three.js, `frontend-design`, `emil-design-eng`. Claude Design queda como opcional para explorar el look de las capas 2D (terminal, libreta, teléfono) si el usuario quiere.
**Consecuencias.** (+) Sin traspasos entre herramientas; lo que se ve en las capturas es el juego real. (−) La exploración visual cuesta código; se mitiga con el spike de 3 estilos sobre la misma escena.

## ADR-017 · `yaml` para leer el contenido en build y pruebas · aceptada

**Contexto.** El contenido se escribe en YAML (ADR-004) y debe convertirse a JSON validado.
**Decisión.** Paquete `yaml` (eemeli/yaml, licencia ISC, sin dependencias, mantenido activamente) como dependencia de desarrollo: solo se usa en `scripts/` y pruebas; el cliente recibe JSON ya validado.
**Consecuencias.** (+) Parser completo y estricto con buenos mensajes de error. (−) Ninguna en tiempo de ejecución.

## ADR-018 · La escena se dibuja a demanda (`frameloop="demand"`) · aceptada

**Contexto.** El escritorio está quieto casi todo el tiempo. Con el estilo C (sombras suaves, reflejos, luz por hora) dibujar a 60 fps gasta GPU y batería sin cambiar nada; en CI con WebGL por software (SwiftShader) daba 2–7 fps a 720p y cada captura tardaba 4–15 s, con pruebas intermitentes.
**Decisión.** El `Canvas` usa `frameloop="demand"`: se dibuja un cuadro cuando cambia algo de React/three (luces por hora, resaltado, texturas: `useTexturaCanvas` llama `invalidate`), al mover el cursor o cambiar la vista (`CamaraSentada` se suscribe al store y a `pointermove`), y mientras la cámara amortiguada o una transición no terminan (piden el siguiente cuadro). El `dt` se acota a 1/30 s para que la primera animación tras un rato quieta no salte.
**Consecuencias.** (+) Sin consumo con la escena quieta (laptops con Iris Xe/UHD 620); capturas en ~100 ms; e2e de 7.9 a 4.4 min. (−) Toda animación nueva por cuadro (teléfono sonando, ambientales) debe pedir sus cuadros con `invalidate` mientras dure; si no, se congela.

## ADR-019 · `pg` (node-postgres) para la base de partidas · aceptada

**Contexto.** F4-11 guarda las partidas en el PostgreSQL de Railway (ADR-010). Hace falta un driver con consultas parametrizadas, pool de conexiones y tiempos límite.
**Decisión.** `pg` 8.x (node-postgres, licencia MIT, el driver de Postgres más usado en Node, mantenido activamente; dependencias propias del mismo proyecto: `pg-pool`, `pg-protocol`, `pg-types`) y `@types/pg` como dependencia de desarrollo. Pool de 5 conexiones, `statement_timeout` de 5 s, conexión en 5 s. Solo consultas con `$1…`; sin SQL dinámico. Las pruebas corren el mismo contrato contra memoria y contra un Postgres real (servicio en CI, `PRUEBAS_PG_URL` en local).
**Consecuencias.** (+) Driver estándar, bien auditado, con tipos. (−) Una dependencia de servidor más (entra en la imagen de producción); se vigila con `npm audit` y Dependabot.

## ADR-020 · Fuentes empaquetadas con Fontsource · aceptada

**Contexto.** D-25: el juego usa JetBrains Mono (terminal) y Atkinson Hyperlegible (interfaz y texturas). Con fuentes del sistema el texto de las texturas cambiaba entre computadoras (en el contenedor de CI salía con una fuente con remates) y la CSP no permite cargar fuentes de otros orígenes.
**Decisión.** Paquetes `@fontsource/jetbrains-mono` y `@fontsource/atkinson-hyperlegible` (licencia de las fuentes SIL OFL 1.1, paquetes mantenidos por el proyecto Fontsource) como dependencias de desarrollo: Vite empaqueta los woff2 en `/assets` (mismo origen, `font-src 'self'`); nunca como `data:` (`assetsInlineLimit` los excluye, la CSP los bloquearía). Solo pesos 400 y 700. Las texturas de canvas se redibujan cuando `document.fonts.load` confirma la carga (`src/ui/fuentes.ts`).
**Consecuencias.** (+) Mismo aspecto en todos los sistemas y en las capturas de referencia; sin peticiones a terceros. (−) ~300 KB más en `dist/client` (fuera del JS inicial); la primera textura puede dibujarse con la fuente de respaldo un instante.
