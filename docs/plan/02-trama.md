# 02 — Trama

> Propuesta v0.1. La ambientación y los nombres están sujetos a la decisión D-01 (`decisiones-abiertas.md`). Todo es ficticio: ninguna empresa, persona, IP o dominio corresponde a algo real.

## Premisa

**Industrias Ocotillo, Planta 7**, en **Ciudad Médanos** (ciudad ficticia de la frontera norte), fabrica calipers de freno para un cliente automotriz. Entras como **técnico de sistemas del turno vespertino** (15:30–00:00). Tu antecesora, la **Ing. Rebeca Salcido**, renunció de un día para otro. Lo único que dejó fue un `LEEME.txt` con una frase: *"no confíes en los números del turno nocturno"*.

Cada noche, a las **23:59**, un script instalado por un contratista de mantenimiento remoto cambia en la base de datos de producción los resultados de la prueba de fuga del **lote 4471** de FALLA a PASA, para que el lote salga en el embarque del lunes 16. Las piezas defectuosas podrían llegar a autos reales.

Tu trabajo diario son tickets normales de sistemas (la impresora, los logs, un reporte para Calidad). Tu investigación es reconstruir qué pasó usando esas mismas herramientas.

## Tono

- Misterio corporativo de bajo perfil, con humor de planta. Nada de "hackers con capucha".
- Tensión que sube con el reloj del turno: cada turno termina más cerca de las 23:59.
- Las consecuencias son de seguridad industrial (piezas defectuosas), no violencia.
- Español de México; el humor norteño viene de Don Chuy, sin caricatura.

## Estructura narrativa: Ticket + Investigación

Cada **turno** (capítulo) mezcla dos tipos de misión:

- **Ticket** — trabajo normal, bajo riesgo: aprendes el concepto. *Ej.: "la impresora de la Línea 2 no imprime" → aprendes `ping`.*
- **Investigación** — aplicas el concepto recién aprendido al misterio. *Ej.: con `ping` descubres un equipo que no está en el inventario.*

Esto da el patrón pedagógico **aprender → aplicar** sin que se sienta como ejercicio.

## Personajes

| Personaje | Rol | Usuario de sistema | Voz | Función |
|---|---|---|---|---|
| **Jugador** | Técnico de sistemas, turno vespertino | `becario` | — (nombre elegido por el jugador) | Protagonista |
| **Jesús "Don Chuy" Ortega** | Supervisor de mantenimiento, 30 años en la planta | (no usa la computadora) | Coloquial, norteño, refranes, desconfía de "las máquinas" | Mentor del mundo físico: da pistas que conectan la planta con los datos ("la estación de fuga pita a las 11:59 y nadie la toca") |
| **Ing. Rebeca Salcido ("R.")** | Ex ingeniera de sistemas y automatización | `rsalcido` | Precisa, escueta, irónica | Tutora indirecta vía notas escondidas; reaparece en Turno 9 |
| **Ing. Karla Ibáñez** | Jefa de Calidad del turno | `kibanez` | Directa, presionada | Pide tickets; sus credenciales fueron usadas → **sospechosa falsa** |
| **Lic. Mauricio Treviño** | Gerente de planta | `mtrevino` | Corporativo, amable en exceso | Antagonista: ordenó "que pasen los lotes" por el embarque |
| **Óscar Delgado** | Contratista de "Soluciones Delta" (ficticia), mantenimiento remoto vía VPN | `delta_svc` | Seco, amenazante por `wall` | Ejecutor técnico del script |
| **Calidad Corporativa** | Área de calidad del corporativo | — | Formal | Destinataria del reporte final |

## Línea por turno

Cada fila dice qué herramienta aprende el jugador **y qué cambia en la historia gracias a ella**. Detalle de conceptos por misión en `03-curriculo.md`.

| Turno | Título | Dominio | Herramienta → avance de la trama |
|---|---|---|---|
| **0** | Inducción | Linux 0 | `pwd`, `ls`, `cd`, `cat`, `man` → lees el `LEEME.txt` de R.; el manual te enseña `ls -a` y aparece la carpeta oculta `.r/`. |
| **1** | Lo que dejó R. | Linux 1 | `ls -la`, `head`/`tail`/`less`, `mkdir`, `cp`, `mv`, comodines, `>`/`>>` → lees las notas de R., abres tu propia bitácora y **respaldas `.r/`** (R.: "hazte una copia antes de que la borren"). |
| **2** | Los registros no mienten | Linux 2 | `grep`, `|`, `wc`, `sort`, `uniq`, `cut` → en `auth.log` aparece `delta_svc` entrando cada noche a las 23:58. **Evento:** `.r/` original desaparece; tu respaldo es lo único que queda. En él, `grep -r` encuentra "lote 4471" y `mes.db`. |
| **3** | El MES | SQL 1 | `sqlite3`, `SELECT`, `WHERE`, `AND/OR`, `ORDER BY`, `LIMIT` → todas las inspecciones de fuga del lote 4471 dicen PASA, pero el log del Turno 2 registró alarmas de fuga a esas horas. Las últimas modificaciones las firma `kibanez`. |
| **4** | ¿Quién está en mi red? | Redes 1 | `ip a`, subred, `ping`, `/etc/hosts`, `host`/`dig`, `traceroute` → arreglas la impresora (cable flojo: Don Chuy lo reconecta) y descubres `mantto-delta` (10.7.3.99), que no está en el inventario y entra por la VPN de proveedores. **Cierre del MVP:** `Broadcast message from delta_svc@mantto-delta: ¿Quién eres, becario?` |
| **5** | Cuadrar números | SQL 2 | `DISTINCT`, `LIKE`/`IN`/`BETWEEN`, `NULL`, `COUNT/SUM/AVG`, `GROUP BY`, `HAVING` → el scrap del turno nocturno es 0 desde el 14 de agosto (fecha de alta de `delta_svc`); `kibanez` "inspecciona" 300 piezas por hora a las 23:59, imposible. |
| **6** | Permisos y procesos | Linux 3 | `whoami`/`id`, `rwx`, `chmod`, `sudo`, `ps`, `kill`, `find` → `find / -user delta_svc -mmin` muestra archivos tocados anoche; un proceso `sync_mes` corre como `delta_svc`; `Permission denied` → Treviño te da `sudo` "para lo de la impresora" (ironía). |
| **7** | Puertos y servicios | Redes 2 | puertos, TCP/UDP, `ss`, `nmap` (red propia, autorizado por ticket), `curl` → `ss` muestra conexiones a 10.7.3.99:8080; `curl` a `/api/ajustes` devuelve el JSON con los "ajustes" del lote 4471. |
| **8** | Cruce de datos | SQL 3 | `INNER/LEFT JOIN`, alias, subconsultas → al cruzar `inspecciones` con `accesos` (torniquetes), Karla no estaba en la planta cuando "firmó"; al cruzar con `sensores_raw`, los valores originales eran FALLA. Karla queda limpia y se vuelve aliada. |
| **9** | Llaves y túneles | Redes 3 + Linux | `ssh`, llaves, `known_hosts`, `scp`, `tar` → la llave de R. en tu respaldo abre `mantto-delta`; ahí está `ajuste.sh` y el correo de Treviño: *"Que pasen los lotes, el embarque sale el lunes"*. R. te escribe por primera vez. |
| **10** | El reloj de las 23:59 | Linux 4 | variables, scripts, `&&`/`||`/`$?`, `cron`, `sqlite3` desde bash → lees el `crontab` (`59 23 * * * /opt/delta/ajuste.sh`), entiendes el `UPDATE` del script y lo desactivas antes de que corra. |
| **11** | Escribir la verdad | SQL 4 | `CREATE TABLE`, `INSERT … SELECT`, `UPDATE`/`DELETE`, `BEGIN`/`COMMIT`/`ROLLBACK`, `CREATE VIEW` → armas la tabla `evidencia` desde `sensores_raw`. **Momento clave:** la tentación de "corregir" `inspecciones` con un `UPDATE` sin `WHERE`; si lo haces dentro de una transacción, `ROLLBACK` te salva. |
| **12** | Cierre de turno | Integración | `tar`, `sha256sum`, firewall, revocar llave, `kill` de sesión, `curl -X POST` → empaquetas y firmas la evidencia, aseguras el servidor y decides a quién se la entregas. |

## Eventos clave (guionizados por el motor)

| Evento | Turno | Disparador | Efecto |
|---|---|---|---|
| Aparece `.r/` | 0 | Primer `ls -a` en `~` | Se muestra la carpeta oculta; mensaje de R. en el archivo `.r/hola` |
| Borrado de `.r/` | 2 | Al iniciar T2-M4 | `/home/becario/.r` deja de existir; el respaldo de T1-M4 queda intacto |
| Alarma de fuga | 2–3 | Reloj de juego 23:59 | Línea en `linea3.log`; Don Chuy lo comenta |
| `wall` de delta_svc | 4 | Completar T4-M4 | Mensaje de broadcast en la terminal; cierre del MVP |
| `sudo` concedido | 6 | Ticket de Treviño | El jugador entra al grupo `sudo` |
| Mensaje de R. | 9 | Primer `ssh` exitoso a `mantto-delta` | Hilo nuevo en Mensajes |
| 23:59 del Turno 10 | 10 | Reloj de juego | Si el cron sigue activo, el script corre (consecuencia visible, la misión no se pierde: se repite) |

## Finales (Turno 12)

El final depende de la **decisión final** y de **banderas** acumuladas. Ningún final bloquea seguir jugando: se puede repetir el Turno 12.

| Final | Condición | Desenlace |
|---|---|---|
| **Línea limpia** (mejor) | Evidencia empaquetada con `sha256sum` coincidente + acceso de `delta_svc` revocado + cron desactivado + reporte enviado a Calidad Corporativa | Se retiene el lote 4471, Treviño es removido, Karla y R. limpian su nombre. Te ofrecen el puesto de R. |
| **Embarque detenido** | Reporte a Calidad Corporativa pero sin asegurar el servidor o con evidencia incompleta | El lote se detiene, pero `delta_svc` borra rastros; la investigación queda abierta. Epílogo con gancho. |
| **Se lo diste al gerente** | Entregas la evidencia a Treviño | Treviño "lo atiende"; al día siguiente tu usuario está deshabilitado. R. te escribe: "te dije que no confiaras". Final malo, se invita a repetir. |

Banderas que modifican epílogos: `respaldo_r` (T1), `karla_aliada` (T8), `rollback_usado` (T11), `script_propio` (T10), `sin_pistas_turno_X`.

## Biblia del mundo

### Red de la planta

| Segmento | CIDR | Puerta de enlace | Qué hay |
|---|---|---|---|
| Servidores (IT) | 10.7.1.0/24 | 10.7.1.1 | `srv-sistemas` 10.7.1.10 (tu servidor), `srv-archivos` 10.7.1.11 |
| Piso de producción (OT) | 10.7.2.0/24 | 10.7.2.1 | `plc-l3` 10.7.2.30, `hmi-l3` 10.7.2.31, `est-fuga-l3` 10.7.2.32, `impresora-l2` 10.7.2.40 |
| VPN de proveedores | 10.7.3.0/24 | 10.7.3.1 | `mantto-delta` 10.7.3.99 (no está en el inventario) |
| Corporativo (externo) | — | — | `calidad.corp-ocotillo.example` (API de reportes, Turno 12) |

Dominio interno: `ocotillo.local`. DNS interno en 10.7.1.2. Los dominios externos usan `.example` (reservado, nunca real).

### Archivos clave en `srv-sistemas`

| Ruta | Contenido | Turno |
|---|---|---|
| `/home/becario/LEEME.txt` | Nota de R. | 0 |
| `/home/becario/tickets/` | Un ticket por archivo | 0+ |
| `/home/becario/.r/` | Notas ocultas de R. (`notas.txt`, `hola`, `.llaves/`) | 0–2 |
| `/srv/lineas/linea{1,2,3}/estado.txt` | Estado de líneas | 0 |
| `/var/log/lineas/linea3.log` | Log de estaciones (alarmas FUGA) | 2 |
| `/var/log/auth.log` | Accesos (aparece `delta_svc`) | 2 |
| `/srv/mes/mes.db` | Base de datos SQLite del MES | 3+ |
| `/etc/hosts` | Resolución local | 4 |
| `/var/spool/cron/crontabs/delta_svc` | Cron del script | 10 |

### Base de datos `mes.db` (SQLite)

| Tabla | Columnas principales | Para qué turno |
|---|---|---|
| `lineas` | `id`, `nombre`, `area` | 3 |
| `lotes` | `lote`, `producto`, `linea_id`, `fecha`, `cantidad`, `cliente` | 3, 5 |
| `inspecciones` | `id`, `lote`, `estacion`, `resultado`, `valor_medido`, `limite`, `inspector`, `turno`, `fecha_hora`, `modificado_en`, `usuario_mod` | 3, 5, 8, 11 |
| `sensores_raw` | `id`, `estacion`, `lote`, `fecha_hora`, `valor`, `estado` | 8, 11 |
| `scrap` | `id`, `linea_id`, `turno`, `fecha`, `piezas`, `motivo` | 5 |
| `accesos` | `id`, `gafete`, `puerta`, `fecha_hora`, `sentido` | 8 |
| `empleados` | `gafete`, `nombre`, `puesto`, `turno`, `usuario_sistema` | 8 |
| `usuarios_sistema` | `usuario`, `nombre`, `tipo`, `creado_en`, `activo` | 5, 8 |

Los datos se generan con un script determinista (semilla fija) en `content/mundo/` para que las respuestas sean siempre las mismas.

### Calendario del juego

- La planta trabaja de lunes a sábado. La historia ocurre en noviembre de 2026: **T0–T5** = lunes 2 a sábado 7, **T6–T11** = lunes 9 a sábado 14, **T12** = domingo 15 (tiempo extra por el embarque). El embarque del lote 4471 sale el **lunes 16 a las 06:00**. *(Ajustable al escribir T5+.)*
- Cada turno = un día laboral, 15:30–00:00 en el reloj de juego.
- `delta_svc` fue dado de alta el **14 de agosto**.

## Reglas de escritura

1. Cada misión avanza el misterio **un paso**; nunca dos revelaciones en la misma misión.
2. El briefing plantea el problema, no la solución.
3. Máximo 280 caracteres por burbuja; 2–4 burbujas por briefing.
4. Los personajes nunca explican comandos en abstracto; los explican las notas de R., el manual (`man`) y la Bitácora.
5. Don Chuy conecta lo físico (ruidos, luces, cables, horarios) con los datos.
6. Toda acusación necesita evidencia que el jugador obtuvo con una herramienta.
7. El jugador siempre está autorizado: los tickets y la historia justifican cada acción técnica.
