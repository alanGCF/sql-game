# 04 — Mecánicas

## Loop principal

```
Llegas al cubículo (inicio de turno) → pendientes en el pizarrón → visitas / llamadas / tickets
   → te acercas a la computadora → terminal, datos, red → objetivo cumplido (se tacha en el pizarrón)
   → ¿atorado? marcas a Eduardo y pides pista → … → misión completada → siguiente pendiente
   → fin del turno (00:00): resumen en el calendario → siguiente día
```

Una misión dura 3–8 minutos. El juego guarda solo y en cada checkpoint actualiza la partida en el servidor (código de partida).

## Escena y cámara

- **Primera persona, sentado.** No puedes levantarte ni caminar.
- **La cámara gira hacia donde apunta el cursor** (sin capturar el puntero): la posición del cursor en pantalla se traduce en giro horizontal (±65°) y vertical (−30° a +15°), con zona muerta al centro y suavizado. Ves tu escritorio, tu cubículo y un poco de la oficina detrás de las mamparas; el resto queda fuera de vista a propósito.
- **Interacción:** pasar el cursor sobre un objeto lo resalta y muestra su nombre; clic para usarlo.
- **Acercarse:** clic en la computadora, teléfono, libreta, pizarrón o calendario → transición de cámara (≈ 0.6 s, suavizada) hacia el objeto y aparece su interfaz. **Alejarse:** `Esc`, clic fuera o el botón "Levantar la vista". Mientras estás acercado la cámara no sigue al cursor.
- **Alternativas** (Ajustes): cámara por bordes de pantalla, por arrastre o con flechas; `Tab` recorre los objetos interactivos y `Enter` los usa; reducir movimiento convierte las transiciones en cortes.

## Objetos del escritorio

| Objeto | Interacción | Para qué | Desde |
|---|---|---|---|
| **Computadora** (monitor + teclado) | Acercarse → apps | Terminal, Tickets, Correo, Datos (T4), Red (T5) | T0 |
| **Teléfono** de escritorio | Acercarse → directorio y teclado numérico | Pistas (Eduardo), rumores, favores, llamadas de la historia | T0 |
| **Libreta de apuntes** | Abrir → hojear pestañas, escribir | Historia, comandos aprendidos, pistas recibidas, tus notas | T0 |
| **Pizarrón** pequeño en la mampara | Acercarse | Pendientes del turno; se tachan al cumplirse; post-its de favores | T0 |
| **Post-its** (monitor y pizarrón) | Clic → leer | Datos sueltos (tu contraseña en T0, extensiones), favores | T0 |
| **Calendario** de pared | Acercarse → clic en un día | Avance de la partida, calificación de turnos anteriores, tiempo extra del sábado 7 | T0 |
| **Gafete** | Clic | Tu nombre y número de empleado = código de partida *(D-15)* | T0 |
| **Lonchera** | Abrir | Lo que te mandaron de comer ese día; a veces una nota | T1 |
| **Taza** | Clic → tomar café | Ambiente (sonido); se vacía durante el turno | T0 |
| **Cajón** | Abrir | Cosas que olvidó R. (algunas son pistas de la historia), clips, un manual viejo | T1 |
| **Reloj de pared** | Mirar | Hora del juego (15:30–00:00) | T0 |
| **Adornos y desorden** | Clic → reacción/comentario | Foto, planta, figurita, papeles, envolturas; los favores completados agregan regalos *(D-16)* | T0 |
| **Radio** pequeño *(opcional)* | Clic → prender/cambiar estación | Música ambiental con licencia libre | TE |

## Computadora

Apps en la pantalla del monitor (la interfaz se dibuja como si fuera el sistema de la planta):

| App | Desde | Qué es |
|---|---|---|
| **Terminal** | T0 (inicio de sesión), T1 | Shell simulado del host actual |
| **Tickets** | T1 | Mesa de ayuda: los tickets llegan aquí y se **responden tecleando** la respuesta *(D-17)* |
| **Correo** | T1 | Correos de la historia (Karla, Treviño, R., Calidad Corporativa) |
| **Datos** | T4 | Cliente SQL visual sobre la misma base que `sqlite3`: editor, palabras clave resaltadas, tabla de resultados, esquema |
| **Red** | T5 | Mapa de la red que se dibuja conforme descubres hosts con comandos |

Datos y Red son ayudas visuales, no atajos: el mapa solo muestra lo que descubriste con comandos y la app Datos ejecuta tu SQL, no lo escribe.

## Terminal

- Prompt real: `sofia@srv-sistemas:~$` con tu usuario, que es tu primer nombre en minúsculas sin acentos (F4-17); cambia con `cd`, `ssh`.
- **Salida idéntica a la del sistema real** (inglés, locale C). Debajo de errores y salidas nuevas aparece una **glosa** en español, desactivable:
  ```
  sofia@srv-sistemas:~$ cat leeme.txt
  cat: leeme.txt: No such file or directory
  ↳ No existe "leeme.txt" aquí. Linux distingue mayúsculas: ¿será LEEME.txt?
  ```
- `Tab` autocompleta comandos y rutas; `↑`/`↓` recorren el historial (como en bash).
- Errores de dedo de comandos que no existen (`sl`, `cta`) → `command not found` real + glosa "¿quisiste decir…?".
- Comandos de Windows → glosa: `dir` → `ls`, `cls` → `clear`, `ipconfig` → `ip a`, `type` → `cat`.
- Comandos obsoletos que ya no vienen instalados (`ifconfig`, `netstat`) → `command not found` + glosa con el equivalente moderno.
- Salida larga: se pagina; `less` y `man` abren un visor propio dentro del monitor.
- **Restaurar misión:** en el menú de la computadora; regresa el mundo de la misión a su estado inicial (con confirmación).

### Fuera de alcance: el globo de pensamiento

Para que no se note que no es una terminal completa y para controlar lo que se ejecuta, antes de ejecutar cada línea el motor la clasifica:

| Caso | Ejemplo | Qué pasa |
|---|---|---|
| Soportado | `grep -i error app.log` | Se ejecuta |
| Comando inexistente en Linux (error de dedo) | `sl`, `lss` | `command not found` real + glosa (es parte de aprender) |
| Comando o bandera **real** que no está en la superficie | `awk '{print $1}'`, `ls -Z`, `vim`, `apt install` | **No se ejecuta.** Aparece un globo de pensamiento del protagonista: *"No sé qué haga esto… mejor no le doy Enter."* La línea se queda en el input para corregirla |
| Sintaxis avanzada no soportada | `$(…)`, `` `…` ``, `<<EOF`, `&` en segundo plano, funciones | Globo: *"Eso se ve muy avanzado. Mejor no me arriesgo."* |
| Destructivo o peligroso | `rm -rf /`, `:(){ :\|:& };:`, `chmod -R 777 /`, `dd`, `mkfs` | Globo: *"Si hago esto me corren el primer día."* |
| Entrada anómala | > 500 caracteres, caracteres de control | Globo: *"Creo que me dormí sobre el teclado."* |

Hay varias frases por caso para que no se repitan. El globo no gasta pistas ni afecta la calificación. Así el jugador nunca ve un comportamiento falso de un comando que no simulamos.

### Todo se teclea

- La terminal, la app Datos, las respuestas de tickets y la libreta **bloquean pegar y soltar texto** (`paste`, `drop`, `insertFromPaste`). Si el jugador intenta pegar: globo *"Mejor lo escribo yo, así se me queda."*
- El texto de la libreta, las pistas y los post-its **no se puede seleccionar ni copiar**.
- Es un empujón de diseño, no un control de seguridad: alguien con herramientas del navegador puede saltárselo y no pasa nada.

## Teléfono

- Al acercarte ves el teléfono, el **directorio de extensiones** (pegado en la mampara) y un teclado numérico. Marcas tecleando o con clic en los números; `Enter` o "Llamar" marca y `Retroceso` borra. La pantallita muestra tu extensión (210) y la hora, lo que vas marcando y con quién hablas. Tu propia extensión da **ocupado**; una que no está en el directorio, **no existe**. El directorio sale de `content/personajes.yaml` (campo `corto`), igual que la hoja de la mampara.
- La llamada se ve en la tarjeta de llamada (D-22). La última línea trae "Colgar"; `Esc` cuelga antes de tiempo (y un segundo `Esc` levanta la vista).
- Contactos: Eduardo (214), Don Chuy (301), Karla (402), Conmutador (0), Comedor (150), Vigilancia (900), Gerencia (100). Detalle y voces en `02-trama.md`.
- **Paciencia por turno:** llamadas 1–2 → charla, rumor o aviso; 3 → "¿No tienes trabajo? Ponte a trabajar"; 4+ → no contesta (la pantallita dice "Sin respuesta" y el jugador lo piensa en un globo). Gerencia gasta paciencia al doble (su paciencia es 1). Lo que dice cada contacto vive en `content/llamadas/<contacto>.yaml`: primero lo del turno y lo que pide una bandera, luego lo general, sin repetir dentro del turno. Algunas conversaciones traen **opciones de respuesta** (botones con número; las teclas 1–3 también eligen). Una llamada contestada toma 2 minutos de reloj y deja la bandera `llamo_<contacto>` (T0 pide marcarle a Eduardo). La paciencia gastada se guarda en la partida.
- **Llamadas entrantes:** el teléfono suena (vibra y parpadea su luz; quieto con "reducir movimiento") y la tarjeta de llamada dice "Llamada entrante" con "[Suena tu teléfono]" como subtítulo del timbre. Contestas con `Enter`, con el botón "Contestar" o con clic en el teléfono. Si en 20 s nadie contesta, la llamada se va al **buzón**: se prende la luz roja del teléfono y lo que seguía en la cola (p. ej. el ticket de Karla) continúa. En la vista del teléfono, "Buzón (n)" reproduce el mensaje más viejo en la tarjeta ("Buzón · ext. 214"); `Esc` lo corta. El buzón se guarda en la partida (hasta 20 mensajes).
- Las conversaciones son diálogos con subtítulos y, a veces, opciones de respuesta.

## Pistas: Eduardo por teléfono

- Marcas a Eduardo y, si hay pendientes, contesta "¿Qué ocupas?": eliges "Necesito una pista" o "Nada, nomás quería platicar" (esto sí gasta paciencia). Sabe en qué pendiente estás; si hay varios (misión y favores), pregunta "¿Con cuál te atoraste?" y eliges el texto del pizarrón. Después de la tercera pista de un objetivo, te repite el comando exacto sin cambiar las estrellas. Lo que dice alrededor de la pista vive en `content/llamadas/companero.yaml` (sección `pistas`).
- Tres niveles por objetivo, uno por llamada: **empujón** ("¿Ya viste qué hay en esa carpeta?") → **concepto** ("Hay un comando que muestra lo que tiene un archivo; viene de *concatenate*") → **comando exacto** dictado ("Teclea `cat LEEME.txt`, con mayúsculas").
- Las pistas recibidas quedan escritas en la libreta (sección Pistas), sin poder copiarse: hay que teclearlas.
- **Pedir pista no gasta la paciencia de Eduardo** *(D-14)*; platicar sí. Si fallas 3 veces seguidas (tres comandos con error que no cumplen nada, o tres respuestas equivocadas del mismo objetivo), piensas en voz alta: *"Igual y le marco a Eduardo…"*.
- Las pistas recibidas se guardan en la partida (`pistas`: misión, objetivo, nivel y texto) para la pestaña Pistas de la libreta.
- Sin castigo de progreso: solo afecta las estrellas de la misión.

## Libreta de apuntes

Objeto físico en el escritorio; se abre como libreta de espiral con pestañas:

| Pestaña | Quién escribe | Contenido |
|---|---|---|
| **Historia** | El juego, automático | Hechos importantes: "R. dejó una carpeta oculta", "delta_svc entra a las `{{hora_acceso}}`" |
| **Comandos** | El juego, al aprender | Cada comando/concepto: explicación corta, un ejemplo, y "En tu Linux real…" |
| **Pistas** | El juego | Pistas que te dio Eduardo |
| **Mis notas** | El jugador | Notas libres tecleadas (sin pegar), hasta 200 notas de 500 caracteres |

Las entradas automáticas aparecen con animación de escritura a mano (los renglones se descubren de izquierda a derecha; sin animación con "reducir movimiento") y un sonido de lápiz (F4-10). Es el sustituto del "manual": el jugador lo consulta sin salir del escritorio.

- **Historia:** la sección `libreta` (pestaña `historia`) de cada misión o favor terminado, con las variables de la partida, bajo "Turno N · día".
- **Comandos:** cada concepto de `libreta` (pestaña `comandos`) abre la página del primer comando de su sintaxis en `content/libreta/comandos/` (índice a un lado, página al otro). Las páginas se dibujan con un markdown mínimo, nunca como HTML.
- **Pistas:** las que dio Eduardo (`pistas` de la partida), con la misión y el nivel.
- **Mis notas:** se teclean (pegar y soltar texto están bloqueados), `Ctrl+Enter` o "Anotar" guarda, × borra; hasta 200 de 500 caracteres; se guardan con la partida.
- Nada de la libreta se puede seleccionar ni copiar (`user-select: none` y `copy`/`cut` bloqueados).

## Pizarrón y post-its

- El pizarrón muestra los **pendientes del turno** (objetivos de la misión actual y siguientes del día). Al cumplirse, el plumón rojo los raya de izquierda a derecha (≈ 0.8 s) y aparece la palomita verde. El último pendiente de una misión no se alcanza a ver rayado: el pizarrón pasa de inmediato a la misión siguiente.
- Los **favores** aparecen como post-its amarillos pegados en el pizarrón; al completarse, el post-it se arruga en su lugar y la bolita cae al **bote** que está en el piso, a la derecha del escritorio.
- Post-its informativos (rosas, abajo del pizarrón; los 3 más recientes): los deja el efecto `postit` de una misión (contraseña en T0, extensiones, recordatorios de Eduardo) y se guardan con la partida (hasta 12).
- Con "reducir movimiento" no hay animaciones: el renglón aparece rayado y el post-it desaparece. Las animaciones piden cuadros solo mientras se mueven (ADR-018).

## Calendario

- Calendario de pared de octubre–noviembre 2026 (del 26 de octubre al 16 de noviembre).
- Días pasados: calificación del turno (estrellas: el promedio redondeado de sus misiones principales) y una palomita verde por favor hecho. Hoy: encerrado en círculo. Sábado 7: "Tiempo extra (opcional)".
- Acercado, a un lado aparece "Días trabajados" (cada día con sus estrellas, o "hoy"); al elegir uno, aquí o con clic en la hoja, sale su **resumen**: misiones con estrellas (o "pendiente"), favores hechos y los hallazgos que quedaron en la pestaña Historia de la libreta.
- **Repetir** una misión para mejorar estrellas (no cambia la historia) llega en F7.
- Al terminar el viernes 6, una visita o llamada ofrece el tiempo extra del sábado; el jugador decide ir o no.

## Código de partida (checkpoint)

- **Nuevo ingreso:** escribes tu nombre; se genera un código de 12 caracteres (`K7QF-29XM-PL4D`, alfabeto sin caracteres ambiguos). Una tarjeta de Recursos Humanos lo muestra grande con "Anótalo en un papel" y "Ya lo anoté" (los diálogos esperan); además queda en un post-it del monitor, Eduardo lo menciona y el gafete del escritorio lo trae enmascarado *(D-15, D-26, D-27)*.
- **Checkpoints:** al completar cada misión o favor y al terminar el turno, la partida se guarda en el servidor bajo ese código. Entre checkpoints, el progreso también se guarda en el navegador.
- **Checar entrada:** en el menú tecleas el código y continúas desde el último checkpoint, en cualquier computadora.
- El código es la única llave de la partida: quien lo tenga puede continuarla. No se piden correos ni contraseñas.
- Si no hay conexión, el juego sigue con el guardado local y sincroniza al volver.

## La oficina viva

- **Sonido escaso (D-19):** el silencio es lo normal. No hay ruido continuo de fondo; solo de vez en cuando algo a lo lejos (una impresora, un teléfono de otro escritorio, el voceo de la planta, el pitido de un montacargas) y los sonidos de lo que tú haces. Reglas en `docs/diseno/direccion-arte.md` §Audio.
- **Luz:** la ventana pasa de tarde (15:30) a noche; las lámparas se ajustan; a las 00:00 el turno termina.
- **Visitas:** alguien se acerca por el pasillo (pasos, voz). Pueden ser de historia, favores o ambientales, y traen rumores. Llega caminando por el pasillo detrás de la mampara derecha y se asoma sobre ella, cerca de la entrada del cubículo (D-30: figura de bloques con la ropa de su departamento); para verle la cara volteas a la derecha y alzas la vista. Habla en subtítulo con su departamento (D-22); el efecto `visita` puede traer 2 o 3 **opciones** para contestar (clic o teclas 1–3) con su respuesta y, si se quiere, una bandera. Al terminar sus líneas, se va. Con "reducir movimiento" aparece y desaparece sin caminar.
- **Fechas especiales (D-20):** marcadas en el calendario, con adornos en tu escritorio y comentarios de los compañeros; no afectan la historia. Detalle en `02-trama.md` §Fechas especiales.
- **Reloj de juego:** avanza con lo que haces (comandos, llamadas, misiones), no con el tiempo real; los eventos guionizados ocurren a su hora. Hoy: 15 s por comando y, al cerrar la misión principal *k* de *n*, al menos hasta 15:30 + *k*/*n* × 8 h (la última deja el reloj en 23:30). Se ajusta cuando lleguen las llamadas y los eventos `reloj:HH:MM` (F4).

## Estructura

- **Turno** = un día laboral (T0–T13) + tiempo extra (TE) + epílogo.
- **Misión principal:** 1–3 objetivos, 1–2 conceptos nuevos. Tipos: `ticket`, `investigacion`, `repaso`, `evento`, `final`.
- **Favor:** misión secundaria de repaso (`tipo: favor`), opcional, no afecta la historia.
- **Objetivo:** condición verificable; aparece como pendiente en el pizarrón.

## Objetivos: validación por resultado

El motor evalúa **predicados** después de cada comando. Ninguno compara el texto del comando.

| Predicado | Se cumple cuando… |
|---|---|
| `respuesta` | el jugador teclea la respuesta (en el ticket o en la libreta, según el objetivo) y, normalizada, coincide con el valor esperado. El valor esperado **se calcula del mundo** de esa semilla (`esperado_de`), no se escribe a mano |
| `archivo_leido` | el contenido de un archivo pasó por la salida de un comando de lectura |
| `archivo_existe` / `no_existe` / `archivo_contiene` / `arbol_igual` | estado del sistema de archivos |
| `permisos` | modo/dueño de una ruta |
| `consulta_resultado` | el último resultado SQL del jugador coincide con el de `esperado_sql` (opciones de orden y columnas) |
| `estado_db` | una consulta de verificación sobre la base devuelve lo esperado |
| `host_descubierto`, `proceso`, `servicio`, `firewall`, `cron`, `sesion_en` | estado de red, procesos y sesiones |
| `flag` | bandera de historia |
| `comando_ejecutado` | solo para comandos observacionales sin efecto (`pwd`, `whoami`); preferir `respuesta` |

Combinadores: `todos`, `alguno`, `no`. Normalización de respuestas: minúsculas, sin acentos, sin espacios extra, sinónimos en `acepta_tambien`.

## Calificación y progresión

- **Estrellas por misión:** ★★★ sin pistas · ★★ con pistas nivel 1–2 · ★ con pista nivel 3. Se ven en el calendario.
- **XP** por misión y favor; bonos por solución elegante (una sola tubería) o primer intento.
- **Rangos:** Becario → Técnico → Técnico Sr. → Ingeniero → Ingeniero Sr. → Líder de Ingeniería.
- **Logros:** "Tubería maestra", "Nunca sin respaldo", "ROLLBACK a tiempo", "Leí el manual", "Sin red de seguridad" (turno sin pistas), "Hora extra" (tiempo extra completo), "No molestes" (te colgaron todos los contactos).

## Aleatorización por partida

Objetivo: que nadie pase el juego memorizando respuestas, sin cambiar la historia.

- Al crear la partida se genera una **semilla** (se guarda con el código).
- El contenido declara **variables de partida** con generadores: rangos numéricos, IPs dentro de una subred, horas dentro de una ventana, elección de una lista (ver ejemplos en `02-trama.md`).
- Textos, archivos, logs y filas de la base usan `{{variable}}` o se **generan** a partir de la semilla (cantidad de alarmas, accesos, inspecciones).
- **Fijo:** personajes, diálogos (salvo valores), orden de misiones, qué se aprende, quién es el culpable, el calendario.
- **Variable:** números de lote, IPs de algunos equipos, puertos, horas exactas, conteos, PIDs, contraseñas, tamaños y fechas de archivos, el orden de filas.
- Las respuestas esperadas se **calculan** del mundo generado con una solución de referencia, así siempre son consistentes.
- El harness valida cada misión con muchas semillas (25 en cada CI, 500 cada noche).

## Guardado

- Local (IndexedDB) tras cada comando que cambia el estado (agrupado cada 400 ms); servidor en cada checkpoint (misión, favor o turno terminados). Sin conexión se sigue en local y se sube al volver. Si otra computadora guardó después (revisión vieja), gana el último checkpoint.
- Al cargar se reconstruye el mundo desde las diferencias, el reloj y el avance de la misión en curso, sin repetir sus diálogos; un favor a medias empieza de nuevo.
- En el menú, si hay partida en el navegador, el gafete muestra su nombre y número y lo principal es "Checar entrada como …"; con "Checar entrada con otro número" se teclea un código (se aceptan guiones y minúsculas; el verificador detecta errores de tecleo antes de llamar al servidor).
- Computadoras compartidas (D-26): el gafete muestra solo los últimos 4 caracteres del número (`••••-••••-PL4D`) salvo con "Mostrar mi número", y "No soy yo: olvidar esta partida en esta computadora" la borra del navegador tras confirmar (si no tiene número, avisa que se pierde).
- Contenido: semilla, progreso (misiones, estrellas, XP, logros, banderas, favores), estado del mundo como diferencias respecto al mundo base, notas del jugador, paciencia de contactos del turno, pistas recibidas y buzón.
- Formato versionado con migraciones. Tamaño máximo de una partida: 64 KB.

## Menú

Sobre la misma escena (no hay otra página): la oficina de noche con el monitor encendido. Opciones: **Nuevo ingreso**, **Checar entrada** (código), **Continuar** (si hay guardado local), **Ajustes**, **Créditos**. `Esc` sin estar acercado a un objeto abre la pausa.

## Ajustes y accesibilidad

- Sensibilidad y modo de cámara (cursor, bordes, arrastre, flechas); invertir eje.
- Reducir movimiento (sin transiciones ni balanceo), desactivar parpadeos.
- Tamaño de texto de la terminal, de la libreta y de los subtítulos; fondo de subtítulos.
- Volumen general, ambiente, voces, efectos; subtítulos siempre disponibles (todo sonido importante tiene texto).
- Glosas en español sí/no; contraste alto en la interfaz del monitor.
- Navegación completa por teclado (`Tab`/`Enter`/`Esc`).

## Estados de falla

No hay "game over":
- Romper el mundo de la misión → **Restaurar misión**.
- Eventos con reloj (23:59 del T11): si no actúas a tiempo ocurre la consecuencia y la misión se repite con un diálogo nuevo.
- Final malo → se puede repetir el Turno 13.

## Port móvil (v2, fuera de alcance)

Notas para no cerrarse la puerta: la escena admite cámara por arrastre táctil; la terminal es DOM (funciona con teclado virtual); la lógica del juego no depende del puntero. El diseño de interacción táctil, el teclado virtual y el rendimiento se resuelven en v2.
