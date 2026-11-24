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

## Estilos a explorar (D-08)

| | A · Low-poly cálido | B · Retro PS1 | C · Estilizado limpio |
|---|---|---|---|
| Idea | Formas simples, colores planos, luz cálida de lámpara | Baja resolución, pixeles grandes, dithering, paleta limitada | Sombreado suave, sombras y oclusión ambiental, brillo en pantallas |
| Referencias de sensación | *Unpacking*, *A Short Hike* (en 3D) | *Buckshot Roulette*, *Iron Lung* | *Not For Broadcast*, *Firewatch* |
| Legibilidad del texto | Alta (texto en DOM nítido) | El mundo se pixelea; las capas DOM se mantienen nítidas | Alta |
| Rendimiento | El mejor | Muy bueno (render a baja resolución) | El más pesado (postprocesado) |
| Riesgo | Verse genérico | Cansar la vista en sesiones largas | Tiempo de arte mayor |

Paleta base (común): beige de mampara, gris acero, madera clara de escritorio, naranja de seguridad como acento, azul noche en la ventana al final del turno. Contraste AA en todas las capas DOM.

## Capas DOM (interfaz)

- **Monitor:** sistema operativo ficticio de la planta (barra superior con apps: Terminal, Tickets, Correo, Datos, Red). Terminal con fuente monoespaciada legible (JetBrains Mono o IBM Plex Mono, OFL), tamaño ajustable.
- **Teléfono:** pantallita del aparato + directorio + teclado numérico; subtítulos de la llamada abajo de la pantalla.
- **Libreta:** hojas con renglones, letra manuscrita para entradas automáticas (fuente OFL tipo manuscrita legible) y letra normal para notas del jugador.
- **Diálogos de visitas:** globo con nombre del personaje y opciones de respuesta.
- **Globo de pensamiento:** nube distinta a la de diálogo, cerca del centro inferior.
- **Subtítulos:** abajo al centro, fondo semitransparente configurable.

## Movimiento

- Transiciones de acercamiento ≈ 600 ms con aceleración y frenado suaves; nada de rebotes.
- Animaciones cortas con propósito: tachar pendiente, arrugar post-it, escribir en la libreta, teléfono sonando.
- Ambientales sutiles: polvo en la luz de la ventana, gente pasando a lo lejos.
- Todo respeta "reducir movimiento".

## Audio

| Capa | Ejemplos |
|---|---|
| Ambiente continuo | Aire acondicionado, oficina lejana, teclados, máquinas de la planta a lo lejos |
| Eventos ambientales | Impresora, teléfono de otro escritorio, montacargas, voceo ("Mantenimiento, favor de reportarse a Línea 3"), puerta |
| Interacción | Teclas (al teclear en la terminal), clic de objetos, abrir libreta, lápiz, plumón, descolgar/colgar, tono de marcado |
| Historia | Alarma de la estación de fuga a las 23:59, `wall`, llamada de número desconocido |
| Voces | Según D-19: balbuceo por personaje + subtítulos |
| Música | Radio opcional con música libre de derechos; sin música de fondo constante |

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
| *Firewatch* | Una compañera al otro lado de la línea que te acompaña y orienta (Lupita) |
| *Disco Elysium* | La voz interior del protagonista (globo de pensamiento) |
| *Keep Talking and Nobody Explodes* | Interacción con objetos sobre una mesa y consulta de un manual |
| *Unpacking* | Contar historia con objetos y desorden |

## Licencias

Todo asset en `docs/diseno/assets.md` con fuente, autor y licencia (CC0, CC-BY con atribución en Créditos, OFL para fuentes). Prohibido usar assets sin licencia clara o generados a partir de obras protegidas.
