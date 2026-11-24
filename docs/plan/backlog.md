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

### F0-06 · Despliegue en Railway · `pospuesta` (imagen y guía listas; el usuario creará el servicio más adelante) · depende: F0-04
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

### F1-11 · `npm run play --exec` · `hecha (2026-11-24)` *(también shell interactivo y por stdin sobre el mundo de demostración; `--mision` en F2-06)*

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

### F2-09 · Reglas C12 (finales alcanzables) y C14 (ortografía) · `pendiente` · depende: F2-05
- **Hacer:** C12 cuando exista contenido del Turno 13 (hoy no hay finales que revisar); C14 con `cspell` y diccionario es-MX del proyecto (dependencia nueva con ADR) al empezar a escribir contenido real (F2-08).
- **Listo cuando:** un fixture con un final inalcanzable y otro con una falta de ortografía disparan su regla.

### F2-06 · `npm run play --mision` (interactivo, `--solucion`, `--sesion/--cmd`) · `pendiente` · depende: F2-03, F1-11

### F2-07 · Mundo base de T1 con variables · `hecha (2026-11-24)` *(el post-it de la escena aún muestra una contraseña fija; pasa a `{{contrasena_becario}}` con los post-its en F4)*
- **Hacer:** `content/mundo/variables.yaml` (variables de partida) y `content/mundo/hosts/srv-sistemas.yaml` (usuarios, grupos y archivos al iniciar T1); `MundoEsquema` (Zod) y `crearShellBase(mundo, semilla, sesión)` en el motor; el harness, `npm run play` y la terminal del juego usan ese mundo (se retira `mundoDemo.ts`); `comun.json` lleva el mundo; C10 revisa que `host_inicial` y `usuario_inicial` existan.
- **Listo cuando:** el ejemplo pasa el harness sobre el mundo real; las variables se resuelven con 25 semillas; la terminal del juego muestra el mundo del contenido.
- **Verificar:** `tests/engine/mundo-base.test.ts`, `tests/content/mundo.test.ts`, e2e de la terminal.

### F2-08 · Misiones T1-M1 a T1-M4 + favor T1-F1 · `pendiente` · depende: F2-05, F2-07, F1-06
- **Listo cuando:** harness verde; revisores sin bloqueantes; `playtester-novato` completa T1.

---

## F3 en adelante (resumen)

- **F3** Escena del cubículo (estilo D-08): modelado, cámara, interactivos, transiciones, monitor + terminal real, menú, ajustes, `?test=1`, capturas de referencia.
- **F4** Teléfono · pistas de Eduardo · paciencia · libreta · pizarrón · post-its · calendario · gafete · visitas · audio y subtítulos · API de partidas y código · sincronización · Turno 0 · release v0.1.
- **F5** `sql.js` · generador `mes.db` · `sqlite3` · app Datos · T2–T4 · favores T1–T3.
- **F6** Red · app Red · `wall` · T5 · favores T4–T5 · auditoría de seguridad · **v0.2**.
- **F7** T6–T8 · tiempo extra · logros · repetir misiones.
- **F8** T9–T13 · finales · epílogo · **v0.9**.
- **F9** Pulido · rendimiento en hardware · accesibilidad · vigencia · seguridad final · **v1.0**.
