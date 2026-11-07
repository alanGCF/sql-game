# 05 — Arquitectura

Decisiones y sus razones: `docs/decisiones/adr.md`. Versiones exactas de dependencias: se fijan en F0-04 con la última estable de ese momento (consultar Context7/npm), no aquí.

## Stack

| Capa | Elección | ADR |
|---|---|---|
| Lenguaje | TypeScript `strict` | 007 |
| Build / dev server | Vite | 007 |
| UI | React | 007 |
| Estado UI | Zustand (estado de UI) + suscripción al store del motor con `useSyncExternalStore` | 007 |
| Estilos | CSS Modules + CSS custom properties (tokens de Claude Design) | 007 |
| Shell / VFS / red | Motor propio en TS puro | 001, 002 |
| SQL | SQLite en WASM vía `sql.js`, carga diferida | 003 |
| Contenido | YAML → JSON en build, validado con Zod | 004 |
| Pruebas | Vitest (motor + contenido), Playwright (E2E móvil) + `@axe-core/playwright` | 007 |
| Lint/format | Biome | 007 |
| PWA | `vite-plugin-pwa` (Workbox) | 007 |
| Persistencia | IndexedDB (`idb-keyval`) con respaldo en `localStorage` | 007 |
| Hosting | GitHub Pages (estático), deploy por GitHub Actions | 007 |
| Backend | Ninguno en v1 (D-07: Django en v2 para sync/modo salón) | 007 |

## Estructura del repositorio

```
/
├─ CLAUDE.md                     # constitución para agentes
├─ docs/                         # plan, ADR, brief de diseño
├─ .claude/                      # harness: settings, hooks, agentes, skills
├─ content/                      # TODO el contenido del juego, como datos
│  ├─ curriculo.yaml             # grafo de conceptos (migrado de 03-curriculo.md)
│  ├─ personajes.yaml
│  ├─ mundo/
│  │  ├─ hosts/<host>.yaml       # interfaces, servicios, usuarios, fs base
│  │  ├─ fs/<host>/…             # archivos base (texto plano)
│  │  └─ db/mes.seed.ts          # generador determinista de mes.db (semilla fija)
│  ├─ misiones/turno-00/t0-m01-primer-login.yaml …
│  └─ man/<comando>.md           # páginas man en español
├─ src/
│  ├─ engine/                    # TS puro: sin DOM, sin React
│  │  ├─ shell/                  # lexer, parser, expansión, ejecutor
│  │  ├─ vfs/                    # sistema de archivos en memoria
│  │  ├─ commands/               # un archivo por comando
│  │  ├─ net/                    # modelo de red simulado
│  │  ├─ sql/                    # adaptador sql.js (carga diferida)
│  │  ├─ mission/                # runtime de misiones, predicados, eventos
│  │  ├─ save/                   # serialización y migraciones
│  │  ├─ clock.ts, rng.ts        # reloj de juego y RNG con semilla
│  │  └─ index.ts                # API pública del motor
│  ├─ ui/                        # React (implementa el diseño de Claude Design)
│  │  ├─ tokens.css
│  │  ├─ screens/  components/  hooks/
│  └─ main.tsx
├─ scripts/
│  ├─ build-content.ts           # YAML → JSON validado
│  ├─ validate-content.ts        # harness de contenido (CLI)
│  └─ play.ts                    # jugar headless desde la terminal (para agentes y playtests)
└─ tests/
   ├─ engine/                    # unitarias
   ├─ golden/<comando>/          # salidas capturadas de Linux real
   ├─ content/                   # harness de contenido como suite de Vitest
   └─ e2e/                       # Playwright móvil
```

## Motor (`src/engine`)

### API pública (borrador)

```ts
export interface Engine {
  // ciclo de vida
  loadMission(id: MissionId, save?: SaveData): Promise<void>;
  resetMission(): void;
  // entrada del jugador
  exec(line: string): Promise<ExecResult>;          // terminal
  runSql(sql: string): Promise<SqlResult>;          // app Datos (misma DB que sqlite3)
  answer(objectiveId: string, value: string): AnswerResult;
  complete(partial: string, cursor: number): Completion[]; // autocompletado
  // lectura de estado para la UI
  getState(): EngineState;                          // inmutable
  subscribe(listener: (e: EngineEvent) => void): () => void;
  serialize(): SaveData;
}

export type EngineEvent =
  | { type: 'output'; lines: OutputLine[] }
  | { type: 'objective-completed'; id: string }
  | { type: 'mission-completed'; summary: MissionSummary }
  | { type: 'message'; from: CharacterId; text: string; attachments?: string[] }
  | { type: 'world-event'; id: string }              // ej. wall, borrado de .r/
  | { type: 'host-discovered'; host: string }
  | { type: 'sql-loading' | 'sql-ready' };

export interface OutputLine {
  kind: 'prompt' | 'stdout' | 'stderr' | 'gloss' | 'system' | 'story';
  text: string;
}
```

### Shell

Subconjunto de bash suficiente para el currículo, implementado como lexer → parser (AST) → expansión → ejecución:

- Palabras, comillas simples/dobles, escapes `\`.
- Expansiones: `~`, `$VAR`, `${VAR}`, `$?`, globs `*` `?` (contra el VFS). `$(…)` queda fuera de v1 salvo que T10 lo requiera.
- Operadores: `|`, `>`, `>>`, `<`, `2>`, `2>&1`, `&&`, `||`, `;`.
- Scripts (T10): `#!/bin/bash`, asignación, `if [ … ]; then … fi`, `for x in …; do … done`, `exit N`. Sin funciones en v1.
- Entorno por sesión (`HOME`, `USER`, `PWD`, `OLDPWD`, `PATH`, `HOSTNAME`), código de salida, historial.

```ts
export interface Command {
  name: string;
  run(ctx: CommandContext): Promise<CommandResult> | CommandResult;
  complete?(ctx: CompletionContext): Completion[];
}
export interface CommandContext {
  argv: string[]; stdin: string; env: Env;
  host: HostRuntime;        // fs, procesos, usuarios del host actual
  net: NetworkRuntime;      // para ping, ssh, curl…
  sql: SqlService;          // para sqlite3
  session: SessionRuntime;  // usuario, cwd, pila de ssh, sudo
  clock: GameClock;
  emit(e: EngineEvent): void;   // eventos de dominio (ej. host-discovered)
}
export interface CommandResult { stdout: string; stderr: string; code: number; gloss?: string }
```

Cada comando registra lo que **leyó** (rutas) y lo que **cambió**, para que los predicados (`archivo_leido`, etc.) no dependan de parsear la línea.

### VFS

- Árbol en memoria por host: nodos `file | dir | symlink | special` (special = base SQLite, dispositivos).
- Metadatos: dueño, grupo, modo, `mtime` (reloj de juego), tamaño.
- Permisos aplicados de verdad (lectura/escritura/ejecución) según usuario de la sesión, `sudo` incluido.
- Capa de **diferencias** sobre el mundo base para guardar y restaurar barato.

### Red simulada

- Grafo: hosts con interfaces (IP/CIDR), segmentos, rutas y puertas de enlace, DNS (registros A/PTR), `/etc/hosts` por host, servicios por puerto (TCP/UDP, banner, manejador HTTP opcional), reglas de firewall, latencias deterministas.
- `ping`/`traceroute` recorren el grafo; `ss` lista sockets simulados del host; `ssh` empuja una sesión nueva a la pila (`exit` regresa); `curl` invoca el manejador HTTP del servicio (respuestas definidas en contenido).
- Eventos `host-discovered` alimentan la app Red.

### SQL

- `sql.js` se carga **solo** al entrar a la primera misión que lo necesita (T3) y queda en caché del service worker. Mientras carga se emite `sql-loading` (la UI muestra estado).
- `mes.db` se genera en build con un script determinista y se distribuye como binario; cada misión puede aplicar `parches_sql` (sentencias) al cargar.
- `sqlite3 mes.db` cambia la terminal a modo `sqlite>`; la app Datos usa la misma conexión, así que lo que haces en una se ve en la otra.
- Predicado `consulta_resultado`: el motor guarda el último result set del jugador y lo compara con el de `esperado_sql` ejecutado sobre el mismo estado.
- Antes de T11 la base se abre en modo solo lectura para el jugador (los `UPDATE` fallan con el error real `attempt to write a readonly database` + glosa).

### Runtime de misiones

1. `loadMission`: arma el mundo = mundo base del turno + diferencias guardadas + `mundo.parches` de la misión.
2. Después de cada `exec`/`runSql`/`answer`: evalúa predicados de objetivos pendientes y disparadores de eventos.
3. Eventos (`al_iniciar`, `al_completar`, `al_cumplir:<objetivo>`, `reloj:<HH:MM>`, `comando:<patrón>`) aplican efectos: mensaje, flag, parche de mundo, `wall`, desbloqueo de app.
4. Al completar: calcula calificación, XP, logros; emite `mission-completed`.

### Esquema de misión

Ejemplo completo y comentado: `docs/ejemplos/mision-ejemplo.yaml`. Campos:

| Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| `id` | string `tN-mNN-slug` | sí | único |
| `turno`, `orden` | int | sí | define el orden curricular |
| `tipo` | `ticket \| investigacion \| repaso \| evento \| final` | sí | |
| `titulo` | string ≤ 40 car. | sí | |
| `duracion_estimada_min` | int 3–8 | sí | |
| `ensena` | concepto[] (≤ 2) | sí | vacío solo en `repaso`/`final` |
| `requiere` | concepto[] | sí | deben estar enseñados antes |
| `host_inicial`, `usuario_inicial`, `cwd_inicial` | string | sí | |
| `apps` | app[] | no | apps visibles |
| `mundo.parches` | parche[] | no | archivo, dir, permisos, borrar, host, servicio, sql |
| `briefing` | `{quien, texto ≤ 280}`[] (2–4) | sí | |
| `objetivos` | `{id, descripcion, cuando: predicado, pistas: [3]}`[] (1–3) | sí | |
| `solucion` | paso[] | sí | paso = comando (string) \| `{responder}` \| `{sql}` |
| `soluciones_alternativas` | paso[][] (≥ 1) | sí | |
| `contraejemplos` | `{objetivo, pasos: paso[]}`[] (≥ 1) | sí | no deben cumplir el objetivo indicado |
| `recompensas` | `{xp, bitacora[], logros[]}` | sí | |
| `eventos` | mapa disparador → efecto[] | no | |
| `finales` | solo en `tipo: final` | no | condición → id de final |

## Persistencia y versionado

- Clave `save:v1` en IndexedDB. Esquema con número de versión y migraciones (`save/migrations.ts`), probadas con partidas de ejemplo.
- Contenido versionado por `content_version` (hash del build). Si una misión cambia, la partida en curso reinicia esa misión pero conserva el progreso previo.

## PWA y carga

- Precarga: app shell + contenido de Turnos 0–2.
- Diferido: `sql.js` (WASM) al llegar a T3; contenido de turnos posteriores por chunk.
- Aviso de "actualización disponible" cuando hay nueva versión del service worker.

## Presupuestos (se verifican en CI con `npm run size` desde F0-05)

| Recurso | Límite |
|---|---|
| JS inicial (gzip) sin sql.js | ≤ 150 KB |
| CSS inicial (gzip) | ≤ 25 KB |
| Fuentes | ≤ 2 familias, `woff2`, subconjunto latino, ≤ 120 KB total |
| `sql.js` WASM + glue | carga diferida; medir y registrar (≈ 1 MB) |
| LCP en Android gama media 4G (Lighthouse móvil) | ≤ 2.5 s |
| Respuesta a `exec` de un comando simple | ≤ 16 ms en el motor (medido en Vitest bench) |
| Memoria del mundo por turno | ≤ 10 MB |

## Seguridad

- CSP estricta (sin `unsafe-eval`; WASM con `wasm-unsafe-eval` solo si `sql.js` lo requiere).
- La entrada del jugador nunca se evalúa como JS; el SQL corre dentro de SQLite WASM en memoria.
- Sin cookies, sin analítica de terceros en v1.

## i18n

- Todo texto de UI en `src/ui/i18n/es-MX.json`; contenido ya está separado en `content/`. Salidas de comandos en inglés por diseño (ADR-006).

## Navegadores soportados

Chrome/Edge Android y escritorio (últimas 2), Safari iOS 16+, Firefox (últimas 2). Sin IE ni navegadores sin WASM.

## Herramienta headless `npm run play`

Necesaria para agentes y para depurar contenido sin UI:

```bash
npm run play -- --mision t0-m02-el-leeme            # interactivo en tu terminal
npm run play -- --mision t0-m02-el-leeme --solucion # corre la solución y reporta objetivos
npm run play -- --exec "ls -la" --fixture tests/golden/ls/ocultos   # un comando sobre un fixture
# modo por pasos (para agentes, que no pueden usar un TTY interactivo):
npm run play -- --mision t0-m02-el-leeme --sesion <scratchpad>/s.json --cmd "ls"      # ejecuta 1 línea y guarda estado
npm run play -- --mision t0-m02-el-leeme --sesion <scratchpad>/s.json --cmd "?pista"  # pide pista del objetivo actual
npm run play -- --mision t0-m02-el-leeme --sesion <scratchpad>/s.json --cmd "?responder responder-ticket R"
```

Sin `--cmd` y con stdin que no es TTY, lee una línea por renglón (`printf 'ls\ncat LEEME.txt\n' | npm run play -- --mision …`).
