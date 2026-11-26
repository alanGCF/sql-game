# Backlog

Formato: **Hacer**, **Listo cuando** (criterio observable), **Verificar** (comando o revisión). Estados: `pendiente`, `en-progreso`, `hecha (fecha)`, `bloqueada (motivo)`. `/siguiente-tarea` toma la primera `pendiente` con dependencias `hecha`. Una tarea = un commit `F#-##: …` en `develop`.

F0–F2 detalladas; F3+ se detallan al iniciar la fase.

---

## F0 — Base del proyecto

### F0-01 · Plan y harness inicial · `hecha (2026-11-07)`

### F0-02 · Instalar skills recomendadas · `pendiente` (usuario)
- **Hacer:** instalar el set "Tier 1" de `docs/skills.md` en tu Claude Code local; autorizar Context7 en los conectores de claude.ai.
- **Listo cuando:** `/plugin list` muestra superpowers; Context7 responde.

### F0-03 · Replanteo: escritorio 3D, calendario, compañero de pistas, libreta, código, aleatorización, seguridad, Railway · `hecha (2026-11-24)`
- Docs, ADR, decisiones y harness actualizados a las respuestas del usuario.

### F0-04 · Scaffold del proyecto · `hecha (2026-11-24)`
- **Hacer:** Vite + React + TS strict; three.js + @react-three/fiber + drei; Zustand; Zod; Biome; Vitest; Playwright (versión igual a la preinstalada) con proyectos `desktop-1080` y `desktop-720`; servidor Fastify mínimo (`/healthz`, estáticos, helmet); `shared/`; scripts `dev typecheck lint test validate:content play e2e build size start` (los no implementados imprimen "no implementado: <tarea>" y salen con código 1); estructura de `05-arquitectura.md`.
- **Listo cuando:** `npm run typecheck && npm run lint && npm run test && npm run build` pasan; `npm start` sirve el build y `/healthz`; un e2e de humo abre la página con WebGL.
- **Verificar:** `/verificar`.

### F0-05 · CI · `hecha (2026-11-24)` *(verde confirmado en el primer push)*
- **Hacer:** GitHub Actions según `07-calidad-harness.md` §CI (sin el job `goldens`, que llega en F1-05); `npm audit`; CodeQL; Dependabot.
- **Listo cuando:** el push a `develop` muestra todos los checks en verde.

### F0-06 · Despliegue en Railway · `hecha (2026-11-25)` *(https://rastro-en-el-log.up.railway.app; verificado: /healthz, cabeceras de seguridad, assets con caché inmutable y gzip, 404 uniforme, X-Forwarded-For falsificado ignorado. En los logs de Railway `remoteAddress` es la IP pública real y una IP falsificada en `X-Forwarded-For` no cambia nada: `TRUST_PROXY_HOPS=1` es correcto. Postgres sin proxy TCP público; despliega `main` esperando al CI; imagen base fijada por digest)* · depende: F0-04
- **Hacer:** `Dockerfile` multi-etapa (usuario no root), `.dockerignore`, servidor escuchando en `PORT`; guía en `docs/despliegue.md` (crear proyecto, servicio desde el repo con rama `main`, PostgreSQL, variables, healthcheck `/healthz`, "esperar a CI").
- **Listo cuando:** el usuario despliega `main` y `/healthz` responde 200 en la URL de Railway.
- **Verificar:** usuario + `curl -I` a la URL (cabeceras de seguridad presentes).

### F0-07 · Spike: escena 3D del cubículo + 3 estilos visuales · `hecha (2026-11-24)` *(el usuario eligió el estilo C, D-08)* · depende: F0-04
- **Hacer:** cubículo en graybox (escritorio, monitor, teclado, teléfono, libreta, pizarrón, calendario, post-its, lonchera, taza, adornos, mamparas, algo de oficina al fondo); cámara que sigue al cursor; resaltado al pasar el cursor; acercarse/alejarse del monitor con una terminal DOM de prueba; tres estilos (A/B/C de `direccion-arte.md`) conmutables con `?estilo=`; modo `?test=1`.
- **Listo cuando:** capturas de Playwright de los 3 estilos (vista general, mirando a los lados, monitor acercado) enviadas al usuario.
- **Verificar:** `/revision-visual`; el usuario elige estilo (D-08).

### F0-08 · Endurecimiento tras la auditoría de seguridad (2026-11-24) · `hecha (2026-11-24)` · depende: F0-04
- **Hacer:** respuesta uniforme con cabeceras para URL malformada; los 404 gastan límite; contador aparte para `/assets/`; validar `PORT` y `TRUST_PROXY_HOPS`; log con ruta declarada en vez de URL; dependencias del cliente a desarrollo; imagen `trixie` con código de root; Dependabot para Docker; Actions por SHA; `npm ci --ignore-scripts`; job `imagen` en CI; CodeQL solo con repo público; prueba de IP real documentada en `docs/despliegue.md`.
- **Pendiente fuera de esta tarea:** fijar imágenes por digest y comprobar `TRUST_PROXY_HOPS` en el primer despliegue (F0-06); escaneo de secretos de GitHub (lo activa el usuario si su plan lo permite); IPv6 agrupadas por /64 y no reenviar mensajes de Zod (F4).
- **Verificar:** `tests/server/app.test.ts`; job `imagen` en verde.

### F0-09 · Nombre, licencias y repositorio público · `hecha (2026-11-24)`
- **Hacer:** título "Rastro en el Log" (D-05) en README, `CLAUDE.md`, `index.html`, `package.json` y agentes (la planta de la historia sigue siendo Industrias Ocotillo, Planta 7); `LICENSE` (MIT, código) y `content/LICENSE.md` (CC BY-NC 4.0, contenido y docs) según D-06; CodeQL sube resultados a Security ahora que el repo es público.
- **Pendiente del usuario:** borrar la rama remota `claude/sql-linux-game-planning-e1w7ge` (el proxy de la sesión no permite borrar ramas) y confirmar en Settings que el escaneo de secretos y la protección de push están activos.

---

## F1 — Motor: shell, VFS, clasificador, comandos T1–T3

### F1-01 · VFS · `hecha (2026-11-24)` *(clon profundo para restaurar; la capa de diferencias para guardar pasa a F2-04)*
- **Hacer:** árbol en memoria, rutas absolutas/relativas, `..`, `~`, metadatos, permisos por usuario, capa de diferencias.
- **Listo cuando:** tests de rutas, permisos (r/w/x), diferencias y restauración.

### F1-02 · Reloj de juego, RNG y variables de partida · `hecha (2026-11-24)` *(generadores entero, ip, hora, elegir, clave; plantillas `{{var}}`)*
- **Hacer:** `clock.ts`; PRNG con semilla y sub-semillas; generadores de variables (`entero`, `ip`, `hora`, `elegir`); plantillas `{{var}}`.
- **Listo cuando:** misma semilla → mismas variables; semillas distintas → distribución dentro de rangos (test de 10 000 semillas).

### F1-03 · Lexer y parser · `hecha (2026-11-24)`
- **Hacer:** tokens, comillas, escapes, operadores `| > >> < 2> 2>&1 && || ;` → AST; detección de sintaxis avanzada (`$(`, backticks, heredoc, `&`).
- **Listo cuando:** tabla de ≥ 40 casos, incluidos errores de sintaxis con el mensaje real de bash.

### F1-04 · Clasificador de entrada (globo de pensamiento) · `hecha (2026-11-24)` *(67 casos; crece con cada comando)*
- **Hacer:** `classify()` con superficie, lista de comandos reales de Linux, patrones peligrosos, límites; frases variadas por caso.
- **Listo cuando:** tabla de ≥ 100 entradas clasificadas correctamente.

### F1-05 · Expansión, ejecutor y job de goldens · `hecha (2026-11-24)`
- **Hacer:** `~`, `$VAR`, `$?`, globs; tuberías; redirecciones; códigos de salida; historial. Script `scripts/capture-goldens.sh` + job de CI en `debian:stable`.
- **Listo cuando:** `echo hola > a && cat a | wc -c` produce `5`; el job de goldens corre en CI.

### F1-06 · Comandos T1 · `hecha (2026-11-24)` *(pwd ls cd cat echo man clear history exit; 38 goldens idénticos al sistema real)*
- **Hacer:** `pwd ls cd cat man clear history exit` (+ `echo`) con la superficie; goldens; entradas de libreta.
- **Listo cuando:** goldens verdes; `verificador-fidelidad` sin desviaciones no documentadas.

### F1-07 · Comandos T2 · `hecha (2026-11-24)` *(head tail mkdir touch cp mv rm; 36 goldens; `less` pasa a F3 por ser visor)*
- `echo head tail less mkdir touch cp mv rm` (+ `ls -l -h`).

### F1-08 · Comandos T3 · `hecha (2026-11-24)` *(grep wc sort uniq cut; 53 goldens; grep -r recorre en orden alfabético: desviación documentada)*
- `grep wc sort uniq cut`.

### F1-09 · Glosas, "quisiste decir", Windows y obsoletos · `hecha (2026-11-24)` *(Windows → globo con el equivalente; net-tools → command not found + herramienta moderna; dedazos con transposición)*
- **Listo cuando:** tests de 30 errores típicos de novato con su glosa (incluye `ifconfig`, `netstat`, `dir`, `cls`).

### F1-10 · Autocompletado · `hecha (2026-11-24)` *(comandos y rutas, `~`, ocultos con prefijo `.`, doble Tab lista opciones)*

### F1-12 · Correcciones de fidelidad halladas al verificar la libreta · `hecha (2026-11-24)` · depende: F2-10
- **Hacer:** páginas de `man` en español para todos los comandos del motor (hoy faltan head, tail, mkdir, touch, cp, mv, rm, grep, wc, sort, uniq, cut y exit, y responden "No manual entry"); `cp`/`mv` con destino `carpeta/` inexistente dan el error real ("Not a directory") en vez de crear un archivo; `!N` (expansión del historial) da el globo de pensamiento en vez de "command not found"; `sort -k N,M` se implementa (hoy se trata como `-k N`). Goldens nuevos para cp, mv y sort.
- **Listo cuando:** prueba que `man <cmd>` existe para cada comando; goldens nuevos en verde en el job `debian:stable`.

### F1-11 · `npm run play --exec` · `hecha (2026-11-24)` *(también shell interactivo y por stdin sobre el mundo base; `--mision` en F2-06)*

---

## F2 — Runtime de misiones + harness de contenido + T1 headless

### F2-01 · Esquemas (misión, favor, personajes, contactos, currículo, partida) · `hecha (2026-11-24)` *(misión/favor, `content/curriculo.yaml` con 65 conceptos y la superficie, `content/personajes.yaml` con contactos y paciencia, partida en `shared/`)*
- **Listo cuando:** `docs/ejemplos/mision-ejemplo.yaml` valida; errores legibles con ruta del campo.

### F2-02 · Pipeline de contenido (YAML → JSON por turno) · `hecha (2026-11-24)` *(el cargador del cliente con `import.meta.glob` llega en F2-07 junto con su primer consumidor)*
- **Hacer:** `npm run build:content` (parte de `build` y `dev`): lee `content/misiones/turno-NN/*.yaml`, valida con Zod, revisa ids únicos y que carpeta, `turno`, `orden` e id coincidan, y escribe `.generated/contenido/turno-NN.json` (misiones y favores ordenados) y `comun.json` (personajes). El tiempo extra va en `turno-te`, entre T8 y T9.
- **Listo cuando:** con cualquier error no genera nada y sale con 1; la salida no depende del orden de los archivos.
- **Verificar:** `tests/content/compilar.test.ts`.

### F2-03 · Predicados, `esperado_de`, eventos, pistas, estrellas · `hecha (2026-11-24)` *(runtime `MisionEnCurso`: parches con variables y generadores, eventos al_iniciar/al_cumplir/al_completar, pistas por nivel, estrellas D-09)*

### F2-04 · Guardado local, formato versionado y restaurar misión · `hecha (2026-11-24)` *(diferencias del mundo, guardar/cargar, restaurar; `shared/partida.ts` con esquema estricto, migraciones y límite de 64 KB; la escritura en IndexedDB va con la UI en F4)*

### F2-05 · Harness de contenido C1–C18 con semillas · `hecha (2026-11-24)` *(C1–C11, C13, C15–C18; C12 y C14 pasan a F2-09)*
- **Listo cuando:** un fixture por regla la dispara; el ejemplo pasa con 25 semillas.

### F2-10 · Páginas de libreta de los comandos implementados · `hecha (2026-11-24)` *(revisadas por `verificador-fidelidad`; las fallas del motor que encontró pasan a F1-12)* · depende: F1-06
- **Hacer:** `content/libreta/comandos/<comando>.md` para cada comando simulado (CLAUDE.md §Reglas de código): explicación corta, ejemplo y "En tu Linux real…"; prueba que falla si un comando de `src/engine/commands/` no tiene página.
- **Listo cuando:** la prueba pasa con todos los comandos actuales; `revisor-curricular` sin bloqueantes.

### F2-09 · Reglas C12 (finales alcanzables) y C14 (ortografía) · `pendiente` · depende: F2-05
- **Hacer:** C12 cuando exista contenido del Turno 13 (hoy no hay finales que revisar); C14 con `cspell` y diccionario es-MX del proyecto (dependencia nueva con ADR) al empezar a escribir contenido real (F2-08).
- **Listo cuando:** un fixture con un final inalcanzable y otro con una falta de ortografía disparan su regla.

### F2-06 · `npm run play --mision` (interactivo, `--solucion`, `--sesion/--cmd`) · `hecha (2026-11-24)` · depende: F2-03, F1-11
- **Hacer:** jugar una misión sobre el mundo base sin interfaz: briefing con nombres, pizarrón, comandos, `?pista`, `?responder`, `?pendientes`, efectos (llamadas, visitas, `wall`) y estrellas; `--solucion` corre la solución de referencia; `--sesion/--cmd` da un paso por llamada para agentes. Calendario de turnos en el motor (`inicioTurno`). El guardado de misión conserva los archivos leídos (objetivos de varias lecturas).
- **Verificar:** `tests/content/jugar.test.ts`, `tests/engine/calendario.test.ts`, `tests/engine/runtime.test.ts`.

### F2-07 · Mundo base de T1 con variables · `hecha (2026-11-24)` *(el post-it de la escena aún muestra una contraseña fija; pasa a `{{contrasena_becario}}` con los post-its en F4)*
- **Hacer:** `content/mundo/variables.yaml` (variables de partida) y `content/mundo/hosts/srv-sistemas.yaml` (usuarios, grupos y archivos al iniciar T1); `MundoEsquema` (Zod) y `crearShellBase(mundo, semilla, sesión)` en el motor; el harness, `npm run play` y la terminal del juego usan ese mundo (se retira `mundoDemo.ts`); `comun.json` lleva el mundo; C10 revisa que `host_inicial` y `usuario_inicial` existan.
- **Listo cuando:** el ejemplo pasa el harness sobre el mundo real; las variables se resuelven con 25 semillas; la terminal del juego muestra el mundo del contenido.
- **Verificar:** `tests/engine/mundo-base.test.ts`, `tests/content/mundo.test.ts`, e2e de la terminal.

### F2-08 · Misiones T1-M1 a T1-M4 + favor T1-F1 · `hecha (2026-11-24)` · depende: F2-05, F2-07, F1-06
- **Hecho:** cinco misiones en `content/misiones/turno-01/`, en verde con 25 semillas (aviso C17 en T1-M4, justificado). Revisadas por `revisor-curricular`, `disenador-narrativo` y `playtester-novato`; se aplicaron sus hallazgos. Motor: generadores en el mundo base (`bandeja_t1`), `esperado` con variables, `{{esperado}}` en `acepta_tambien`, `comentarios` para respuestas equivocadas comunes, glosas para errores de novato (`cd..`, una carpeta o un archivo como comando, frases en español) y aviso del prompt en el primer `cd`.
- **Listo cuando:** harness verde; revisores sin bloqueantes; `playtester-novato` completa T1.

---

## F3 — Escena del cubículo con T1 jugable · `cerrada (2026-11-25)` *(revisión visual aprobada por el usuario; en producción con a6b1024)*

Salida de la fase: se puede jugar T1 completo en el navegador desde el escritorio 3D (estilo C); revisión visual aprobada por el usuario. Las pistas por teléfono, la libreta y el código de partida llegan en F4. Las tareas marcadas **(consultar)** llevan decisiones de estética: se proponen 2–3 opciones con capturas antes de cerrarlas.

### F3-01 · Orquestador del turno (`src/game`, sin DOM) · `hecha (2026-11-24)` · depende: F2-02, F2-06, F2-08
- **Hacer:** cargar `turno-NN.json` y `comun.json`; un solo mundo por partida (semilla) que persiste entre misiones; avanzar misiones en orden; favores disponibles según `disponible_desde`; cola de efectos (diálogos, llamadas, visitas, flags) para la interfaz; respuestas por objetivo.
- **Listo cuando:** pruebas unitarias juegan T1 completo con la solución de cada misión, encadenadas sobre el mismo mundo, con 25 semillas.

### F3-02 · Terminal conectada a la misión en curso · `hecha (2026-11-24)` *(responder va por un gancho de prueba hasta la app Tickets, F3-03)* · depende: F3-01
- **Hacer:** la terminal del monitor ejecuta a través de la misión en curso; al cumplirse un objetivo se notifica a la interfaz.
- **Listo cuando:** e2e: en T1-M1, `pwd` + respuesta cumplen el objetivo y avanza a T1-M2.

### F3-03 · App Tickets en el monitor (consultar) · `hecha (2026-11-25)` *(D-21: mesa de ayuda corporativa)* · depende: F3-01
- **Hacer:** lista de tickets de la misión y campo para teclear la respuesta (sin pegar, D-17); retroalimentación de correcto/incorrecto con el `comentario` de la respuesta cuando lo hay. La app **no** lista los archivos de `~/tickets` ni muestra el folio o quién pide el ticket de Karla (T1-M1 y T1-M2 se resuelven con la terminal).
- **Listo cuando:** e2e responde los tickets de T1; capturas aprobadas por el usuario.

### F3-04 · Pizarrón con los pendientes del turno · `hecha (2026-11-24)` *(el brillo de la lámpara en el pizarrón se corrigió en F3-06)* · depende: F3-01
- **Hacer:** textura del pizarrón generada con los pendientes de la misión y del turno; tachado al cumplirse.
- **Listo cuando:** captura del pizarrón antes y después de cumplir un objetivo.

### F3-05 · Diálogos: briefing, llamadas y visitas en globos (consultar) · `hecha (2026-11-25)` *(D-22: llamadas en tarjeta, lo demás en subtítulo con departamento; varios globos por evento y el efecto `pensamiento` pasan a F4)* · depende: F3-01
- **Hacer:** capa DOM de diálogo con nombre del personaje, avance con clic o Enter, accesible por teclado; muestra el briefing y los efectos de la cola. Ampliar el esquema de efectos con varios globos por evento y un efecto `pensamiento` del protagonista (pedido de la revisión narrativa de T1).
- **Listo cuando:** e2e recorre el briefing de T1-M1; capturas aprobadas.

### F3-06 · Escena en estilo C definitiva · `hecha (2026-11-25)` *(solo estilo C, también por omisión en producción; ventana al fondo sobre las mamparas con la planta y la sierra: tarde → atardecer (18:20) → noche con luces; luz de la ventana, reflejos y luz de oficina por hora; reloj de pared con la hora del juego; lámpara como foco hacia el escritorio (sin brillo en el pizarrón); bordes redondeados en objetos pequeños; 111 draw calls. El reloj avanza 15 s por comando y al cerrar cada misión principal; medir en Iris Xe/UHD 620 queda para F9)* · depende: F0-07
- **Hacer:** materiales, luces y formas del estilo C según `direccion-arte.md`; ventana que cambia de tarde a noche con el reloj de juego; se retiran los estilos A y B; presupuesto de 150 draw calls.
- **Listo cuando:** capturas de referencia nuevas sin regresiones de encuadre; presupuesto cumplido.

### F3-07 · Menú sobre la escena (consultar) · `hecha (2026-11-25)` *(D-23: gafete; "Checar entrada" se activa con el código de partida en F4)* · depende: F3-06
- **Hacer:** Nueva partida, Continuar (el código llega en F4), Ajustes, Créditos; sobre la escena desenfocada.
- **Listo cuando:** e2e de nueva partida hasta T1-M1; capturas aprobadas.

### F3-08 · Ajustes básicos · `hecha (2026-11-25)` · depende: F3-07
- **Hacer:** reducir movimiento, tamaño de letra de la terminal, contraste alto; se guardan en el navegador.
- **Listo cuando:** e2e cambia cada ajuste y se conserva al recargar.

### F3-09 · Capturas de referencia (`toHaveScreenshot`) · `hecha (2026-11-25)` *(15 vistas a 1280×720 generadas y comparadas solo en CI, en el contenedor de Playwright fijado por digest; `[capturas]` en el último commit las regenera y un job sin dependencias las sube validadas. Para que las capturas fueran rápidas y estables, la escena se dibuja a demanda (ADR-018). El calendario ya encierra el día del turno (28 de oct en T1) y no trae estrellas de relleno)* · depende: F3-06
- **Hacer:** vistas de `07-calidad-harness.md` §5 con tolerancias; CI las compara.
- **Listo cuando:** CI en verde con las referencias aprobadas.

---

## F4 — Sistemas del escritorio + partidas en el servidor + Turno 0 → v0.1

Salida de la fase: T0–T1 jugables de punta a punta; continuar con el código en otra computadora; playtest ronda 1; release interno v0.1 en Railway. Toda animación por cuadro pide sus cuadros con `invalidate` (ADR-018). Las tareas **(consultar)** llevan decisiones de estética o funcionalidad: se proponen 2–3 opciones con capturas antes de cerrarlas.

### F4-01 · Teléfono: vista con directorio y teclado numérico (consultar) · `en consulta (D-28)` *(capa con pantallita, teclado y directorio desde `personajes.yaml`; marcar con teclas o clic, ocupado y no existe; la llamada en la tarjeta de D-22 con "Colgar"; Esc cuelga; e2e con teclado y con clic. Falta: elegir A, B o C y sus capturas)* · depende: F3-06
- **Hacer:** capa DOM al acercarse al teléfono: pantallita, teclado numérico (clic o teclas), directorio de extensiones de `02-trama.md`; marcar una extensión inicia la llamada; colgar con Esc.
- **Listo cuando:** e2e marca 214 con teclado y con clic; capturas aprobadas.

### F4-02 · Llamadas salientes y paciencia por turno · `pendiente` · depende: F4-01
- **Hacer:** contenido `content/llamadas/` (por contacto: charla, rumores, avisos, "ponte a trabajar", no contesta) con esquema Zod y harness; paciencia por contacto y turno (Gerencia al doble); diálogos en tarjeta de llamada (D-22) con opciones de respuesta.
- **Listo cuando:** pruebas de paciencia (1–2 charla, 3 aviso, 4+ no contesta) y e2e de una llamada con opción de respuesta.

### F4-03 · Pistas de Eduardo por teléfono · `pendiente` · depende: F4-02
- **Hacer:** "Necesito una pista" en la llamada a Eduardo; elige el pendiente si hay varios; empujón → concepto → comando exacto (uno por llamada, `MisionEnCurso.pista`); no gasta paciencia (D-14); se anota en la libreta (Pistas); 3 fallos seguidos del mismo objetivo → pensamiento "Igual y le marco a Eduardo…"; las estrellas lo reflejan.
- **Listo cuando:** e2e pide las tres pistas de T1-M1 y las ve en la libreta; prueba de que no gasta paciencia.

### F4-04 · Llamadas entrantes y buzón · `pendiente` · depende: F4-02
- **Hacer:** efecto `llamada` del motor hace sonar el teléfono (vibra y parpadea, con `invalidate`); contestar con clic o tecla; sin contestar → luz de buzón y mensaje para después. Respeta "reducir movimiento".
- **Listo cuando:** e2e de una llamada entrante contestada y otra perdida que queda en el buzón.

### F4-05 · Libreta: pestañas Historia, Comandos, Pistas y Mis notas (consultar) · `pendiente` · depende: F2-10
- **Hacer:** capa de libreta de espiral con pestañas; entradas automáticas con letra manuscrita (fuente OFL registrada en `assets.md`) y animación de escritura; Comandos desde `content/libreta/comandos/` al aprenderlos; Mis notas tecleadas (sin pegar, 200 × 500 caracteres); texto no seleccionable ni copiable.
- **Listo cuando:** e2e: pegar bloqueado, copiar bloqueado, nota guardada; capturas aprobadas.

### F4-06 · Varios globos por evento y efecto `pensamiento` · `pendiente` · depende: F3-05
- **Hacer:** ampliar el esquema de efectos (pedido de la revisión narrativa de T1) y mostrar el pensamiento en la nube de `direccion-arte.md`.
- **Listo cuando:** harness con los efectos nuevos y e2e del pensamiento disparado por un evento.

### F4-07 · Pizarrón y post-its animados · `pendiente` · depende: F3-04
- **Hacer:** tachado con trazo de plumón al cumplir un pendiente; el post-it del favor se arruga y cae al bote al completarse; post-its informativos por efecto.
- **Listo cuando:** capturas antes/después y animaciones que respetan "reducir movimiento".

### F4-08 · Calendario con estrellas y resumen del día · `pendiente` · depende: F4-12
- **Hacer:** estrellas de cada turno terminado y marca de favores; clic en un día pasado → resumen (misiones, estrellas, hallazgos). Repetir misiones queda para F7.
- **Listo cuando:** e2e con una partida que terminó T0 y T1 muestra sus estrellas y el resumen.

### F4-09 · Visitas por el pasillo con opciones (consultar) · `pendiente` · depende: F4-06
- **Hacer:** un personaje llega por el pasillo de la derecha (silueta sencilla), diálogo en subtítulo con departamento (D-22) y opciones de respuesta; se va al terminar.
- **Listo cuando:** e2e de la visita de Don Chuy en T0; capturas aprobadas.

### F4-10 · Audio escaso y subtítulos (D-19) · `pendiente` · depende: F4-04
- **Hacer:** Web Audio sintetizado para interacción y murmullo de voces; ambientales a lo lejos (uno cada 2–4 min con la semilla, nunca durante diálogos); volúmenes y "modo silencio" en Ajustes; subtítulo para todo audio.
- **Listo cuando:** pruebas del planificador de ambientales (frecuencia, sin simultaneidad) y e2e de subtítulos.

### F4-11 · API de partidas en el servidor (Postgres) · `hecha (2026-11-25)` *(código de 11 símbolos + verificador Luhn mod 32 en `shared/codigo.ts`, en la cabecera `x-codigo-partida` y nunca en la URL; HMAC con `PARTIDAS_PEPPER`; límites por origen con IPv6 por /64, un presupuesto común para leer y guardar y tope de códigos inexistentes por hora; respuesta uniforme; revisión contra sobrescrituras; retención diaria de 60 días por lotes; repositorio en memoria y en Postgres con el mismo contrato, probado contra Postgres real en CI; ADR-019; dos auditorías de `auditor-seguridad` aplicadas. Pendiente del dueño en Railway: `PARTIDAS_PEPPER` y el usuario de permisos mínimos, ver `docs/despliegue.md`)* · depende: F0-08
- **Hacer:** tabla de partidas por código (12 caracteres sin ambiguos, `K7QF-29XM-PL4D`), crear/guardar/cargar con `PartidaEsquema` de `shared/`, consultas parametrizadas, 64 KB máximo, límites de tasa por origen y de códigos inexistentes, migraciones; driver de Postgres justificado en un ADR. Nada de correos ni contraseñas.
- **Listo cuando:** pruebas del servidor (código inválido, tamaño, tasa, versión de formato) y `auditor-seguridad` sin hallazgos altos.

### F4-12 · Guardado local, checkpoints y "Checar entrada" · `hecha (2026-11-25)` *(la partida guarda el mundo como diferencias contra el mundo base, el reloj y el avance de la misión; `Jornada.restaurar` la retoma sin repetir diálogos; IndexedDB tras cada acción (agrupado) y checkpoint al servidor al cerrar misión, favor o turno; sin conexión queda pendiente y se sube al volver (evento `online`); en un conflicto de revisión gana el último checkpoint; el gafete ofrece seguir la partida del navegador o checar entrada con otro número; un favor a medias se reinicia al cargar (shortcut))* · depende: F4-11
- **Hacer:** IndexedDB tras cada comando que cambia el estado; checkpoint al servidor al completar misión, favor o turno; menú "Checar entrada con mi número"; sin conexión sigue local y sincroniza al volver; el mundo se guarda como diferencias (`vfs-diff`).
- **Listo cuando:** e2e: terminar T1-M1, recargar en otro contexto del navegador, checar entrada con el código y seguir en T1-M2.

### F4-13 · Gafete con el código de partida (D-15) · `hecha (2026-11-26)` *(D-27 = A + C: tarjeta de Recursos Humanos con el número grande y "Ya lo anoté" antes de los diálogos; post-it con el número en el monitor; Eduardo lo menciona (línea en código hasta el contenido de T0, F4-14); el gafete del escritorio muestra nombre y número enmascarado (D-26))* · depende: F4-12
- **Hacer:** al empezar el primer día se genera el código, se muestra grande con "anótalo" y queda en el gafete (menú y objeto del escritorio).
- **Listo cuando:** e2e del primer día muestra el código y el gafete del escritorio lo tiene.

### F4-14 · Turno 0: bienvenida y tutorial · `pendiente` · depende: F4-01, F4-05, F4-09, F4-13
- **Hacer:** misiones de T0 según `02-trama.md` (mirar alrededor, post-it, libreta, calendario, marcar a Eduardo, iniciar sesión); decoración del escritorio (globos, letrero con el nombre, concha y taza); visita de Don Chuy; cierre de Eduardo.
- **Listo cuando:** harness con 25 semillas, `revisor-curricular` y `disenador-narrativo` sin pendientes, e2e de T0 completo.

### F4-15 · Oficina viva básica · `pendiente` · depende: F4-10
- **Hacer:** alguien pasa a lo lejos de vez en cuando (con la semilla), con `invalidate` solo mientras camina; nada durante diálogos.
- **Listo cuando:** captura con la persona caminando y prueba de que la escena quieta no pide cuadros.

### F4-16 · Playtest ronda 1 y release v0.1 · `pendiente` · depende: F4-14
- **Hacer:** `playtester-novato` en T0–T1, playtest con personas, correcciones; revisión de seguridad y visual; `develop` → `main` con aprobación del usuario.
- **Listo cuando:** T0–T1 de punta a punta en producción y continuar con código en otra computadora.

## F5 en adelante (resumen)

- **F5** `sql.js` · generador `mes.db` · `sqlite3` · app Datos · T2–T4 · favores T1–T3.
- **F6** Red · app Red · `wall` · T5 · favores T4–T5 · auditoría de seguridad · **v0.2**.
- **F7** T6–T8 · tiempo extra · logros · repetir misiones.
- **F8** T9–T13 · finales · epílogo · **v0.9**.
- **F9** Pulido · rendimiento en hardware · accesibilidad · vigencia · seguridad final · **v1.0**.
