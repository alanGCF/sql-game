# Dirección de arte

> Sustituye al brief para Claude Design (ADR-016: el diseño se hace en Claude Code con capturas de Playwright). El estilo final se elige en D-08 viendo el spike F0-07.

## Sensación

Estar en tu cubículo de sistemas en una planta del desierto, de la tarde a la medianoche: concentración, misterio tranquilo, humor de planta, una oficina que sigue viva alrededor aunque tú no te levantes. **No** el cliché hacker (capucha, Matrix, neón).

## Encuadre

- Cámara a la altura de los ojos de una persona sentada, mirando al monitor.
- Giro hacia el cursor: horizontal ±65°, vertical −30° (mirar el escritorio) a +15° (ver el reloj y el borde de la mampara).
- Desde el centro se ve el escritorio completo; a los lados, las mamparas con el pizarrón y el calendario; por encima de las mamparas, un poco de oficina (lámparas del techo, otras mamparas, alguien que pasa). Nunca la oficina completa.

## Distribución del cubículo

```
                 (oficina al fondo, sobre las mamparas: lámparas, reloj de pared, ventana a la planta)
   ┌──────────── mampara frontal ────────────┐
   │   [post-its]   [ MONITOR ]   [post-its] │
izq│                                         │der
   │ [calendario]                [pizarrón]  │
   │                                         │
   │ [lonchera] [teléfono] [teclado] [libreta] [taza]
   │ [foto] [planta]   [gafete]   [papeles]   │
   └──────────── escritorio ─────────────────┘  ← pasillo a la derecha: por aquí llegan las visitas
                   (cajón bajo el escritorio, a la derecha)
```

## Inventario de objetos

| Objeto | Detalle visual | Estados |
|---|---|---|
| Monitor | LCD de oficina algo viejo, con marco grueso; post-its en el borde | apagado, encendido (fondo de la planta), terminal |
| Teclado y mouse | Genéricos, algo de desgaste | — |
| Teléfono | De escritorio con pantallita, luz de buzón, cable en espiral | en reposo, sonando (vibra y parpadea), en llamada, buzón |
| Directorio | Hoja impresa pegada con cinta en la mampara | — |
| Libreta | Espiral, pasta de cartón, pestañas de colores | cerrada, abierta |
| Pizarrón | Blanco, pequeño, plumones y borrador | pendientes, tachados, post-its de favores |
| Calendario | De pared, mes a la vista, con logo de la planta | días con estrellas, hoy encerrado, sábado 7 marcado |
| Gafete | Credencial con foto genérica, nombre y número de empleado | — |
| Lonchera | Térmica, cierre | cerrada, abierta (comida del día) |
| Taza | Con logo de la planta (regalo de bienvenida) | llena, a medias, vacía |
| Reloj de pared | Visible arriba | hora del juego |
| Adornos | Foto, plantita, figurita, papeles, envolturas, clips | aumentan con favores *(D-16)* |
| Decoraciones de fecha | Globos y letrero (T0), calabaza (T3), papel picado y cempasúchil (T4) | por día |

## Estilo elegido: C · Estilizado limpio (D-08)

Sombreado suave, sombras suaves y reflejos sutiles; formas limpias con algo de detalle (bordes redondeados en objetos pequeños), paleta de oficina neutra con acentos cálidos. Referencias de sensación: *Not For Broadcast*, *Firewatch*.

- **Luz:** luz de oficina neutra del techo + lámpara de escritorio cálida + ventana que cambia de atardecer a noche durante el turno.
- **Materiales:** mate en mamparas y papel; satinado en escritorio y plásticos; pantalla emisiva sin reflejos.
- **Rendimiento:** es el estilo más pesado; presupuesto de 150 draw calls y medición en hardware real (Iris Xe/UHD 620) desde F3. Si no da 60 fps: menos sombras dinámicas, luz horneada y una opción de "calidad baja" en Ajustes.
- Los estilos A y B del spike se retiraron en F3-06; la escena solo tiene el estilo C (`src/scene/estilos.ts`).
- **Ventana:** en la pared del fondo, sobre las mamparas y a la izquierda del reloj: la sierra, la nave de la planta con su chimenea y el tanque de agua. Tarde (15:30) → atardecer (el sol se mete hacia las 18:20) → noche (luces de la nave, foco rojo de la chimenea, estrellas). La luz que entra, los reflejos y un poco la luz de oficina siguen la hora (`src/game/hora.ts`).
- **Lámpara:** foco cálido que apunta al escritorio; no ilumina el pizarrón.

Paleta base: gris claro de mampara, madera clara del escritorio, blanco cálido de pared, naranja de seguridad como acento, azul noche en la ventana al final del turno. Contraste AA en todas las capas DOM.

## Capas DOM (interfaz)

- **Monitor:** sistema operativo ficticio de la planta (barra superior con apps: Terminal, Tickets, Correo, Datos, Red). Terminal con **JetBrains Mono** (OFL, D-25), tamaño ajustable. Interfaz y texturas con **Atkinson Hyperlegible** (OFL, D-25, pensada para baja visión). Las dos van empaquetadas: se ven igual en cualquier sistema.
- **Teléfono (D-28 A):** la escena se oscurece un poco; el aparato de plástico oscuro (pantallita verde con letra mono, teclas claras con letras, "Llamar" verde y "Colgar" rojo) y a su lado el directorio impreso pegado con dos tiras de cinta. La llamada se ve en la tarjeta de D-22, a la derecha.
- **Libreta (D-29 B):** abierta a dos páginas con la espiral al centro y pestañas de colores al costado (Historia amarilla, Comandos verde, Pistas salmón, Mis notas azul); hojas con renglones azules y margen rojo; **Patrick Hand** (OFL) para lo que escribe el juego y letra normal para las notas del jugador; la escena se oscurece un poco detrás.
- **Visitas (D-30 B):** figura de bloques (cápsulas y esferas, sin rasgos) con la ropa de su departamento: Don Chuy overol azul y gorra naranja, Karla bata blanca y chongo, Treviño saco gris y corbata roja, Eduardo camisa verde, el comedor mandil rosa, vigilancia uniforme azul marino y gorra. Se asoma sobre la mampara derecha; su diálogo va en subtítulo con opciones de respuesta.
- **Globo de pensamiento:** nube distinta a la de diálogo, cerca del centro inferior.
- **Subtítulos:** abajo al centro, fondo semitransparente configurable.

## Movimiento

- Transiciones de acercamiento ≈ 600 ms con aceleración y frenado suaves; nada de rebotes.
- Animaciones cortas con propósito: tachar pendiente (plumón rojo, ≈ 0.8 s), arrugar post-it y lanzarlo al bote del piso, escribir en la libreta, teléfono sonando. Todas se apagan con "reducir movimiento".
- Ambientales sutiles: polvo en la luz de la ventana, gente pasando a lo lejos.
- Todo respeta "reducir movimiento".

## Audio (D-19: escaso, nunca saturado)

**El silencio es lo normal.** El jugador está concentrado frente a la computadora; el sonido solo aparece cuando aporta algo.

| Regla | Valor |
|---|---|
| Ruido continuo de fondo (aire acondicionado, murmullo de oficina) | **No hay** |
| Eventos ambientales (impresora, teléfono de otro escritorio, montacargas, voceo, puerta) | Como máximo uno cada 2–4 min (al azar con la semilla), de 1–3 s, a bajo volumen y "a lo lejos" (posicional) |
| Simultaneidad | Nunca dos eventos ambientales a la vez; ninguno mientras hay un diálogo o una llamada |
| Interacción | Solo en acciones con significado (descolgar, abrir libreta, tachar pendiente, objetivo cumplido); ≤ 300 ms y discretos |
| Teclear en la terminal | Sin sonido por defecto (opción en Ajustes) |
| Historia | Raros y claros: alarma de fuga a las 23:59, `wall`, llamada de número desconocido |
| Voces | Murmullo corto por personaje mientras aparece el texto + subtítulos siempre |
| Música | Ninguna de fondo; solo el radio opcional del tiempo extra, si el jugador lo prende |
| Ajustes | Volumen general, efectos, ambiente (apagable) y voces; "modo silencio" |

Generación (F4-10): todo se sintetiza con Web Audio en `src/ui/audio.ts` (sin archivos ni licencias): clic al abrir un objeto, timbre de tu teléfono, plumón y lápiz, dos notas al cumplir un objetivo, balbuceo por personaje (tono de voz propio, sílabas según el largo del globo) y los cinco ambientales "a lo lejos" (filtrados y a un lado). Si algún día un ambiental necesita un archivo real, será CC0 y se registra en `docs/diseno/assets.md`. Cada ambiental sale con su subtítulo arriba al centro ("[Se cierra una puerta al fondo.]"), también en modo silencio.

## Referencias de juegos (por mecánica, no para copiar su aspecto)

| Juego | Qué tomamos |
|---|---|
| *Five Nights at Freddy's* | Jugador sentado; la vista gira según el cursor; clic en el monitor para usarlo |
| *Not For Broadcast* | Trabajo en un escritorio con controles diegéticos mientras la historia ocurre alrededor |
| *Welcome to the Game* | Primera persona frente a una computadora; acercarse a la pantalla para "hackear" |
| *Papers, Please* | Estructura por días, rutina laboral, calificación diaria, presión moral |
| *Death and Taxes* | Escritorio que se llena de objetos y adornos conforme avanzas |
| *Hacknet* | Historia contada con comandos reales de terminal |
| *Her Story* | Investigar una base de datos para reconstruir la verdad (paralelo con SQL) |
| *Return of the Obra Dinn* / *Outer Wilds* | Libreta/bitácora que se llena sola con lo que descubres |
| *Firewatch* | Alguien al otro lado de la línea que te acompaña y orienta (Eduardo) |
| *Disco Elysium* | La voz interior del protagonista (globo de pensamiento) |
| *Keep Talking and Nobody Explodes* | Interacción con objetos sobre una mesa y consulta de un manual |
| *Unpacking* | Contar historia con objetos y desorden |

## Licencias

Todo asset en `docs/diseno/assets.md` con fuente, autor y licencia (CC0, CC-BY con atribución en Créditos, OFL para fuentes). Prohibido usar assets sin licencia clara o generados a partir de obras protegidas.
