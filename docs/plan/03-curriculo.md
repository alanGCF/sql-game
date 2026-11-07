# 03 — Currículo

Fuente de verdad de **qué se enseña, en qué orden y en qué misión**. El harness de contenido (`07-calidad-harness.md`) valida las misiones contra este documento; cuando se implemente F2-01 este contenido se migra a `content/curriculo.yaml` y este archivo queda como explicación.

Convención de IDs: `<dominio>.<área>.<concepto>`. Misión: `T<turno>-M<orden>`.

## Grafo de conceptos

### Linux

| ID | Concepto | Sintaxis que se practica | Requiere | Se enseña en | Se repasa en |
|---|---|---|---|---|---|
| `linux.nav.pwd` | Dónde estoy; directorio de trabajo | `pwd` | — | T0-M1 | T0-M3, T1-M1 |
| `linux.nav.ls` | Listar contenido | `ls`, `ls <ruta>` | — | T0-M1 | casi todas |
| `linux.files.cat` | Ver contenido de un archivo | `cat <archivo>` | `linux.nav.ls` | T0-M2 | T0-M3, T1+ |
| `linux.nav.cd` | Moverse; rutas absolutas/relativas, `..`, `~` | `cd`, `cd ..`, `cd ~`, `cd /srv/lineas` | `linux.nav.pwd` | T0-M3 | T1+ |
| `linux.help.man` | Pedir ayuda; qué es una bandera | `man ls`, `ls --help` | `linux.nav.ls` | T0-M4 | T1-M1, T6 |
| `linux.shell.atajos` | Historial y autocompletado | `history`, ↑, Tab | — | T0-M3 | — (uso continuo) |
| `linux.nav.ocultos` | Archivos ocultos (empiezan con `.`) | `ls -a` | `linux.help.man` | T0-M4 | T1-M1, T1-M4 |
| `linux.nav.ls_largo` | Formato largo: dueño, tamaño, fecha | `ls -l`, `ls -lh`, `ls -la` | `linux.nav.ocultos` | T1-M1 | T1-M2, T6-M2 |
| `linux.files.ver_partes` | Ver partes de un archivo | `head`, `tail`, `-n`, `less` | `linux.files.cat` | T1-M2 | T2-M1 |
| `linux.files.crear` | Crear carpetas y archivos | `mkdir`, `mkdir -p`, `touch` | `linux.nav.cd` | T1-M3 | T9-M4 |
| `linux.shell.redireccion` | Escribir salida a archivo | `echo`, `>`, `>>` | `linux.files.crear` | T1-M3 | T2-M3, T10 |
| `linux.files.copiar_mover` | Copiar, mover, renombrar, borrar | `cp`, `cp -r`, `mv`, `rm`, `rm -r` | `linux.files.crear` | T1-M4 | T9-M4, T12 |
| `linux.shell.globs` | Comodines | `*`, `?` | `linux.nav.ls` | T1-M4 | T2-M1, T6-M4 |
| `linux.text.grep` | Buscar texto | `grep`, `-i`, `-n`, `-v`, `-c`, `-r` | `linux.files.cat` | T2-M1 | T2-M4, T5+, T10 |
| `linux.shell.pipes` | Encadenar comandos | `cmd1 \| cmd2` | `linux.text.grep` | T2-M2 | T2-M3+ (constante) |
| `linux.text.contar` | Contar líneas/palabras | `wc -l`, `wc -w` | `linux.shell.pipes` | T2-M2 | T2-M3, T6 |
| `linux.text.ordenar` | Ordenar y agrupar repetidos | `sort`, `sort -r`, `sort -n`, `uniq`, `uniq -c` | `linux.shell.pipes` | T2-M3 | T7-M2 |
| `linux.text.cut` | Extraer columnas | `cut -d' ' -f5` | `linux.shell.pipes` | T2-M3 | T7-M2 |
| `linux.users.identidad` | Usuarios y grupos | `whoami`, `id`, `/etc/passwd` | `linux.files.cat` | T6-M1 | T6-M3 |
| `linux.perms.leer` | Leer permisos `rwx` | `ls -l` (columna 1) | `linux.nav.ls_largo`, `linux.users.identidad` | T6-M2 | T9, T10 |
| `linux.perms.chmod` | Cambiar permisos | `chmod 640`, `chmod u+x` | `linux.perms.leer` | T6-M2 | T10-M2 |
| `linux.users.sudo` | Privilegios | `sudo <cmd>`, `sudo -l` | `linux.perms.leer` | T6-M3 | T10, T12 |
| `linux.proc.ps_kill` | Procesos | `ps aux`, `ps -u`, `kill <pid>` | `linux.users.sudo` | T6-M3 | T12-M2 |
| `linux.files.find` | Buscar archivos | `find <ruta> -name`, `-user`, `-mmin`, `-type f` | `linux.shell.globs` | T6-M4 | T9 |
| `linux.files.tar` | Empaquetar/comprimir | `tar czf`, `tar tzf`, `tar xzf` | `linux.files.copiar_mover` | T9-M4 | T12-M1 |
| `linux.shell.variables` | Variables y entorno | `VAR=x`, `$VAR`, `echo $HOME`, `export` | `linux.shell.redireccion` | T10-M1 | T10-M2 |
| `linux.shell.control` | Encadenar con condición | `&&`, `\|\|`, `;`, `$?` | `linux.shell.variables` | T10-M1 | T10-M3 |
| `linux.script.basico` | Scripts bash | `#!/bin/bash`, `chmod +x`, `./script.sh`, `if`, `for` | `linux.perms.chmod`, `linux.shell.control` | T10-M2 | T10-M3 |
| `linux.sched.cron` | Tareas programadas | `crontab -l`, `crontab -e` (editor propio), sintaxis `m h dom mon dow` | `linux.script.basico` | T10-M3 | T12 |
| `linux.files.checksum` | Integridad | `sha256sum`, `sha256sum -c` | `linux.files.tar` | T12-M1 | — |

### SQL (SQLite)

| ID | Concepto | Sintaxis | Requiere | Se enseña en | Se repasa en |
|---|---|---|---|---|---|
| `sql.intro.tablas` | Tabla, fila, columna; explorar | `sqlite3 mes.db`, `.tables`, `.schema`, `SELECT * FROM t` | `linux.nav.cd` | T3-M1 | T5-M1 |
| `sql.select.columnas` | Elegir columnas | `SELECT a, b FROM t` | `sql.intro.tablas` | T3-M2 | todas |
| `sql.select.where` | Filtrar | `WHERE`, `=`, `<>`, `<`, `>`, texto entre comillas | `sql.select.columnas` | T3-M2 | todas |
| `sql.select.logica` | Combinar condiciones | `AND`, `OR`, `NOT`, paréntesis | `sql.select.where` | T3-M3 | T5, T8 |
| `sql.select.orden` | Ordenar y limitar | `ORDER BY … DESC`, `LIMIT` | `sql.select.where` | T3-M4 | T5, T8 |
| `sql.select.distinct` | Valores únicos | `SELECT DISTINCT` | `sql.select.columnas` | T5-M1 | T8 |
| `sql.select.patrones` | Patrones y rangos | `LIKE '%x%'`, `IN (…)`, `BETWEEN` | `sql.select.logica` | T5-M1 | T8 |
| `sql.select.null` | Valores vacíos | `IS NULL`, `IS NOT NULL` | `sql.select.where` | T5-M2 | T8-M2 |
| `sql.agg.funciones` | Agregaciones | `COUNT(*)`, `SUM`, `AVG`, `MIN`, `MAX`, `AS` | `sql.select.where` | T5-M2 | T5-M3, T11 |
| `sql.agg.group_by` | Agrupar | `GROUP BY` | `sql.agg.funciones` | T5-M3 | T8, T11 |
| `sql.agg.having` | Filtrar grupos | `HAVING` | `sql.agg.group_by` | T5-M4 | T8-M3 |
| `sql.join.inner` | Unir tablas | `INNER JOIN … ON`, alias `t AS i` | `sql.select.logica` | T8-M1 | T8-M3, T11 |
| `sql.join.left` | Unir conservando filas | `LEFT JOIN`, encontrar faltantes con `IS NULL` | `sql.join.inner`, `sql.select.null` | T8-M2 | T11-M1 |
| `sql.sub.subconsultas` | Consulta dentro de consulta | `WHERE x IN (SELECT …)` | `sql.join.inner` | T8-M3 | T11 |
| `sql.shell.cli` | SQL desde bash | `sqlite3 mes.db "SELECT …"` | `sql.select.where`, `linux.shell.pipes` | T10-M2 | T11 |
| `sql.ddl.create` | Crear tablas y vistas | `CREATE TABLE`, tipos, `CREATE VIEW` | `sql.join.inner` | T11-M1 | T11-M4 |
| `sql.dml.insert` | Insertar | `INSERT INTO … VALUES`, `INSERT INTO … SELECT` | `sql.ddl.create` | T11-M1 | T11-M4 |
| `sql.dml.update_delete` | Modificar/borrar | `UPDATE … SET … WHERE`, `DELETE … WHERE` | `sql.select.where` | T11-M2 | T11-M3 |
| `sql.tx.transacciones` | Deshacer con seguridad | `BEGIN`, `COMMIT`, `ROLLBACK` | `sql.dml.update_delete` | T11-M3 | T12 |

### Redes

| ID | Concepto | Sintaxis | Requiere | Se enseña en | Se repasa en |
|---|---|---|---|---|---|
| `net.basico.ip` | Qué es una IP; mi IP | `ip a`, `hostname`, `hostname -I` | `linux.nav.ls` | T4-M1 | T4-M2, T7 |
| `net.basico.subred` | Subred /24, puerta de enlace | `ip route`, lectura de CIDR | `net.basico.ip` | T4-M2 | T4-M4, T7-M3 |
| `net.diag.ping` | ¿Responde? | `ping -c 4 <host>` | `net.basico.ip` | T4-M2 | T4-M4, T7 |
| `net.dns.hosts` | Nombres locales | `/etc/hosts` | `net.diag.ping`, `linux.files.cat` | T4-M3 | T9 |
| `net.dns.resolucion` | DNS | `host <nombre>`, `dig <nombre>`, `dig -x <ip>` | `net.dns.hosts` | T4-M3 | T4-M4, T7 |
| `net.diag.traceroute` | Ruta de los paquetes | `traceroute <host>` | `net.basico.subred` | T4-M4 | T7-M3 |
| `net.puertos.concepto` | Puerto, servicio, TCP vs UDP | lectura de `ss` | `net.diag.ping` | T7-M1 | T7+ |
| `net.puertos.ss` | Qué escucha / quién se conecta | `ss -tulpn`, `ss -tn` | `net.puertos.concepto`, `linux.proc.ps_kill` | T7-M1 | T7-M2, T12 |
| `net.puertos.escaneo` | Descubrir servicios (red propia) | `nmap <host>`, `nmap -p 1-1024 <host>` | `net.puertos.concepto` | T7-M3 | — |
| `net.http.curl` | HTTP: método, código, cabeceras, JSON | `curl <url>`, `curl -i`, `curl -s` | `net.puertos.concepto` | T7-M4 | T12-M3 |
| `net.ssh.conexion` | Sesión remota | `ssh usuario@host`, `exit` | `net.dns.resolucion` | T9-M1 | T9-M2+ |
| `net.ssh.llaves` | Llaves y huellas | `ssh -i <llave>`, `~/.ssh/authorized_keys`, `known_hosts` | `net.ssh.conexion`, `linux.perms.chmod` | T9-M2 | T12-M2 |
| `net.ssh.scp` | Copiar entre equipos | `scp origen destino` | `net.ssh.llaves` | T9-M3 | T12 |
| `net.seg.firewall` | Bloquear tráfico | `sudo ufw deny from <ip>`, `ufw status` | `net.puertos.ss`, `linux.users.sudo` | T12-M2 | — |
| `net.seg.revocar` | Revocar acceso | editar `authorized_keys`, `kill` de sesión | `net.ssh.llaves` | T12-M2 | — |
| `net.http.post` | Enviar datos | `curl -X POST -H … -d …`, `curl -F` | `net.http.curl` | T12-M3 | — |

## Mapa de misiones

### MVP — Turnos 0 a 4 (detallado)

| Misión | Tipo | Título | Nuevos conceptos | Objetivo verificable (resultado) | Avance de trama |
|---|---|---|---|---|---|
| T0-M1 | Ticket | Primer login | `linux.nav.pwd`, `linux.nav.ls` | Responder "¿en qué carpeta estás?" y "¿cuántos elementos hay?" | Don Chuy te da la credencial; ves `LEEME.txt` y `tickets/` |
| T0-M2 | Ticket | El LEEME | `linux.files.cat` | Archivo leído + responder con qué inicial firmó | "No confíes en los números del turno nocturno — R." |
| T0-M3 | Ticket | Moverse por la planta | `linux.nav.cd`, `linux.shell.atajos` | Responder el estado de la Línea 3 leído en `/srv/lineas/linea3/estado.txt` | La Línea 3 tiene "paros sin causa a las 23:59" |
| T0-M4 | Ticket | Pregúntale al manual | `linux.help.man`, `linux.nav.ocultos` | Descubrir en `man ls` la bandera que muestra ocultos y usarla (evento `.r/` visible) | Aparece `.r/` |
| T1-M1 | Investigación | La carpeta oculta | `linux.nav.ls_largo` | Responder fecha de modificación y tamaño de `.r/notas.txt` (de `ls -lh`) | R. dejó notas la noche que se fue |
| T1-M2 | Ticket | Leer sin abrir todo | `linux.files.ver_partes` | Responder la última línea del log de la impresora (`tail`) y el título de la parte 1 de las notas (`head`) | Notas: "alguien entra de noche" |
| T1-M3 | Ticket | Tu propia bitácora | `linux.files.crear`, `linux.shell.redireccion` | Existe `~/bitacora/turno1.txt` con ≥2 líneas, la segunda agregada con `>>` (verificado por contenido) | Empiezas tu registro de hallazgos |
| T1-M4 | Investigación | Respaldo | `linux.files.copiar_mover`, `linux.shell.globs` | Existe `~/respaldo_r/` con los mismos archivos que `.r/` (comparación de árbol) | Bandera `respaldo_r` |
| T2-M1 | Ticket | Agujas en el pajar | `linux.text.grep` | Responder cuántas veces aparece `ERROR` (sin distinguir mayúsculas) y en qué línea la primera | La estación de fuga falla cada noche |
| T2-M2 | Ticket | Tuberías | `linux.shell.pipes`, `linux.text.contar` | Responder cuántas alarmas `FUGA` hubo ayer (`grep … \| wc -l`) | Don Chuy: "a las 11:59 pita y nadie la toca" |
| T2-M3 | Investigación | ¿Quién entra a las 23:59? | `linux.text.ordenar`, `linux.text.cut` | Responder qué usuario tiene más accesos entre 23:00 y 00:00 | Aparece `delta_svc` |
| T2-M4 | Evento + Inv. | Desaparecida | repaso (`grep -r`) | Responder número de lote y nombre de la base de datos mencionados en el respaldo | `.r/` borrada; lote 4471, `mes.db` |
| T3-M1 | Ticket | Abrir la base | `sql.intro.tablas` | Responder cuántas líneas de producción hay (tabla `lineas`) | Karla pide un reporte |
| T3-M2 | Ticket | Solo lo que necesito | `sql.select.columnas`, `sql.select.where` | Resultado de la consulta del jugador = esperado (inspecciones de hoy de la Línea 2) | Reporte para Karla entregado |
| T3-M3 | Investigación | El lote 4471 | `sql.select.logica` | Responder cuántas inspecciones de `FUGA` del lote 4471 dicen `PASA` | Todas PASA, pero el log decía FUGA |
| T3-M4 | Investigación | Lo más reciente primero | `sql.select.orden` | Responder qué usuario hizo las últimas 5 modificaciones | `kibanez` (sospecha falsa) |
| T4-M1 | Ticket | La impresora muda | `net.basico.ip` | Responder tu IP y el nombre de tu equipo | Ticket de la impresora de etiquetas |
| T4-M2 | Ticket | ¿Me escuchas? | `net.basico.subred`, `net.diag.ping` | Responder qué equipo no responde (impresora) y cuál sí (gateway) | Don Chuy reconecta el cable; la impresora vuelve |
| T4-M3 | Ticket + Inv. | Nombres y números | `net.dns.hosts`, `net.dns.resolucion` | Responder la IP de `impresora-l2` y el nombre que no está en el inventario | Aparece `mantto-delta.ocotillo.local` |
| T4-M4 | Investigación | Un invitado en la red | `net.diag.traceroute` | Responder por qué puerta de enlace llega a `mantto-delta` (10.7.3.1, VPN) | `wall` de `delta_svc`. **Fin del MVP** |

### Turnos 5 a 12 (esbozo; se detallan en la fase correspondiente)

| Turno | Misiones (título → conceptos) |
|---|---|
| 5 | M1 Valores únicos → `distinct`, `patrones` · M2 Lo que falta → `null`, `agg.funciones` · M3 Scrap por turno → `group_by` · M4 Imposible → `having` |
| 6 | M1 ¿Quién soy? → `users.identidad` · M2 Archivo bloqueado → `perms.leer`, `perms.chmod` · M3 El proceso fantasma → `users.sudo`, `proc.ps_kill` · M4 Huellas → `files.find` |
| 7 | M1 Puertas abiertas → `puertos.concepto`, `puertos.ss` · M2 ¿Con quién hablas? → repaso `ss` + `cut`/`sort` · M3 Inventario de servicios → `puertos.escaneo` · M4 La API → `http.curl` |
| 8 | M1 Torniquetes → `join.inner` · M2 Los que faltan → `join.left` · M3 Todos los lotes → `sub.subconsultas` · M4 Karla limpia → repaso |
| 9 | M1 Llamar a la puerta → `ssh.conexion` · M2 La llave de R. → `ssh.llaves` · M3 Traer la prueba → `ssh.scp` · M4 Paquete → `files.tar` |
| 10 | M1 Variables → `shell.variables`, `shell.control` · M2 Leer el script → `script.basico`, `sql.shell.cli` · M3 El reloj → `sched.cron` · M4 Tu script → repaso |
| 11 | M1 La tabla de la verdad → `ddl.create`, `dml.insert` · M2 Corregir → `dml.update_delete` · M3 Casi → `tx.transacciones` · M4 La vista → repaso |
| 12 | M1 Sellar la evidencia → `files.checksum` · M2 Cerrar la puerta → `seg.firewall`, `seg.revocar` · M3 Enviar → `http.post` · M4 Decisión final |

Total v1.0: 52 misiones (≈ 4 por turno). Duración estimada: 4–6 h de juego.

## Superficie de comandos v1

Solo se implementa lo listado. Lo demás responde como en Linux real (`bash: X: command not found` o `ls: invalid option -- 'Z'`) más una glosa: *"Esta bandera existe en Linux real pero este servidor no la tiene"*. Ampliar esta tabla es requisito previo para implementar una bandera nueva (skill `nuevo-comando`).

| Comando | Banderas/forma soportada | Turno |
|---|---|---|
| `pwd` | — | 0 |
| `ls` | `-a -l -h -1 -R -t -r -d`, combinadas (`-la`, `-lh`) | 0–1 |
| `cd` | `cd`, `cd -`, `..`, `~`, absolutas/relativas | 0 |
| `cat` | múltiples archivos, `-n` | 0 |
| `man` | `man <cmd>` (visor paginado propio) | 0 |
| `help`, `--help` | resumen corto por comando | 0 |
| `clear`, `history`, `exit` | — | 0 |
| `echo` | `-n`, `-e` (solo `\n`, `\t`) | 1 |
| `head`, `tail` | `-n N`, `-N` | 1 |
| `less` | visor paginado propio (buscar con `/` opcional) | 1 |
| `mkdir` | `-p` | 1 |
| `touch` | — | 1 |
| `cp` | `-r` | 1 |
| `mv` | — | 1 |
| `rm` | `-r -f -i` | 1 |
| `grep` | `-i -n -v -c -r -w -E` (ERE básico) | 2 |
| `wc` | `-l -w -c` | 2 |
| `sort` | `-r -n -u -k N -t C` | 2 |
| `uniq` | `-c -d` | 2 |
| `cut` | `-d -f` | 2 |
| `sqlite3` | modo interactivo (`sqlite>`), `.tables .schema .headers on .mode column .quit`, modo `sqlite3 db "SQL"` | 3, 10 |
| `ip` | `a`/`addr`, `route`/`r` | 4 |
| `hostname` | `-I` | 4 |
| `ping` | `-c N` | 4 |
| `host` | `host <nombre>`, `host <ip>` | 4 |
| `dig` | `dig <nombre>`, `+short`, `-x <ip>` | 4 |
| `traceroute` | `traceroute <host>` | 4 |
| `whoami`, `id` | — | 6 |
| `chmod` | octal y simbólico (`u+x`, `g-w`, `o=r`) | 6 |
| `sudo` | `sudo <cmd>`, `-l` | 6 |
| `ps` | `aux`, `-u <usuario>`, `-ef` | 6 |
| `kill` | `<pid>`, `-9` | 6 |
| `find` | `-name -type -user -mmin -newer` | 6 |
| `ss` | `-t -u -l -n -p` y combinaciones | 7 |
| `nmap` | `<host>`, `-p <rango>` (solo red ficticia) | 7 |
| `curl` | `-s -i -X -H -d -o -F` | 7, 12 |
| `wall` | solo recibir | 4 |
| `ssh` | `usuario@host`, `-i <llave>` | 9 |
| `scp` | origen/destino local↔remoto | 9 |
| `tar` | `c x t z f v` | 9 |
| `export`, `env` | — | 10 |
| `bash`/`./script` | ejecutar scripts con `#!/bin/bash`, `if`, `for`, variables, `$?` | 10 |
| `crontab` | `-l -e` (editor de una línea propio) | 10 |
| `sha256sum` | `<archivo>`, `-c` | 12 |
| `ufw` | `status`, `deny from <ip>`, `allow` | 12 |

Comandos de Windows (`dir`, `cls`, `type`, `ipconfig`, `copy`, `del`) responden con una glosa que redirige al equivalente de Linux (ver `04-mecanicas.md`).
