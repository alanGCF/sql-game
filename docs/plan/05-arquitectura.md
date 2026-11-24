# 05 — Arquitectura

Decisiones y razones: `docs/decisiones/adr.md`. Las versiones exactas viven en `package.json` / `package-lock.json`; al agregar o actualizar una dependencia se consulta su versión estable vigente y su changelog.

## Stack

| Capa | Elección | ADR |
|---|---|---|
| Lenguaje | TypeScript `strict` en cliente, servidor y scripts | 007 |
| Build / dev | Vite | 007 |
| UI (capas DOM) | React | 007 |
| Escena 3D | three.js + @react-three/fiber + @react-three/drei (postprocesado opcional por estilo) | 009 |
| Audio | Web Audio vía `THREE.AudioListener` / `PositionalAudio` | 015 |
| Estado de UI | Zustand; el motor expone un store propio consumido con `useSyncExternalStore` | 007 |
| Shell / VFS / red | Motor propio en TS puro | 001 |
| Terminal | Componente DOM propio sobre el monitor | 002 |
| SQL en el juego | SQLite en WASM (`sql.js`), carga diferida, en un Web Worker | 003 |
| Contenido | YAML → JSON en build, validado con Zod | 004 |
| Aleatorización | RNG con semilla + variables de partida | 011 |
| Servidor | Fastify (Node LTS): sirve el build estático y `/api` | 010 |
| Base de datos del servidor | PostgreSQL (servicio de Railway) | 010 |
| Validación compartida | Esquemas Zod en `shared/` usados por cliente y servidor | 010, 013 |
| Pruebas | Vitest (motor, servidor, contenido) · Playwright (flujos + capturas visuales) · @axe-core/playwright | 007 |
| Lint/format | Biome | 007 |
| Despliegue | Railway (plan Hobby): 1 servicio web (Dockerfile) + 1 PostgreSQL | 010 |

## Estructura del repositorio

```
/
├─ CLAUDE.md · docs/ · .claude/
├─ shared/                       # Zod: formato de partida, API, límites (cliente y servidor)
├─ content/                      # TODO el contenido como datos
│  ├─ curriculo.yaml · personajes.yaml · contactos.yaml · rumores/ · visitas/
│  ├─ mundo/{hosts,fs,db}/       # mundo base + generadores con semilla
│  ├─ misiones/turno-NN/*.yaml   # principales y favores
│  └─ libreta/comandos/*.md      # entradas de la libreta por comando
├─ src/
│  ├─ engine/                    # TS puro: shell, vfs, commands, net, sql, mission, vars, save, clock, rng
│  ├─ scene/                     # R3F: cubículo, objetos, cámara, luces, audio, transiciones
│  ├─ ui/                        # DOM: terminal, apps del monitor, teléfono, libreta, diálogos, menú
│  ├─ game/                      # orquestación: turno, eventos, visitas, paciencia, guardado/sincronización
│  └─ main.tsx
├─ server/
│  ├─ src/{index.ts, app.ts, routes/, store/, security/}
│  └─ migrations/*.sql
├─ public/assets/                # modelos .glb, texturas .ktx2/.webp, audio .ogg (licencias en docs/diseno/assets.md)
├─ scripts/                      # build-content, validate-content, play, size
├─ tests/{engine,server,content,golden,e2e}/
├─ Dockerfile · .dockerignore
└─ .github/workflows/ci.yml
```

## Capas del cliente

```
            ┌──────────── src/ui (DOM) ─────────────┐
            │ terminal · apps · teléfono · libreta   │   ← capas sobre el canvas, se activan al acercarse
            │ diálogos · menú · subtítulos           │
            └──────────────▲─────────────────────────┘
┌── src/scene (R3F) ──┐    │       ┌── src/game ──────────────────┐
│ cubículo, objetos,  │◄───┼──────►│ turno, pendientes, visitas,   │
│ cámara, luz, audio  │    │       │ paciencia, guardado, sync     │
└─────────────────────┘    │       └──────────────▲────────────────┘
                           │                      │ API pública
                    ┌──────┴──────── src/engine (TS puro) ────────────┐
                    │ shell · vfs · net · sql · mission · vars · save │
                    └─────────────────────────────────────────────────┘
```

- La escena 3D nunca importa del motor directamente; habla con `src/game`.
- Una sola ruta, un solo `<Canvas>`; las interfaces de objetos son capas DOM posicionadas sobre el objeto (monitor, teléfono, libreta) o a pantalla completa con el objeto de fondo, según la vista.

## Escena 3D (`src/scene`)

- **Cámara:** `PerspectiveCamera` fija en la posición de los ojos (sentado). Rotación objetivo = función de la posición del cursor normalizada (`yaw = x·65°`, `pitch = y·(−30°…+15°)`), zona muerta 8 %, amortiguación exponencial. Vistas acercadas (`monitor`, `telefono`, `libreta`, `pizarron`, `calendario`) con pose predefinida e interpolación (≈ 600 ms, ease-in-out). `?test=1` desactiva amortiguación y animaciones para capturas deterministas.
- **Objetos interactivos:** componente `Interactivo` (raycast de R3F, resaltado, etiqueta, foco por teclado, acción). Registro central para `Tab`.
- **Modelado:** piezas sencillas (low-poly) hechas con geometrías y `.glb` con licencia libre; texturas pequeñas; luz horneada donde se pueda.
- **Iluminación por hora del juego:** luz de ventana y lámparas interpoladas de 15:30 a 00:00.
- **Oficina de fondo:** pocas siluetas animadas de baja resolución; visitas con un personaje que se acerca al pasillo del cubículo.
- **Estilos visuales:** se resuelven con materiales, paleta y postprocesado (D-08); la estructura de la escena no cambia entre estilos.
- **Sin WebGL2** → pantalla de aviso con requisitos.

## Motor (`src/engine`)

### API pública (borrador)

```ts
export interface Engine {
  newGame(seed: number): void;
  loadMission(id: MissionId, save?: SaveData): Promise<void>;
  resetMission(): void;
  classify(line: string): Classification;        // soportado | inexistente | fuera_de_alcance | avanzado | peligroso | anomalo
  exec(line: string): Promise<ExecResult>;       // solo si classify() = soportado o inexistente
  runSql(sql: string): Promise<SqlResult>;
  answer(objectiveId: string, value: string): AnswerResult;
  complete(partial: string, cursor: number): Completion[];
  hint(objectiveId: string): Hint;               // siguiente nivel
  getState(): EngineState;
  subscribe(listener: (e: EngineEvent) => void): () => void;
  serialize(): SaveData;
}
```

Eventos: `output`, `thought` (globo de pensamiento), `objective-completed`, `mission-completed`, `notebook-entry`, `world-event`, `host-discovered`, `sql-loading`, `sql-ready`.

### Clasificador de entrada (`shell/classify.ts`)

Antes de ejecutar: tokeniza y decide (ver tabla en `04-mecanicas.md` §Fuera de alcance). Usa: superficie de comandos (`content/superficie.yaml`, generada de `03-curriculo.md`), lista de comandos reales de Linux (`content/comandos-linux.txt`, ≈ 400 nombres de coreutils, util-linux, procps, iproute2, etc.), patrones peligrosos y límites de longitud. Lo que no es `soportado` ni `inexistente` nunca llega al ejecutor.

### Shell

Subconjunto de bash: palabras, comillas, escapes; `~`, `$VAR`, `${VAR}`, `$?`, globs contra el VFS; `|`, `>`, `>>`, `<`, `2>`, `2>&1`, `&&`, `||`, `;`. Scripts (T11): shebang, asignación, `if [ … ]`, `for … in`, `exit`. Entorno por sesión, códigos de salida, historial.

```ts
export interface Command {
  name: string;
  run(ctx: CommandContext): Promise<CommandResult> | CommandResult;
  complete?(ctx: CompletionContext): Completion[];
}
export interface CommandResult { stdout: string; stderr: string; code: number; gloss?: string }
```

Cada comando registra lo que **leyó** y lo que **cambió** para los predicados.

### VFS, red y SQL

- **VFS:** árbol en memoria por host, metadatos (dueño, grupo, modo, `mtime` del reloj de juego), permisos reales, capa de diferencias sobre el mundo base.
- **Red:** grafo de hosts, interfaces, rutas, DNS (A/PTR), `/etc/hosts`, servicios por puerto con manejadores HTTP definidos en contenido, firewall, latencias deterministas. `ssh` apila sesiones.
- **SQL:** `sql.js` en un Web Worker, cargado al entrar al T4 (precarga en segundo plano durante T3). La base se **genera** con la semilla al iniciar el turno. `sqlite3 mes.db` y la app Datos comparten conexión. Solo lectura hasta T12.

### Variables de partida (`engine/vars`)

```yaml
# content/mundo/variables.yaml (ejemplo)
lote:          { tipo: entero, min: 4000, max: 4999 }
ip_delta:      { tipo: ip, red: 10.7.3.0/24, min: 20, max: 250 }
hora_acceso:   { tipo: hora, desde: "23:50:00", hasta: "23:58:59" }
puerto_api:    { tipo: elegir, de: [8080, 8081, 8443, 9000] }
n_alarmas_fuga: { tipo: entero, min: 9, max: 23 }
```

- `resolve(seed) → Vars` determinista (PRNG `xoshiro128**` o `mulberry32`, semilla de 32 bits por partida + sub-semillas por generador).
- Plantillas `{{variable}}` en textos, archivos y servicios; generadores de logs y filas reciben `(rng, vars)`.
- `respuesta.esperado_de`: una solución de referencia (comando o SQL) que el motor ejecuta sobre una copia oculta del mundo para calcular la respuesta correcta.

### Runtime de misiones

1. `loadMission`: mundo = mundo base del turno (con variables) + diferencias guardadas + `mundo.parches`.
2. Tras cada `exec`/`runSql`/`answer`: evalúa predicados y disparadores.
3. Eventos (`al_iniciar`, `al_completar`, `al_cumplir:<objetivo>`, `reloj:<HH:MM>`, `comando:<patrón>`): diálogo, llamada entrante, visita, entrada de libreta, post-it, bandera, parche de mundo, `wall`.
4. Al completar: estrellas, XP, logros; checkpoint.

### Esquema de misión

Ejemplo comentado: `docs/ejemplos/mision-ejemplo.yaml`.

| Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| `id` | `tN-mNN-slug` · `tN-fNN-slug` | sí | único |
| `turno`, `orden` | int | sí | orden curricular |
| `tipo` | `ticket \| investigacion \| repaso \| evento \| final \| favor` | sí | |
| `titulo` | ≤ 40 car. | sí | |
| `duracion_estimada_min` | 3–8 | sí | |
| `ensena` | concepto[] (≤ 2) | sí | `[]` en `repaso`, `final`, `favor` |
| `refuerza` | concepto[] (1–3) | solo `favor` | |
| `disponible_desde` | id de misión | solo `favor` | 1–2 misiones después |
| `requiere` | concepto[] | sí | |
| `entrega` | `pizarron \| llamada \| visita \| ticket \| correo` | sí | cómo llega al jugador |
| `host_inicial`, `usuario_inicial`, `cwd_inicial` | string | sí | |
| `apps` | app[] | no | apps del monitor visibles |
| `variables` | mapa | no | variables propias de la misión |
| `mundo.parches` | parche[] | no | archivo, dir, permisos, borrar, host, servicio, sql |
| `briefing` | `{quien, texto ≤ 280}`[] (2–4) | sí | |
| `objetivos` | `{id, pendiente, cuando, pistas[3]}`[] (1–3) | sí | `pendiente` = texto del pizarrón |
| `solucion` | paso[] | sí | comando · `{responder}` · `{sql}` |
| `soluciones_alternativas` | paso[][] (≥ 1) | sí | |
| `contraejemplos` | `{objetivo, pasos}`[] (≥ 1) | sí | |
| `libreta` | entrada[] | no | entradas automáticas al completar |
| `recompensas` | `{xp, logros[], adorno?}` | sí | |
| `eventos` | mapa disparador → efecto[] | no | |

## Servidor (`server/`)

Único servicio de Railway. Responsabilidades: servir el build estático con cabeceras de seguridad y la API de partidas.

| Método y ruta | Qué hace | Límites |
|---|---|---|
| `GET /healthz` | Estado (sin datos internos) | — |
| `POST /api/partidas` | Crea partida: genera código (CSPRNG) y semilla; guarda `sha256(código)` | 10/h por IP |
| `GET /api/partidas/:codigo` | Devuelve la partida si el código existe | 30/min por IP; respuesta uniforme si no existe |
| `PUT /api/partidas/:codigo` | Guarda checkpoint (cuerpo validado con Zod, versión de formato, `revision` para evitar sobrescrituras viejas) | 60/min por IP; ≤ 64 KB |

- **Código:** 12 caracteres del alfabeto Crockford base32 sin `I L O U` (≈ 60 bits), con dígito verificador para detectar errores de tecleo antes de llamar al servidor.
- **Almacenamiento:** tabla `partidas(codigo_hash bytea primary key, datos jsonb, revision int, creada timestamptz, actualizada timestamptz)`. Nunca se guarda el código en claro.
- **Retención:** partidas sin actividad durante 60 días (2 meses) se borran con una tarea programada diaria (D-18). El juego avisa en el menú cuántos días le quedan a una partida inactiva.
- **Sin cookies, sin sesiones, sin CORS** (mismo origen).
- Detalle de controles: `08-seguridad.md`.

## Persistencia y versionado

- Partida con `formato: 1` y migraciones en `shared/save/migrations.ts` (probadas con partidas de ejemplo).
- `content_version` (hash del build de contenido). Si cambió una misión en curso, se reinicia esa misión y se conserva lo demás.

## Carga

- Inicial: app + escena del cubículo + contenido de T0–T1.
- Diferido: `sql.js` (al llegar a T4), contenido de turnos posteriores por chunk, audio no esencial.
- Assets 3D comprimidos (glTF con meshopt o Draco; texturas KTX2/WebP).

## Presupuestos (verificados en CI con `npm run size` y en las pruebas de rendimiento)

| Recurso | Límite |
|---|---|
| JS inicial (gzip) | ≤ 450 KB (three.js incluido) |
| Descarga hasta poder jugar (JS + modelos + texturas + audio esencial) | ≤ 8 MB |
| Total de assets del juego | ≤ 25 MB |
| FPS en GPU integrada (Iris Xe / UHD 620) a 1920×1080 | ≥ 60 sostenidos en el cubículo |
| Draw calls de la escena | ≤ 150 |
| Memoria de GPU | ≤ 256 MB |
| `exec` de un comando simple en el motor | ≤ 16 ms |
| Respuesta de la API (p95) | ≤ 150 ms |

## Navegadores

Chrome/Edge/Firefox/Safari de escritorio, últimas 2 versiones, con WebGL2. Mouse y teclado físico requeridos en v1.

## Herramienta headless `npm run play`

```bash
npm run play -- --mision t1-m02-el-leeme --semilla 42            # interactivo
npm run play -- --mision t1-m02-el-leeme --semilla 42 --solucion # corre la solución
npm run play -- --mision t1-m02-el-leeme --sesion <scratchpad>/s.json --cmd "ls"   # un paso (para agentes)
npm run play -- --exec "ls -la" --fixture tests/golden/ls/ocultos
```

`?pista` pide la siguiente pista; `?responder <objetivo> <valor>` responde. Sin `--cmd` y con stdin que no es TTY, lee una línea por renglón.
