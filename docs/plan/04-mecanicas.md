# 04 — Mecánicas

## Loop principal

```
Mapa de turnos → Briefing (diálogo) → Juego (terminal / datos / red) → Objetivo cumplido → … → Misión completada (concepto aprendido) → siguiente misión
                                          ↑            │
                                          └── Pistas ←─┘  (opcional, 3 niveles)
```

Sesión típica en el teléfono: **una misión de 3–8 minutos**. El juego guarda solo; se puede salir en cualquier momento y continuar exactamente donde quedaste.

## Estructura

- **Turno** (capítulo) = un día laboral 15:30–00:00 en el reloj de juego. 4 misiones aprox.
- **Misión** = 1–3 objetivos, 1–2 conceptos nuevos. Tipos:
  - `ticket` — enseña el concepto en un problema cotidiano.
  - `investigacion` — aplica el concepto al misterio.
  - `repaso` — reutiliza conceptos previos con datos nuevos (sin conceptos nuevos).
  - `evento` — guionizada (algo pasa en el mundo) y luego hay que reaccionar.
  - `final` — decisión y desenlace.
- **Objetivo** = una condición verificable sobre el estado del mundo o una respuesta del jugador.

## Objetivos: validación por resultado

El motor evalúa **predicados** después de cada comando. Ninguno compara el texto exacto del comando.

| Predicado | Se cumple cuando… | Ejemplo |
|---|---|---|
| `respuesta` | el jugador responde una pregunta y la respuesta normalizada está en `acepta` | "¿Qué usuario entra a las 23:58?" → `delta_svc` |
| `archivo_leido` | el contenido de un archivo pasó por stdout de un comando de lectura (`cat`, `less`, `head`, `tail`, `grep` con coincidencia…) | leer `LEEME.txt` |
| `archivo_existe` / `no_existe` | ruta presente/ausente (tipo opcional) | `~/bitacora/` creada |
| `archivo_contiene` | contenido cumple regex o igualdad | `turno1.txt` tiene ≥2 líneas |
| `arbol_igual` | dos rutas tienen los mismos archivos y contenidos | respaldo de `.r/` |
| `permisos` | modo/dueño de una ruta | `chmod 600` a una llave |
| `consulta_resultado` | el último result set del jugador coincide con el de `esperado_sql` (opciones: `orden_importa`, `columnas: por_nombre \| por_posicion`) | inspecciones de hoy de la Línea 2 |
| `estado_db` | una consulta de verificación sobre la base devuelve lo esperado | existe la tabla `evidencia` con 37 filas |
| `host_descubierto` | el jugador obtuvo respuesta de un host (ping, dig, ss, nmap) | `mantto-delta` |
| `proceso` | proceso existe/no existe | `sync_mes` terminado |
| `servicio` / `firewall` | estado de red | `ufw deny from 10.7.3.99` activo |
| `cron` | entrada de cron activa/inactiva | línea de `ajuste.sh` comentada |
| `sesion_en` | el jugador está en un host/usuario/cwd | conectado a `mantto-delta` |
| `flag` | bandera de historia activa | `respaldo_r` |
| `comando_ejecutado` | **solo** para comandos observacionales sin efecto verificable (`pwd`, `whoami`) y siempre preferir `respuesta` | — |

Combinadores: `todos: […]`, `alguno: […]`, `no: …`.

**Por qué `respuesta` es el predicado principal:** obliga a usar la herramienta para encontrar algo, acepta cualquier camino correcto (`grep … | wc -l` o contar a mano con `cat`) y convierte la lección en un hallazgo de la historia. La pregunta se responde en un campo propio (no en la terminal), con normalización: minúsculas, sin acentos, sin espacios extra, sinónimos en `acepta`.

## Pistas

Tres niveles por objetivo, se abren en un panel inferior:

1. **Empujón** — hacia dónde mirar. *"Para ver qué hay dentro de un archivo no basta con listarlo."*
2. **Concepto** — qué herramienta y por qué. *"Hay un comando corto que muestra el contenido de un archivo; su nombre viene de 'concatenate'."*
3. **Solución** — el comando exacto, con botón **"Insertar en la terminal"**.

Reglas: sin castigo de progreso; solo afecta la calificación de la misión. Si el jugador falla 3 veces seguidas el mismo objetivo (errores de sintaxis o comandos sin efecto), aparece un aviso discreto "¿Quieres una pista?".

## Calificación y progresión

- **XP** por misión (base por tipo) + bonos: sin pistas, solución "elegante" (ej. una sola tubería en vez de 4 comandos), primer intento.
- **Calificación de misión:** ★★★ sin pistas · ★★ con pistas nivel 1–2 · ★ con pista nivel 3. Repetible para mejorar.
- **Rangos** (por XP acumulada): Becario → Técnico → Técnico Sr. → Ingeniero → Ingeniero Sr. → Líder de Ingeniería.
- **Logros** ejemplos: "Tubería maestra" (5 comandos encadenados), "Nunca sin respaldo", "ROLLBACK a tiempo", "Leí el manual" (usar `man` 10 veces), "Sin red de seguridad" (turno completo sin pistas).
- **Desbloqueos:** turnos en orden; dentro de un turno, misiones en orden. Las misiones completadas se pueden repetir.

## Aplicaciones dentro del juego

La pantalla de juego tiene "apps" (pestañas) que se desbloquean con la historia:

| App | Desde | Qué es |
|---|---|---|
| **Terminal** | T0 | Shell simulado del host actual. Siempre disponible. |
| **Mensajes** | T0 | Chat con personajes; briefings y eventos llegan aquí. Adjuntos aparecen como archivos en el sistema. |
| **Bitácora** | T0 | Manual personal: cada concepto aprendido con explicación corta, ejemplos tocables (insertan el comando), "Pruébalo en tu Linux real" y la tarjeta de campo del turno. |
| **Datos** | T3 | Cliente SQL visual sobre la misma base que `sqlite3`: editor multilínea, chips de palabras clave y de tablas/columnas, tabla de resultados, vista de esquema. |
| **Red** | T4 | Mapa de la red que se dibuja conforme descubres hosts (desconocido → descubierto → con servicios → asegurado). Tocar un nodo muestra IP, nombre, puertos. |

Datos y Red son **ayudas visuales**, no atajos: lo que muestran lo obtuviste con comandos (el mapa solo agrega nodos que descubriste; la app Datos ejecuta tu SQL, no lo escribe por ti).

## Terminal: comportamiento

- Prompt real: `becario@srv-sistemas:~$` (cambia con `cd`, `ssh`, `sudo -i` no soportado).
- Salida fiel a GNU/Linux en inglés. Debajo de los errores aparece una **glosa** en español, desactivable en Ajustes:
  ```
  becario@srv-sistemas:~$ cat leeme.txt
  cat: leeme.txt: No such file or directory
  ↳ No existe "leeme.txt" aquí. Linux distingue mayúsculas: ¿será LEEME.txt?
  ```
- "Quisiste decir": typo a distancia 1–2 de un comando conocido → glosa con sugerencia (`sl` → `ls`).
- Comandos de Windows → glosa: `dir` → "En Linux se usa `ls`", `cls` → `clear`, `ipconfig` → `ip a`, `type` → `cat`.
- Comando no implementado → `bash: X: command not found` + glosa "Existe en Linux real, pero este servidor no lo tiene".
- Salida larga: se pagina automáticamente; tocar "ver todo" abre el visor.
- Líneas narrativas (mensajes del sistema de juego, `wall`) tienen estilo distinto y no se confunden con salida de comandos.
- **Restaurar misión:** botón en el menú de la misión que regresa el mundo al estado de inicio de la misión (por si el jugador hace `rm -r` de algo importante). Pide confirmación. No borra el progreso de misiones previas.

## Entrada en móvil (requisito crítico)

- `<input>` nativo de una línea (no un canvas) con `autocapitalize="off"`, `autocorrect="off"`, `spellcheck="false"`, `autocomplete="off"`, `enterkeyhint="send"`, `font-size ≥ 16px` (evita zoom en iOS).
- **Barra de accesos** fija encima del teclado: `Tab` · `↑` · `↓` · `|` · `/` · `-` · `~` · `*` · `>` · `"` · `'` · `.` · `Ctrl+C`. Configurable en Ajustes. Los botones no roban el foco del input (no cierran el teclado).
- **Autocompletado visible:** chips de sugerencias sobre la barra (comandos, rutas del directorio actual, banderas aprendidas). Tocar un chip inserta el texto.
- **Historial:** `↑`/`↓` en la barra; además, mantener presionada una línea de salida con un comando la copia al input.
- **Teclado abierto:** con `visualViewport` el layout se reajusta: input + barra pegados al teclado, la salida se encoge y hace auto-scroll a la última línea. Nunca queda el input oculto.
- En SQL (app Datos): editor multilínea, chips de palabras clave (`SELECT`, `FROM`, `WHERE`, `GROUP BY`…), chips de tablas y columnas del esquema actual, botón **Ejecutar** grande.

## Guardado

- Automático tras cada comando que cambie el estado y cada objetivo cumplido.
- Contenido: progreso (misiones, calificaciones, XP, logros, banderas), estado del mundo como **diferencias** respecto al mundo base del turno, historial de comandos de la misión actual, base de datos modificada (si aplica, desde T11).
- Exportar/importar partida como archivo (Ajustes) para cambiar de dispositivo, mientras no haya backend.

## Tarjeta de campo y Modo Taller

- **Tarjeta de campo**: al terminar un turno, resumen imprimible/compartible de los comandos y consultas aprendidos, con ejemplos reales. Vive en la Bitácora.
- **Modo Taller** (desbloqueado al terminar cada turno): terminal libre con ejercicios cortos generados con semilla sobre datos distintos a la historia, para practicar sin presión. Mismo motor de predicados.

## Ajustes

Tamaño de fuente de la terminal (4 pasos), tema (oscuro, claro, alto contraste), reducir movimiento, vibración en eventos, sonido (opcional, apagado por defecto), glosas en español sí/no, personalizar barra de accesos, exportar/importar/reiniciar partida.

## Estados de falla

No hay "game over". Lo peor que pasa:
- Romper el mundo de la misión → **Restaurar misión**.
- En eventos con reloj (23:59 del Turno 10), si no actúas a tiempo, ocurre la consecuencia narrativa y la misión se repite desde el inicio con un diálogo nuevo.
- Final malo en Turno 12 → se puede repetir el turno.
