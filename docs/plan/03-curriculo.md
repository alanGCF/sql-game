# 03 — Currículo

Fuente de verdad de **qué se enseña, en qué orden y en qué misión**. El harness de contenido (`07-calidad-harness.md`) valida las misiones contra este documento; cuando se implemente F2-01 este contenido se migra a `content/curriculo.yaml` y este archivo queda como explicación.

Convención de IDs: `<dominio>.<área>.<concepto>`. Misión principal: `T<turno>-M<orden>`. Favor: `T<turno>-F<n>`; tiempo extra: `TE-F<n>`. El Turno 0 es el tutorial de controles y no enseña conceptos técnicos.

## Grafo de conceptos

### Linux

| ID | Concepto | Sintaxis que se practica | Requiere | Se enseña en | Se repasa en |
|---|---|---|---|---|---|
| `linux.nav.pwd` | Dónde estoy; directorio de trabajo | `pwd` | — | T1-M1 | T1-M3, T2-M1 |
| `linux.nav.ls` | Listar contenido | `ls`, `ls <ruta>` | — | T1-M1 | casi todas |
| `linux.files.cat` | Ver contenido de un archivo | `cat <archivo>` | `linux.nav.ls` | T1-M2 | T1-M3, T2+ |
| `linux.nav.cd` | Moverse; rutas absolutas/relativas, `..`, `~` | `cd`, `cd ..`, `cd ~`, `cd /srv/lineas` | `linux.nav.pwd` | T1-M3 | T2+ |
| `linux.help.man` | Pedir ayuda; qué es una bandera | `man ls`, `ls --help` | `linux.nav.ls` | T1-M4 | T2-M1, T7 |
| `linux.shell.atajos` | Historial y autocompletado | `history`, ↑, Tab | — | T1-M3 | — (uso continuo) |
| `linux.nav.ocultos` | Archivos ocultos (empiezan con `.`) | `ls -a` | `linux.help.man` | T1-M4 | T2-M1, T2-M4 |
| `linux.nav.ls_largo` | Formato largo: dueño, tamaño, fecha | `ls -l`, `ls -lh`, `ls -la` | `linux.nav.ocultos` | T2-M1 | T2-M2, T7-M2 |
| `linux.files.ver_partes` | Ver partes de un archivo | `head`, `tail`, `-n`, `less` | `linux.files.cat` | T2-M2 | T3-M1 |
| `linux.files.crear` | Crear carpetas y archivos | `mkdir`, `mkdir -p`, `touch` | `linux.nav.cd` | T2-M3 | T10-M4 |
| `linux.shell.redireccion` | Escribir salida a archivo | `echo`, `>`, `>>` | `linux.files.crear` | T2-M3 | T3-M3, T11 |
| `linux.files.copiar_mover` | Copiar, mover, renombrar, borrar | `cp`, `cp -r`, `mv`, `rm`, `rm -r` | `linux.files.crear` | T2-M4 | T10-M4, T13 |
| `linux.shell.globs` | Comodines | `*`, `?` | `linux.nav.ls` | T2-M4 | T3-M1, T7-M4 |
| `linux.text.grep` | Buscar texto | `grep`, `-i`, `-n`, `-v`, `-c`, `-r` | `linux.files.cat` | T3-M1 | T3-M4, T6+, T11 |
| `linux.shell.pipes` | Encadenar comandos | `cmd1 \| cmd2` | `linux.text.grep` | T3-M2 | T3-M3+ (constante) |
| `linux.text.contar` | Contar líneas/palabras | `wc -l`, `wc -w` | `linux.shell.pipes` | T3-M2 | T3-M3, T7 |
| `linux.text.ordenar` | Ordenar y agrupar repetidos | `sort`, `sort -r`, `sort -n`, `uniq`, `uniq -c` | `linux.shell.pipes` | T3-M3 | T8-M2 |
| `linux.text.cut` | Extraer columnas | `cut -d' ' -f5` | `linux.shell.pipes` | T3-M3 | T8-M2 |
| `linux.users.identidad` | Usuarios y grupos | `whoami`, `id`, `/etc/passwd` | `linux.files.cat` | T7-M1 | T7-M3 |
| `linux.perms.leer` | Leer permisos `rwx` | `ls -l` (columna 1) | `linux.nav.ls_largo`, `linux.users.identidad` | T7-M2 | T10, T11 |
| `linux.perms.chmod` | Cambiar permisos | `chmod 640`, `chmod u+x` | `linux.perms.leer` | T7-M2 | T11-M2 |
| `linux.users.sudo` | Privilegios | `sudo <cmd>`, `sudo -l` | `linux.perms.leer` | T7-M3 | T11, T13 |
| `linux.proc.ps_kill` | Procesos | `ps aux`, `ps -u`, `kill <pid>` | `linux.users.sudo` | T7-M3 | T13-M2 |
| `linux.files.find` | Buscar archivos | `find <ruta> -name`, `-user`, `-mmin`, `-type f` | `linux.shell.globs` | T7-M4 | T10 |
| `linux.files.tar` | Empaquetar/comprimir | `tar czf`, `tar tzf`, `tar xzf` | `linux.files.copiar_mover` | T10-M4 | T13-M1 |
| `linux.shell.variables` | Variables y entorno | `VAR=x`, `$VAR`, `echo $HOME`, `export` | `linux.shell.redireccion` | T11-M1 | T11-M2 |
| `linux.shell.control` | Encadenar con condición | `&&`, `\|\|`, `;`, `$?` | `linux.shell.variables` | T11-M1 | T11-M3 |
| `linux.script.basico` | Scripts bash | `#!/bin/bash`, `chmod +x`, `./script.sh`, `if`, `for` | `linux.perms.chmod`, `linux.shell.control` | T11-M2 | T11-M3 |
| `linux.sched.cron` | Tareas programadas | `crontab -l`, `crontab -e` (editor propio), sintaxis `m h dom mon dow` | `linux.script.basico` | T11-M3 | T13 |
| `linux.files.checksum` | Integridad | `sha256sum`, `sha256sum -c` | `linux.files.tar` | T13-M1 | — |

### SQL (SQLite)

| ID | Concepto | Sintaxis | Requiere | Se enseña en | Se repasa en |
|---|---|---|---|---|---|
| `sql.intro.tablas` | Tabla, fila, columna; explorar | `sqlite3 mes.db`, `.tables`, `.schema`, `SELECT * FROM t` | `linux.nav.cd` | T4-M1 | T6-M1 |
| `sql.select.columnas` | Elegir columnas | `SELECT a, b FROM t` | `sql.intro.tablas` | T4-M2 | todas |
| `sql.select.where` | Filtrar | `WHERE`, `=`, `<>`, `<`, `>`, texto entre comillas | `sql.select.columnas` | T4-M2 | todas |
| `sql.select.logica` | Combinar condiciones | `AND`, `OR`, `NOT`, paréntesis | `sql.select.where` | T4-M3 | T6, T9 |
| `sql.select.orden` | Ordenar y limitar | `ORDER BY … DESC`, `LIMIT` | `sql.select.where` | T4-M4 | T6, T9 |
| `sql.select.distinct` | Valores únicos | `SELECT DISTINCT` | `sql.select.columnas` | T6-M1 | T9 |
| `sql.select.patrones` | Patrones y rangos | `LIKE '%x%'`, `IN (…)`, `BETWEEN` | `sql.select.logica` | T6-M1 | T9 |
| `sql.select.null` | Valores vacíos | `IS NULL`, `IS NOT NULL` | `sql.select.where` | T6-M2 | T9-M2 |
| `sql.agg.funciones` | Agregaciones | `COUNT(*)`, `SUM`, `AVG`, `MIN`, `MAX`, `AS` | `sql.select.where` | T6-M2 | T6-M3, T12 |
| `sql.agg.group_by` | Agrupar | `GROUP BY` | `sql.agg.funciones` | T6-M3 | T9, T12 |
| `sql.agg.having` | Filtrar grupos | `HAVING` | `sql.agg.group_by` | T6-M4 | T9-M3 |
| `sql.join.inner` | Unir tablas | `INNER JOIN … ON`, alias `t AS i` | `sql.select.logica` | T9-M1 | T9-M3, T12 |
| `sql.join.left` | Unir conservando filas | `LEFT JOIN`, encontrar faltantes con `IS NULL` | `sql.join.inner`, `sql.select.null` | T9-M2 | T12-M1 |
| `sql.sub.subconsultas` | Consulta dentro de consulta | `WHERE x IN (SELECT …)` | `sql.join.inner` | T9-M3 | T12 |
| `sql.shell.cli` | SQL desde bash | `sqlite3 mes.db "SELECT …"` | `sql.select.where`, `linux.shell.pipes` | T11-M2 | T12 |
| `sql.ddl.create` | Crear tablas y vistas | `CREATE TABLE`, tipos, `CREATE VIEW` | `sql.join.inner` | T12-M1 | T12-M4 |
| `sql.dml.insert` | Insertar | `INSERT INTO … VALUES`, `INSERT INTO … SELECT` | `sql.ddl.create` | T12-M1 | T12-M4 |
| `sql.dml.update_delete` | Modificar/borrar | `UPDATE … SET … WHERE`, `DELETE … WHERE` | `sql.select.where` | T12-M2 | T12-M3 |
| `sql.tx.transacciones` | Deshacer con seguridad | `BEGIN`, `COMMIT`, `ROLLBACK` | `sql.dml.update_delete` | T12-M3 | T13 |

### Redes

| ID | Concepto | Sintaxis | Requiere | Se enseña en | Se repasa en |
|---|---|---|---|---|---|
| `net.basico.ip` | Qué es una IP; mi IP | `ip a`, `hostname`, `hostname -I` | `linux.nav.ls` | T5-M1 | T5-M2, T8 |
| `net.basico.subred` | Subred /24, puerta de enlace | `ip route`, lectura de CIDR | `net.basico.ip` | T5-M2 | T5-M4, T8-M3 |
| `net.diag.ping` | ¿Responde? | `ping -c 4 <host>` | `net.basico.ip` | T5-M2 | T5-M4, T8 |
| `net.dns.hosts` | Nombres locales | `/etc/hosts` | `net.diag.ping`, `linux.files.cat` | T5-M3 | T10 |
| `net.dns.resolucion` | DNS | `host <nombre>`, `dig <nombre>`, `dig -x <ip>` | `net.dns.hosts` | T5-M3 | T5-M4, T8 |
| `net.diag.traceroute` | Ruta de los paquetes | `traceroute <host>` | `net.basico.subred` | T5-M4 | T8-M3 |
| `net.puertos.concepto` | Puerto, servicio, TCP vs UDP | lectura de `ss` | `net.diag.ping` | T8-M1 | T8+ |
| `net.puertos.ss` | Qué escucha / quién se conecta | `ss -tulpn`, `ss -tn` | `net.puertos.concepto`, `linux.proc.ps_kill` | T8-M1 | T8-M2, T13 |
| `net.puertos.escaneo` | Descubrir servicios (red propia) | `nmap <host>`, `nmap -p 1-1024 <host>` | `net.puertos.concepto` | T8-M3 | — |
| `net.http.curl` | HTTP: método, código, cabeceras, JSON | `curl <url>`, `curl -i`, `curl -s` | `net.puertos.concepto` | T8-M4 | T13-M3 |
| `net.ssh.conexion` | Sesión remota | `ssh usuario@host`, `exit` | `net.dns.resolucion` | T10-M1 | T10-M2+ |
| `net.ssh.llaves` | Llaves y huellas | `ssh -i <llave>`, `~/.ssh/authorized_keys`, `known_hosts` | `net.ssh.conexion`, `linux.perms.chmod` | T10-M2 | T13-M2 |
| `net.ssh.scp` | Copiar entre equipos | `scp origen destino` | `net.ssh.llaves` | T10-M3 | T13 |
| `net.seg.firewall` | Bloquear tráfico | `sudo ufw deny from <ip>`, `ufw status` | `net.puertos.ss`, `linux.users.sudo` | T13-M2 | — |
| `net.seg.revocar` | Revocar acceso | editar `authorized_keys`, `kill` de sesión | `net.ssh.llaves` | T13-M2 | — |
| `net.http.post` | Enviar datos | `curl -X POST -H … -d …`, `curl -F` | `net.http.curl` | T13-M3 | — |

## Mapa de misiones

### MVP — Turnos 1 a 5 (detallado)

| Misión | Tipo | Título | Nuevos conceptos | Objetivo verificable (resultado) | Avance de trama |
|---|---|---|---|---|---|
| T1-M1 | Ticket | ¿Dónde estoy? | `linux.nav.pwd`, `linux.nav.ls` | Responder "¿en qué carpeta estás?" y "¿cuántos elementos hay?" | Lupita te deja el primer ticket; ves `LEEME.txt` y `tickets/` |
| T1-M2 | Ticket | El LEEME | `linux.files.cat` | Archivo leído + responder con qué inicial firmó | "No confíes en los números del turno nocturno — R." |
| T1-M3 | Ticket | Moverse por la planta | `linux.nav.cd`, `linux.shell.atajos` | Responder el estado de la Línea 3 leído en `/srv/lineas/linea3/estado.txt` | La Línea 3 tiene "paros sin causa a las 23:59" |
| T1-M4 | Ticket | Pregúntale al manual | `linux.help.man`, `linux.nav.ocultos` | Descubrir en `man ls` la bandera que muestra ocultos y usarla (evento `.r/` visible) | Aparece `.r/` |
| T2-M1 | Investigación | La carpeta oculta | `linux.nav.ls_largo` | Responder fecha de modificación y tamaño de `.r/notas.txt` (de `ls -lh`) | R. dejó notas la noche que se fue |
| T2-M2 | Ticket | Leer sin abrir todo | `linux.files.ver_partes` | Responder la última línea del log de la impresora (`tail`) y el título de la parte 1 de las notas (`head`) | Notas: "alguien entra de noche" |
| T2-M3 | Ticket | Tu propia bitácora | `linux.files.crear`, `linux.shell.redireccion` | Existe `~/bitacora/hallazgos.txt` con ≥2 líneas, la segunda agregada con `>>` (verificado por contenido) | Empiezas tu registro de hallazgos |
| T2-M4 | Investigación | Respaldo | `linux.files.copiar_mover`, `linux.shell.globs` | Existe `~/respaldo_r/` con los mismos archivos que `.r/` (comparación de árbol) | Bandera `respaldo_r` |
| T3-M1 | Ticket | Agujas en el pajar | `linux.text.grep` | Responder cuántas veces aparece `ERROR` (sin distinguir mayúsculas) y en qué línea la primera | La estación de fuga falla cada noche |
| T3-M2 | Ticket | Tuberías | `linux.shell.pipes`, `linux.text.contar` | Responder cuántas alarmas `FUGA` hubo ayer (`grep … \| wc -l`) | Don Chuy: "a las 11:59 pita y nadie la toca" |
| T3-M3 | Investigación | ¿Quién entra a las 23:59? | `linux.text.ordenar`, `linux.text.cut` | Responder qué usuario tiene más accesos entre 23:00 y 00:00 | Aparece `delta_svc` |
| T3-M4 | Evento + Inv. | Desaparecida | repaso (`grep -r`) | Responder número de lote y nombre de la base de datos mencionados en el respaldo | `.r/` borrada; lote `{{lote}}`, `mes.db` |
| T4-M1 | Ticket | Abrir la base | `sql.intro.tablas` | Responder cuántas líneas de producción hay (tabla `lineas`) | Karla pide un reporte |
| T4-M2 | Ticket | Solo lo que necesito | `sql.select.columnas`, `sql.select.where` | Resultado de la consulta del jugador = esperado (inspecciones de hoy de la Línea 2) | Reporte para Karla entregado |
| T4-M3 | Investigación | El lote | `sql.select.logica` | Responder cuántas inspecciones de `FUGA` del lote `{{lote}}` dicen `PASA` | Todas PASA, pero el log decía FUGA |
| T4-M4 | Investigación | Lo más reciente primero | `sql.select.orden` | Responder qué usuario hizo las últimas 5 modificaciones | `kibanez` (sospecha falsa) |
| T5-M1 | Ticket | La impresora muda | `net.basico.ip` | Responder tu IP y el nombre de tu equipo | Ticket de la impresora de etiquetas |
| T5-M2 | Ticket | ¿Me escuchas? | `net.basico.subred`, `net.diag.ping` | Responder qué equipo no responde (impresora) y cuál sí (gateway) | Don Chuy reconecta el cable; la impresora vuelve |
| T5-M3 | Ticket + Inv. | Nombres y números | `net.dns.hosts`, `net.dns.resolucion` | Responder la IP de `impresora-l2` y el nombre que no está en el inventario | Aparece `mantto-delta.ocotillo.local` |
| T5-M4 | Investigación | Un invitado en la red | `net.diag.traceroute` | Responder por qué puerta de enlace llega a `mantto-delta` (10.7.3.1, VPN de proveedores) | `wall` de `delta_svc`. **Fin del MVP** |

### Turnos 6 a 13 (esbozo; se detallan en la fase correspondiente)

| Turno | Misiones (título → conceptos) |
|---|---|
| 6 | M1 Valores únicos → `distinct`, `patrones` · M2 Lo que falta → `null`, `agg.funciones` · M3 Scrap por turno → `group_by` · M4 Imposible → `having` |
| 7 | M1 ¿Quién soy? → `users.identidad` · M2 Archivo bloqueado → `perms.leer`, `perms.chmod` · M3 El proceso fantasma → `users.sudo`, `proc.ps_kill` · M4 Huellas → `files.find` |
| 8 | M1 Puertas abiertas → `puertos.concepto`, `puertos.ss` · M2 ¿Con quién hablas? → repaso `ss` + `cut`/`sort` · M3 Inventario de servicios → `puertos.escaneo` · M4 La API → `http.curl` |
| 9 | M1 Torniquetes → `join.inner` · M2 Los que faltan → `join.left` · M3 Todos los lotes → `sub.subconsultas` · M4 Karla limpia → repaso |
| 10 | M1 Llamar a la puerta → `ssh.conexion` · M2 La llave de R. → `ssh.llaves` · M3 Traer la prueba → `ssh.scp` · M4 Paquete → `files.tar` |
| 11 | M1 Variables → `shell.variables`, `shell.control` · M2 Leer el script → `script.basico`, `sql.shell.cli` · M3 El reloj → `sched.cron` · M4 Tu script → repaso |
| 12 | M1 La tabla de la verdad → `ddl.create`, `dml.insert` · M2 Corregir → `dml.update_delete` · M3 Casi → `tx.transacciones` · M4 La vista → repaso |
| 13 | M1 Sellar la evidencia → `files.checksum` · M2 Cerrar la puerta → `seg.firewall`, `seg.revocar` · M3 Enviar → `http.post` · M4 Decisión final |

Total v1.0: 52 misiones principales (T1–T13) + 13 favores + 4 favores de tiempo extra + el tutorial del Turno 0. Duración estimada: 5–7 h de juego.

## Superficie de comandos v1

Solo se implementa lo listado. Lo demás responde como en Linux real (`bash: X: command not found` o `ls: invalid option -- 'Z'`) más una glosa: *"Esta bandera existe en Linux real pero este servidor no la tiene"*. Ampliar esta tabla es requisito previo para implementar una bandera nueva (skill `nuevo-comando`).

| Comando | Banderas/forma soportada | Turno | Referencia vigente |
|---|---|---|---|
| `pwd` | — | 1 | coreutils 9 |
| `ls` | `-a -l -h -1 -R -t -r -d`, combinadas (`-la`, `-lh`) | 1–2 | coreutils 9 |
| `cd` | `cd`, `cd -`, `..`, `~`, absolutas/relativas | 1 | bash 5.2 (builtin) |
| `cat` | múltiples archivos, `-n` | 1 | coreutils 9 |
| `man` | `man <cmd>` (visor paginado propio) | 1 | man-db 2.12 |
| `--help` | en `ls` y `cat`: muestra la página en español (desviación documentada: en Linux real es la ayuda completa en inglés) | 1 | — |
| `clear`, `history`, `exit` | `exit` en el servidor propio no cierra la terminal: globo "todavía no acaba mi turno" | 1 | bash 5.2 / ncurses 6 |
| `echo` | `-n`, `-e` (solo `\n`, `\t`) | 2 | coreutils 9 / bash builtin |
| `head`, `tail` | `-n N`, `-N` | 2 | coreutils 9 |
| `less` | visor paginado propio (pendiente: F3, junto con la UI del monitor) | 2 | less 6xx |
| `mkdir` | `-p` | 2 | coreutils 9 |
| `touch` | — | 2 | coreutils 9 |
| `cp` | `-r` | 2 | coreutils 9 |
| `mv` | — | 2 | coreutils 9 |
| `rm` | `-r -f` (`-i` no: pide confirmación interactiva) | 2 | coreutils 9 |
| `grep` | `-i -n -v -c -r -w -E` (ERE básico) | 3 | GNU grep 3.11 |
| `wc` | `-l -w -c` | 3 | coreutils 9 |
| `sort` | `-r -n -u -k N -t C` | 3 | coreutils 9 |
| `uniq` | `-c -d` | 3 | coreutils 9 |
| `cut` | `-d -f` | 3 | coreutils 9 |
| `sqlite3` | modo interactivo (`sqlite>`), `.tables .schema .headers on .mode column .quit`, modo `sqlite3 db "SQL"` | 4, 11 | SQLite 3.4x+ (la de sql.js) |
| `ip` | `a`/`addr`, `route`/`r` | 5 | iproute2 6.x |
| `hostname` | `-I` | 5 | hostname 3.x |
| `ping` | `-c N` | 5 | iputils 2024+ |
| `host` | `host <nombre>`, `host <ip>` | 5 | bind9-host 9.18+ |
| `dig` | `dig <nombre>`, `+short`, `-x <ip>` | 5 | bind9-dnsutils 9.18+ |
| `traceroute` | `traceroute <host>` | 5 | traceroute 2.1 |
| `whoami`, `id` | — | 7 | coreutils 9 |
| `chmod` | octal y simbólico (`u+x`, `g-w`, `o=r`) | 7 | coreutils 9 |
| `sudo` | `sudo <cmd>`, `-l` | 7 | sudo 1.9 |
| `ps` | `aux`, `-u <usuario>`, `-ef` | 7 | procps-ng 4 |
| `kill` | `<pid>`, `-9` | 7 | procps-ng 4 / bash builtin |
| `find` | `-name -type -user -mmin -newer` | 7 | findutils 4.9+ |
| `ss` | `-t -u -l -n -p` y combinaciones | 8 | iproute2 6.x |
| `nmap` | `<host>`, `-p <rango>` (solo red ficticia) | 8 | nmap 7.9x |
| `curl` | `-s -i -X -H -d -o -F` | 8, 13 | curl 8.x |
| `wall` | solo recibir | 5 | util-linux 2.39+ |
| `ssh` | `usuario@host`, `-i <llave>` | 10 | OpenSSH 9.6+ |
| `scp` | origen/destino local↔remoto | 10 | OpenSSH 9.6+ (protocolo SFTP por defecto) |
| `tar` | `c x t z f v` | 10 | GNU tar 1.35 |
| `export`, `env` | — | 11 | bash 5.2 |
| `bash`/`./script` | ejecutar scripts con `#!/bin/bash`, `if`, `for`, variables, `$?` | 11 | bash 5.2 |
| `crontab` | `-l -e` (editor de una línea propio) | 11 | cron (Debian) 3.0pl1 |
| `sha256sum` | `<archivo>`, `-c` | 13 | coreutils 9 |
| `ufw` | `status`, `deny from <ip>`, `allow` | 13 | ufw 0.36 (frontend de nftables) |

Comandos de Windows (`dir`, `cls`, `type`, `ipconfig`, `copy`, `del`) responden con una glosa que redirige al equivalente de Linux. Comandos o sintaxis reales **fuera** de esta tabla no se ejecutan: aparece el globo de pensamiento del protagonista (ver `04-mecanicas.md` §Fuera de alcance).

## Favores (misiones secundarias de repaso)

Reglas (las valida el harness, regla C16):
- `ensena: []`; `refuerza:` 1–3 conceptos ya enseñados.
- Disponible **1–2 misiones principales después** de la misión que enseña el concepto más reciente que refuerza.
- No cambia banderas de la historia principal; recompensa: XP, estrellas y un objeto decorativo para el escritorio *(propuesta D-16)*.
- Llega como post-it en el pizarrón, llamada entrante o visita; queda pendiente hasta completarse (no caduca).
- Los datos también salen de la semilla.

| Favor | Quién lo pide | Refuerza | Disponible desde | Qué pide |
|---|---|---|---|---|
| T1-F1 | Don Chuy (visita) | `linux.nav.cd`, `linux.files.cat` | T1-M4 | "No traigo lentes: ¿qué dice el estado de la Línea 1?" |
| T2-F1 | Comedor (post-it) | `linux.files.copiar_mover`, `linux.shell.globs` | después de T2-M4 (inicio de T3) | Ordenar los menús de la semana en una carpeta y renombrar el que dice "jueves" con fecha mal |
| T3-F1 | Karla (llamada) | `linux.text.grep`, `linux.shell.pipes`, `linux.text.contar` | T3-M4 | ¿Cuántos tickets mencionan "impresora"? |
| T4-F1 | Lupita (post-it) | `sql.select.where`, `sql.select.orden` | después de T4-M4 (inicio de T5) | Los 3 lotes más grandes de la Línea 1 |
| T5-F1 | Vigilancia (llamada) | `net.diag.ping`, `net.dns.resolucion` | T5-M4 | ¿Responde el checador de la caseta? |
| T6-F1 | Comedor (visita) | `sql.agg.funciones`, `sql.agg.group_by` | después de T6-M4 | Promedio de piezas por turno (para el pastel del mes) |
| T7-F1 | Lupita (post-it) | `linux.perms.chmod`, `linux.files.find` | después de T7-M4 | Encontrar y corregir permisos de un script de respaldo |
| T8-F1 | Don Chuy (llamada) | `net.puertos.ss`, `net.http.curl` | después de T8-M4 | ¿Está arriba el servicio del tablero de la Línea 2? |
| TE-F1…F4 | varios | mezcla de T1–T8 | sábado 7 (opcional) | 4 favores de repaso mixto |
| T9-F1 | Karla (visita) | `sql.join.inner` | T9-M3 | Lista de empleados con sus accesos del día |
| T10-F1 | Lupita (llamada) | `net.ssh.scp`, `linux.files.tar` | después de T10-M4 | Copiar un respaldo al servidor de archivos |
| T11-F1 | Lupita (post-it) | `linux.script.basico`, `linux.sched.cron` | después de T11-M4 | Programar la limpieza semanal de `/tmp` del servidor |
| T12-F1 | Karla (llamada) | `sql.tx.transacciones` | después de T12-M4 | Corregir un dato mal capturado de forma segura |
| T13-F1 | Don Chuy (visita) | `linux.files.checksum` | T13-M3 | Verificar que el firmware que bajó no venga corrupto |

## Política de vigencia

Lo que se enseña debe ser **lo que funciona hoy** en una distribución actual. Es uno de los requisitos más importantes del proyecto.

1. **Plataforma de referencia:** Debian stable (13 "trixie") y Ubuntu LTS (24.04). La columna "Referencia vigente" de la superficie de comandos indica la herramienta y versión mínima.
2. **Herramientas modernas primero:** `ip` (no `ifconfig`), `ss` (no `netstat`), `grep -E` (no `egrep`), `dig`/`host` (no `nslookup` como principal), llaves `ssh-keygen -t ed25519` (no RSA de 2048), `scp` sabiendo que usa SFTP por debajo, `curl` 8, SQLite 3.4x+. `cron` se enseña por ser universal, y la libreta explica los timers de systemd como alternativa moderna.
3. **Lo obsoleto se comporta como en un sistema moderno:** `ifconfig` y `netstat` no vienen instalados en Debian/Ubuntu recientes → `command not found` + glosa con el equivalente moderno. La libreta incluye "Si lo ves en un tutorial viejo…".
4. **Goldens capturados en un contenedor `debian:stable`** (job de CI `goldens`), no en la máquina del desarrollador. El golden guarda la versión de la herramienta con la que se capturó.
5. **Revisión de vigencia** antes de cada release y al menos cada 6 meses: el subagente `verificador-fidelidad` revisa notas de versión de las herramientas de la tabla, recaptura goldens en `debian:stable` y lista diferencias; los cambios entran al backlog.
6. **Formatos de archivos del sistema también vigentes:** los logs usan el formato actual de rsyslog (marca de tiempo ISO 8601 de alta precisión, como Ubuntu 24.04) y la libreta explica `journalctl` como la forma por omisión en Debian 12+.
7. **Desviaciones documentadas del motor:** `grep -r` recorre carpetas en orden alfabético (en Linux real el orden depende del sistema de archivos); `--help` muestra la página en español.
8. **Librerías del proyecto** (sql.js, three.js, etc.) se consultan en su documentación actual antes de usarlas.

