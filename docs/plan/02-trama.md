# 02 — Trama

> v0.2. Ambientación aprobada (D-01). Todo es ficticio: ninguna empresa, persona, IP o dominio corresponde a algo real. Los datos marcados como `{{variable}}` cambian con la semilla de cada partida (ver `04-mecanicas.md` §Aleatorización); la historia no cambia.

## Premisa

**Industrias Ocotillo, Planta 7**, en **Ciudad Médanos** (ciudad ficticia de la frontera norte), fabrica calipers de freno para un cliente automotriz. Entras como **técnico de sistemas del turno vespertino** (15:30–00:00). Tu antecesora, la **Ing. Rebeca Salcido**, renunció de un día para otro. Lo único que dejó fue un `LEEME.txt` con una frase: *"no confíes en los números del turno nocturno"*.

Cada noche, a las **23:59**, un script instalado por un contratista de mantenimiento remoto cambia en la base de datos de producción los resultados de la prueba de fuga del **lote `{{lote}}`** de FALLA a PASA, para que el lote salga en el **embarque del sábado 14 de noviembre**. Las piezas defectuosas podrían terminar en autos reales.

Tu trabajo diario son tickets normales de sistemas. Tu investigación es reconstruir qué pasó usando esas mismas herramientas, desde tu cubículo.

## Tono

- Misterio corporativo de bajo perfil con humor de planta. Nada de "hackers con capucha".
- La oficina se siente viva: voceo, chismes, gente que pasa, la luz que cambia de tarde a noche.
- La tensión sube con el calendario: cada turno estás más cerca del viernes 13 y del embarque.
- Consecuencias de seguridad industrial, no violencia. Español de México; el humor norteño viene de Don Chuy y de Eduardo, sin caricatura.

## Calendario

La planta trabaja **de lunes a viernes**. Todos los días son de 2026.

| Fecha | Día | Turno | Qué pasa |
|---|---|---|---|
| Lun 26 oct | — | (no jugable) | Inducción general a la planta. Se menciona en el Turno 0. |
| **Mar 27 oct** | Bienvenida | **T0** | Tu escritorio está decorado. Eduardo se presenta y te enseña a jugar. Sin conceptos técnicos. |
| Mié 28 oct | 1er turno | **T1** | Inducción a Linux. |
| Jue 29 oct | | **T2** | |
| Vie 30 oct | | **T3** | Víspera de Halloween (D-20): calabaza y telarañas de papel en tu escritorio; comentarios de los compañeros. |
| Sáb 31 – Dom 1 | fin de semana | — | |
| Lun 2 nov | | **T4** | Día de Muertos (D-20): papel picado y cempasúchil en tu escritorio, pan de muerto en la lonchera; comentarios de los compañeros. |
| Mar 3 nov | | **T5** | Cierre del MVP (`wall` de Delta). |
| Mié 4 – Vie 6 nov | | **T6–T8** | |
| **Sáb 7 nov** | tiempo extra | **TE** (opcional) | 3–4 favores de repaso. No afecta la historia. |
| Dom 8 nov | — | — | |
| Lun 9 – Jue 12 nov | | **T9–T12** | |
| **Vie 13 nov** | último turno | **T13** | Tu jugada final. |
| Sáb 14 nov 06:00 | — | — | Sale (o no) el embarque del lote `{{lote}}`. |
| **Lun 16 nov** | epílogo | **Final** | Llegas solo a ver qué pasó: si te despiden, si se detuvo el embarque o si lograste el mejor final. Es el descanso obligatorio por el Día de la Revolución (tercer lunes de noviembre): la planta está casi vacía y te citaron de todos modos (D-20). |

### Fechas especiales (D-20)

Ambientación pura: **no cambian la historia** ni los objetivos.

| Fecha | En el calendario | En el escritorio | Comentarios de los compañeros (ejemplos) |
|---|---|---|---|
| Mar 27 oct (T0) | "Bienvenida" | Globos, letrero, concha y taza nueva | Eduardo y Don Chuy te dan la bienvenida |
| Sáb 31 oct | "Halloween" (fin de semana) | — (se ve el viernes 30) | Viernes 30: "¿Vas a disfrazarte el sábado o ya con el gafete das miedo?" |
| Lun 2 nov (T4) | "Día de Muertos" | Papel picado, cempasúchil, pan de muerto en la lonchera | Comedor: "Hoy hay pan de muerto, pero ni le digas a Treviño." |
| Sáb 7 nov (TE) | "Tiempo extra" | Oficina medio vacía, radio prendido | Eduardo: "¿Viniste en sábado? Te ganaste un café." |
| Lun 16 nov (final) | "Día de la Revolución" | — | "¿A ti también te citaron en día festivo?" |

Cada comentario es corto (≤ 280 caracteres), llega por visita o llamada y no gasta paciencia del contacto.

## Estructura narrativa

- **Turno** = un día laboral. 4 misiones principales aprox. + 1 favor.
- **Ticket** (aprendes el concepto en un problema cotidiano) → **Investigación** (lo aplicas al misterio).
- **Favores** (misiones secundarias tipo *good first issue*): un compañero te pide algo pequeño que se resuelve con lo que aprendiste 1–2 misiones antes. Sirven para repasar. No mueven la historia principal. Llegan como post-it en el pizarrón, llamada o visita.
- **Tiempo extra** (sábado 7): turno opcional con 3–4 favores de repaso de T1–T8.

## Personajes

| Personaje | Rol | Usuario de sistema | Ext. | Voz | Función |
|---|---|---|---|---|---|
| **Jugador** | Técnico de sistemas, turno vespertino | `becario` | 210 | — (nombre elegido) | Protagonista; sus pensamientos aparecen como globo de pensamiento |
| **Eduardo Téllez** *(D-13)* | Sistemas Sr., de tu mismo departamento, 4 años en la planta | `etellez` | 214 | Voz cálida y sarcástica, siempre con prisa ("ando en piso, márcame") | **Te da las pistas por teléfono.** Se presenta en T0 y te enseña a jugar. Fuente de rumores. |
| **Jesús "Don Chuy" Ortega** | Supervisor de mantenimiento, 30 años en la planta | — | 301 | Coloquial, norteño, refranes, desconfía de "las máquinas" | Conecta lo físico con los datos ("la estación de fuga pita a las 11:59 y nadie la toca") |
| **Ing. Rebeca Salcido ("R.")** | Ex ingeniera de sistemas y automatización | `rsalcido` | — | Precisa, escueta, irónica | Tutora indirecta vía notas escondidas; reaparece en T10 (D-12) |
| **Ing. Karla Ibáñez** | Jefa de Calidad del turno | `kibanez` | 402 | Directa, presionada | Pide tickets; sus credenciales fueron usadas → sospechosa falsa; aliada desde T9 |
| **Lic. Mauricio Treviño** | Gerente de planta | `mtrevino` | 100 | Corporativo, amable en exceso | Antagonista: ordenó "que pasen los lotes" |
| **Óscar Delgado** | Contratista de "Soluciones Delta" (ficticia), mantenimiento remoto por VPN | `delta_svc` | — | Seco, amenazante por `wall` | Ejecutor técnico del script; nunca se le ve |
| **Conmutador (Recepción)** | Operadora | — | 0 | Amable, voceo | Directorio, voceo, avisos |
| **Comedor** | Encargada del comedor | — | 150 | Mamá de todos | Menú del día, chismes, algún favor |
| **Caseta de vigilancia** | Guardia del turno | — | 900 | Somnoliento | Rumores de quién entra de noche (nunca da respuestas, solo dirección) |
| **Calidad Corporativa** | Corporativo | — | (correo) | Formal | Destinataria del reporte final |

### Teléfono: paciencia de los contactos

Cada contacto tiene **paciencia por turno**: llamadas 1–2 → contenido (charla, rumor, aviso); llamada 3 → "¿No tienes trabajo? Ponte a trabajar"; llamada 4 en adelante → no contesta (timbra o buzón). Se reinicia cada turno. Llamar a gerencia sin motivo gasta paciencia más rápido (su paciencia es 1: la segunda llamada ya es "ponte a trabajar"). Las **llamadas a Eduardo para pedir pista no gastan paciencia** *(D-14)*; platicar sí.

### Rumores

Cada contacto y cada visita tiene una bolsa de rumores por turno (sin repetirse). Son ambientación, foreshadowing o pistas falsas; **nunca dan la respuesta** de un objetivo: toda acusación requiere evidencia obtenida con una herramienta. Ejemplos:
- Don Chuy (T3): "Desde agosto el turno nocturno no reporta ni una pieza de scrap. Ni cuando yo era joven éramos tan buenos."
- Comedor (T4): "El licenciado Treviño ya ni baja a comer. Dicen que le traen la comida a la oficina desde que vino el del corporativo."
- Eduardo (T6): "A Rebeca la sacaron después de una junta con Treviño. Ella decía que la de Calidad le estaba escondiendo algo... yo no sé."
- Vigilancia (T7): "Un carro sin calcomanía se para afuera a las doce menos cuarto. Nomás se queda ahí y se va."

### Visitas al cubículo

Alguien se acerca por el pasillo (sonido de pasos, globo de diálogo, puedes girar la cámara para verlo). Tipos: **guionizadas** (Karla trae un ticket que inicia una misión; Treviño "pasa a saludar" después de algo que hiciste), **favores** (alguien te pide algo pequeño) y **ambientales** (Don Chuy con café a las 18:00; alguien preguntando si has visto su engrapadora).

## Turno 0 — Bienvenida (martes 27 de octubre)

Objetivo: aprender los controles del juego dentro de la historia. Sin conceptos de Linux.

1. Apareces sentado. Tu escritorio está decorado: globos, un letrero "¡Bienvenid@, {{nombre}}!", una concha de pan y una taza con el logo de la planta.
2. **Eduardo se acerca a presentarse.** Diálogo con respuesta del jugador:
   - Eduardo: "¡Tú debes ser quien entra a sistemas! Soy Eduardo. Vamos a estar en el mismo departamento."
   - Eduardo: "¿Ya te dieron el recorrido o te aventaron directo aquí?"
   - **Jugador (elige):** "El lunes fue mi inducción a la planta." / "El lunes me dieron la inducción, pero no me acuerdo de nada." *(ambas dicen lo mismo con distinto tono)*
   - Eduardo: "Uy, la de seguridad industrial. A todos nos dormían. Bueno, aquí lo que importa es esto…"
3. Eduardo te enseña, uno por uno, con un pendiente en el pizarrón para cada cosa: mirar alrededor con el mouse → leer el post-it del monitor (tu contraseña) → abrir la libreta → revisar el calendario → marcarle desde el teléfono (ext. 214: "así me pides ayuda cuando me necesites; casi siempre ando en piso") → acercarte a la computadora, iniciar sesión tecleando la contraseña y alejarte.
4. **Don Chuy pasa a saludar** de camino al taller: "¡Qué tal, joven! Aquí la planta habla; nomás hay que saberla oír." (Así ya lo conoces cuando aparece en el T1.)
5. Ves tu **gafete** con tu número de empleado = tu código de partida *(D-15)*.
6. Cierre: Eduardo: "Mañana empieza lo bueno. Ah, y no le hagas caso a lo que dicen de la ingeniera Salcido."

## Línea por turno

| Turno | Fecha | Título | Dominio | Herramienta → avance de la trama |
|---|---|---|---|---|
| **1** | Mié 28 oct | Primer turno | Linux 0 | `pwd`, `ls`, `cd`, `cat`, `man` → lees el `LEEME.txt` de R.; el manual te enseña `ls -a` y aparece la carpeta oculta `.r/`. |
| **2** | Jue 29 oct | Lo que dejó R. | Linux 1 | `ls -la`, `head`/`tail`/`less`, `mkdir`, `cp`, `mv`, comodines, `>`/`>>` → lees las notas de R. y **respaldas `.r/`** ("hazte una copia antes de que la borren"). |
| **3** | Vie 30 oct | Los registros no mienten | Linux 2 | `grep`, `\|`, `wc`, `sort`, `uniq`, `cut` → en `auth.log` aparece `delta_svc` entrando cada noche a las `{{hora_acceso}}`. **Evento:** `.r/` original desaparece; tu respaldo es lo único que queda. `grep -r` encuentra el lote `{{lote}}` y `mes.db`. |
| **4** | Lun 2 nov | El MES | SQL 1 | `sqlite3`, `SELECT`, `WHERE`, `AND/OR`, `ORDER BY`, `LIMIT` → todas las inspecciones de fuga del lote `{{lote}}` dicen PASA, pero el log del T3 registró alarmas a esas horas. Las últimas modificaciones las firma `kibanez`. |
| **5** | Mar 3 nov | ¿Quién está en mi red? | Redes 1 | `ip a`, subred, `ping`, `/etc/hosts`, `host`/`dig`, `traceroute` → arreglas la impresora (cable flojo: Don Chuy lo reconecta) y descubres `mantto-delta` (`{{ip_delta}}`), que no está en el inventario y entra por la VPN de proveedores. **Cierre del MVP:** `Broadcast message from delta_svc@mantto-delta: ¿Quién eres, becario?` |
| **6** | Mié 4 nov | Cuadrar números | SQL 2 | `DISTINCT`, `LIKE`/`IN`/`BETWEEN`, `NULL`, agregaciones, `GROUP BY`, `HAVING` → el scrap del turno nocturno es 0 desde el 14 de agosto (alta de `delta_svc`); `kibanez` "inspecciona" `{{insp_por_hora}}` piezas por hora a las 23:59, imposible. |
| **7** | Jue 5 nov | Permisos y procesos | Linux 3 | `whoami`/`id`, `rwx`, `chmod`, `sudo`, `ps`, `kill`, `find` → `find` muestra archivos de `delta_svc` tocados anoche; un proceso `sync_mes` corre como `delta_svc`; `Permission denied` → Treviño te da `sudo` "para lo de la impresora" (ironía). |
| **8** | Vie 6 nov | Puertos y servicios | Redes 2 | puertos, TCP/UDP, `ss`, `nmap` (red propia, autorizado por ticket), `curl` → `ss` muestra conexiones a `{{ip_delta}}:{{puerto_api}}`; `curl` a `/api/ajustes` devuelve el JSON con los "ajustes" del lote. |
| **TE** | Sáb 7 nov | Tiempo extra | Repaso | 3–4 favores con conceptos de T1–T8. Oficina medio vacía, radio prendido. Opcional. |
| **9** | Lun 9 nov | Cruce de datos | SQL 3 | `INNER/LEFT JOIN`, alias, subconsultas → al cruzar `inspecciones` con `accesos`, Karla no estaba en la planta cuando "firmó"; al cruzar con `sensores_raw`, los valores originales eran FALLA. Karla se vuelve aliada. |
| **10** | Mar 10 nov | Llaves y túneles | Redes 3 + Linux | `ssh`, llaves, `known_hosts`, `scp`, `tar` → la llave de R. en tu respaldo abre `mantto-delta`; ahí está `ajuste.sh` y el correo de Treviño: *"Que pasen los lotes, el embarque sale el sábado"*. R. te escribe por primera vez. |
| **11** | Mié 11 nov | El reloj de las 23:59 | Linux 4 | variables, scripts, `&&`/`\|\|`/`$?`, `cron` → lees el `crontab` (`59 23 * * * /opt/delta/ajuste.sh`), entiendes el `UPDATE` del script y lo desactivas antes de que corra. |
| **12** | Jue 12 nov | Escribir la verdad | SQL 4 | `CREATE TABLE`, `INSERT … SELECT`, `UPDATE`/`DELETE`, `BEGIN`/`COMMIT`/`ROLLBACK`, `CREATE VIEW` → armas la tabla `evidencia` desde `sensores_raw`. **Momento clave:** la tentación de "corregir" `inspecciones` con un `UPDATE` sin `WHERE`; si lo haces dentro de una transacción, `ROLLBACK` te salva. |
| **13** | Vie 13 nov | Cierre de turno | Integración | `tar`, `sha256sum`, firewall, revocar llave, `kill` de sesión, `curl -X POST` → empaquetas y sellas la evidencia, aseguras el servidor y **decides a quién se la entregas**. |
| **Final** | Lun 16 nov | Epílogo | — | Llegas a la planta y ves el resultado. No hay comandos. |

## Eventos clave

| Evento | Turno | Disparador | Efecto |
|---|---|---|---|
| Escritorio de bienvenida | 0 | Inicio | Decoración; desaparece en T1 (queda la taza) |
| Aparece `.r/` | 1 | Primer `ls -a` en `~` | Carpeta oculta visible; nota de R. en `.r/hola` |
| Borrado de `.r/` | 3 | Inicio de T3-M4 | `/home/becario/.r` deja de existir; el respaldo queda |
| Alarma de fuga | 3–4 | Reloj de juego 23:59 | Línea en `linea3.log`; sonido lejano; Don Chuy lo comenta |
| `wall` de delta_svc | 5 | Completar T5-M4 | Mensaje en la terminal + sonido; cierre del MVP |
| `sudo` concedido | 7 | Visita de Treviño | El jugador entra al grupo `sudo` |
| Mensaje de R. | 10 | Primer `ssh` a `mantto-delta` | Llamada o correo de número desconocido |
| 23:59 del T11 | 11 | Reloj de juego | Si el cron sigue activo, el script corre (consecuencia visible; la misión se repite) |

## Finales (decisión el viernes 13, se ven el lunes 16)

| Final | Condición | Lunes 16 |
|---|---|---|
| **Línea limpia** (mejor) | Evidencia sellada con `sha256sum` coincidente + acceso de `delta_svc` revocado + cron desactivado + reporte a Calidad Corporativa | Te esperan Calidad Corporativa, Karla y R. El embarque se detuvo, Treviño fue removido. Te ofrecen el puesto de R. |
| **Embarque detenido** | Reporte a Calidad Corporativa sin asegurar el servidor o con evidencia incompleta | Recursos Humanos te cuenta que el lote se detuvo, pero `delta_svc` borró rastros; la investigación queda abierta. Epílogo con gancho. |
| **Se lo diste al gerente** | Entregas la evidencia a Treviño | Tu gafete no abre el torniquete. Te llama R.: "te dije que no confiaras". Se invita a repetir el viernes 13. |

Banderas que modifican el epílogo: `respaldo_r` (T2), `karla_aliada` (T9), `rollback_usado` (T12), `script_propio` (T11), `favores_completos`, `tiempo_extra`. Después de ver el final se puede repetir el Turno 13.

## Biblia del mundo

### Red de la planta

| Segmento | CIDR | Puerta de enlace | Qué hay |
|---|---|---|---|
| Servidores (IT) | 10.7.1.0/24 | 10.7.1.1 | `srv-sistemas` 10.7.1.10 (tu servidor), `srv-archivos` 10.7.1.11, DNS 10.7.1.2 |
| Piso de producción (OT) | 10.7.2.0/24 | 10.7.2.1 | `plc-l3`, `hmi-l3`, `est-fuga-l3`, `impresora-l2` (últimos octetos `{{ip_ot_*}}`) |
| VPN de proveedores | 10.7.3.0/24 | 10.7.3.1 | `mantto-delta` `{{ip_delta}}` (no está en el inventario) |
| Corporativo (externo) | — | — | `calidad.corp-ocotillo.example` (API de reportes, T13) |

Dominio interno `ocotillo.local`. Dominios externos con `.example` (reservado, nunca real). Los segmentos y nombres son fijos; los últimos octetos de algunos equipos son variables de partida.

### Archivos clave en `srv-sistemas`

| Ruta | Contenido | Turno |
|---|---|---|
| `/home/becario/LEEME.txt` | Nota de R. | 1 |
| `/home/becario/tickets/` | Un ticket por archivo | 1+ |
| `/home/becario/.r/` | Notas ocultas de R. (`notas.txt`, `hola`, `.llaves/`) | 1–3 |
| `/srv/lineas/linea{1,2,3}/estado.txt` | Estado de líneas | 1 |
| `/var/log/lineas/linea3.log` | Log de estaciones (alarmas FUGA, generado por semilla) | 3 |
| `/var/log/auth.log` | Accesos (aparece `delta_svc`, generado por semilla). Formato moderno de rsyslog: marca de tiempo ISO 8601 de alta precisión (`2026-10-27T23:58:01.003190-06:00 srv-sistemas sshd[1203]: Accepted publickey for delta_svc …`). El servidor de la planta tiene rsyslog; la libreta aclara que Debian 12+ usa `journalctl` por omisión | 3 |
| `/srv/mes/mes.db` | Base SQLite del MES (generada por semilla) | 4+ |
| `/etc/hosts` | Resolución local | 5 |
| `/var/spool/cron/crontabs/delta_svc` | Cron del script | 11 |

### Base de datos `mes.db` (SQLite)

| Tabla | Columnas principales | Turnos |
|---|---|---|
| `lineas` | `id`, `nombre`, `area` | 4 |
| `lotes` | `lote`, `producto`, `linea_id`, `fecha`, `cantidad`, `cliente` | 4, 6 |
| `inspecciones` | `id`, `lote`, `estacion`, `resultado`, `valor_medido`, `limite`, `inspector`, `turno`, `fecha_hora`, `modificado_en`, `usuario_mod` | 4, 6, 9, 12 |
| `sensores_raw` | `id`, `estacion`, `lote`, `fecha_hora`, `valor`, `estado` | 9, 12 |
| `scrap` | `id`, `linea_id`, `turno`, `fecha`, `piezas`, `motivo` | 6 |
| `accesos` | `id`, `gafete`, `puerta`, `fecha_hora`, `sentido` | 9 |
| `empleados` | `gafete`, `nombre`, `puesto`, `turno`, `usuario_sistema` | 9 |
| `usuarios_sistema` | `usuario`, `nombre`, `tipo`, `creado_en`, `activo` | 6, 9 |

Las filas se generan en el navegador con la semilla de la partida (`content/mundo/db/`); la estructura y los hechos de la historia son fijos, los valores concretos no.

### Variables de partida (ejemplos)

| Variable | Rango | Usada en |
|---|---|---|
| `lote` | 4000–4999 | toda la historia |
| `hora_acceso` | 23:50:00–23:58:59 | T3, T6 |
| `ip_delta` | 10.7.3.20–10.7.3.250 | T5+ |
| `puerto_api` | {8080, 8081, 8443, 9000} | T8 |
| `contrasena_becario` | palabra + 2 dígitos de una lista | T0 (post-it) |
| `n_alarmas_fuga` | 9–23 | T3 |
| `insp_por_hora` | 240–420 | T6 |
| `pid_sync_mes` | 1200–9800 | T7 |
| `n_tickets` | 3–6 | T1 (tickets en `~/tickets`) |
| `folio_karla` | 1043–1080 | T1-M2 (folio del ticket de Karla) |
| `piezas_l1`, `piezas_l2`, `piezas_l3` | 300–900 | T1 (piezas del turno matutino en `estado.txt`) |
| `paros_l3` | 3–8 | T1-M3 (paros sin causa de la Línea 3 en octubre); siempre menor que `n_alarmas_fuga`: no toda alarma de fuga para la línea |

Tratamiento al jugador: neutro ("joven"), nunca "mi'jo"/"mi'ja" (el nombre lo elige el jugador; el letrero del T0 dice "Bienvenid@").

## Reglas de escritura

1. Cada misión avanza el misterio **un paso**; nunca dos revelaciones juntas.
2. El briefing plantea el problema, no la solución.
3. Máximo 280 caracteres por globo; 2–4 globos por diálogo. **Excepción:** una llamada que haces tú puede ser de 1 globo (el contacto está ocupado) y a lo más 4, contando la respuesta a tu opción. Las conversaciones **generales** de `content/llamadas/` se repiten de turno en turno: sin "hoy", fechas ni eventos.
4. Los comandos los explican Eduardo (por teléfono), las notas de R., el manual (`man`) y la libreta; los demás personajes nunca dan clases.
5. Don Chuy conecta lo físico (ruidos, luces, cables, horarios) con los datos.
6. Toda acusación necesita evidencia obtenida con una herramienta. Los rumores orientan, no resuelven.
7. El jugador siempre está autorizado: los tickets y la historia justifican cada acción técnica.
8. Ningún texto depende de un valor fijo que la semilla cambie: usa `{{variable}}`.
