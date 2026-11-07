# Brief para Claude Design — Turno Nocturno

> Documento para pegar o adjuntar en Claude Design. Es autocontenido: no hace falta leer el resto del repo. Contexto ampliado: `docs/plan/02-trama.md` (historia) y `docs/plan/04-mecanicas.md` (mecánicas).

## 1. Producto

Juego web **móvil primero** para aprender **Linux, SQL y redes desde cero**. El jugador es el nuevo técnico de sistemas del turno vespertino de una planta de manufactura ficticia en el desierto fronterizo ("Industrias Ocotillo, Planta 7"). Su antecesora dejó notas escondidas en el servidor: alguien altera los datos de calidad cada noche a las 23:59. El jugador avanza la historia usando comandos reales en una terminal simulada, consultas SQL y diagnóstico de red.

- **Público:** principiantes absolutos 16+ y técnicos de manufactura que quieren pasar a TI. Nunca han visto una terminal.
- **Sesión típica:** 3–8 minutos en el teléfono, en vertical, con una mano, a menudo con el teclado abierto.
- **Idioma:** español de México. La salida de los comandos se muestra en inglés (como en Linux real) y debajo una "glosa" en español.
- **Sensación buscada:** estar en la sala de servidores de una planta de noche. Concentración, misterio tranquilo, humor de planta. **No** el cliché de hacker con capucha, código Matrix ni neón saturado.

## 2. Plataformas y tamaños de lienzo

| Prioridad | Dispositivo | Lienzo |
|---|---|---|
| 1 | Android gama media | **360×740** y **412×915** |
| 1 | iPhone | **390×844** |
| 2 | Escritorio | **1280×800** (terminal + panel lateral en dos columnas) |
| 3 | Tablet | 820×1180 |

Orientación vertical en móvil. Cada pantalla de juego se entrega en **dos estados: teclado cerrado y teclado abierto** (el teclado del sistema ocupa ≈ 40–45 % de la altura; simularlo con un bloque gris).

## 3. Restricciones duras

1. **El input de comandos nunca queda oculto por el teclado.** Con teclado abierto: input + barra de accesos pegados encima del teclado; la salida de la terminal ocupa lo que sobra y muestra la última línea.
2. Objetivos táctiles **≥ 44×44 px**; separación ≥ 8 px entre controles adyacentes.
3. Texto del input **≥ 16 px** (evita el zoom automático de iOS). Texto de terminal mínimo 14 px, ajustable.
4. Nada depende de hover. Las acciones principales quedan en la mitad inferior (alcance del pulgar).
5. Respetar áreas seguras (notch, barra de gestos).
6. **WCAG 2.1 AA:** contraste 4.5:1 en texto, 3:1 en componentes; el estado (éxito/error/bloqueado) siempre con ícono o texto además del color; foco visible.
7. `prefers-reduced-motion`: todas las animaciones tienen variante sin movimiento.
8. Tipografía: máximo 2 familias (una monoespaciada para terminal/código, una sans para UI), disponibles en Google Fonts, con soporte de acentos y ñ.
9. Sin imágenes pesadas: el juego debe cargar rápido en 4G. Ilustraciones como SVG o pocas imágenes optimizadas.

## 4. Dirección visual — explorar 3 y elegir

| Dirección | Idea | Paleta sugerida (orientativa) |
|---|---|---|
| **A · Terminal industrial** | Monitor de fósforo ámbar en un cuarto de control; tipografía mono protagonista; marcos tipo panel de máquina | Fondo casi negro cálido, ámbar, verde apagado, acentos naranja |
| **B · Señalética de planta** | Lenguaje de seguridad industrial: franjas amarillo/negro, etiquetas de equipo, numeración de líneas | Gris acero, amarillo de seguridad, blanco, rojo de paro |
| **C · Noche en el desierto** | Ciudad fronteriza de noche: azul profundo, arena, luz de lámpara de sodio | Azul noche, arena, naranja sodio, cian frío para datos |

Para cada dirección entregar la **pantalla de juego (terminal)** con teclado abierto y cerrado y la **pantalla de briefing**. Modo oscuro primero; también tema claro y **alto contraste**.

## 5. Tokens requeridos (nombres de rol, los valores los define el diseño)

**Color:** `bg`, `surface`, `surface-raised`, `border`, `text`, `text-muted`, `text-inverse`, `accent`, `accent-contrast`, `success`, `warning`, `danger`, `info`, `focus-ring`, `locked`.
**Terminal:** `term-bg`, `term-fg`, `term-prompt` (usuario@host), `term-path`, `term-stderr`, `term-gloss` (glosa en español), `term-system` (mensajes del juego), `term-story` (mensajes narrativos tipo `wall`), `term-selection`, `term-cursor`.
**Personajes:** un color de identidad por personaje (Don Chuy, R., Karla, Treviño, Delta, Sistema).
**Tipografía:** familias `mono` y `sans`; escala (`xs` … `2xl`); tamaños de terminal en 4 pasos (S/M/L/XL).
**Espaciado:** escala de 4 px. **Radios**, **elevación** (2–3 niveles), **duraciones** de animación (rápida ≤ 150 ms, media ≤ 300 ms) y curvas.

Formato de entrega: CSS custom properties (y JSON si es posible).

## 6. Pantallas

| # | Pantalla | Contenido | Estados a diseñar |
|---|---|---|---|
| 1 | **Título** | Logo/título, Continuar, Nueva partida, Ajustes | con/sin partida guardada |
| 2 | **Onboarding** (≤ 3 pasos) | Nombre del jugador; cómo se usa la barra de accesos y las pistas | — |
| 3 | **Mapa de turnos** | Lista/línea de tiempo de 13 turnos ("Turno 0 · Inducción"), progreso, estrellas; al tocar, sus misiones | bloqueado · disponible · en curso · completado |
| 4 | **Briefing** | Diálogo con avatar del personaje, 2–4 burbujas, botón "Empezar turno/misión" | burbuja escribiéndose (opcional), saltar |
| 5 | **Juego — Terminal** *(la más importante)* | Encabezado (turno, misión, hora del juego 15:30–00:00, objetivos 1/3), salida de terminal, input con prompt, barra de accesos, chips de autocompletado, navegación entre apps | teclado cerrado · **teclado abierto** · comando corriendo · salida larga · error con glosa · mensaje entrante · objetivo cumplido · `wall` (broadcast) |
| 6 | **Objetivos** (hoja inferior) | Lista de objetivos; campo de respuesta en los que piden respuesta | pendiente · cumplido · respuesta incorrecta |
| 7 | **Pistas** (hoja inferior) | 3 niveles; confirmar antes de revelar; nivel 3 con botón "Insertar en la terminal" | ninguna vista · nivel 1 · 2 · 3 |
| 8 | **Juego — Datos (SQL)** | Editor multilínea, chips de palabras clave (`SELECT`, `FROM`, `WHERE`, `ORDER BY`, `GROUP BY`, `JOIN`…), chips de tablas/columnas, botón Ejecutar, resultados en tabla con scroll horizontal y encabezado fijo, vista de esquema | cargando motor SQL (primera vez) · sin resultados · error SQL · resultados largos · teclado abierto |
| 9 | **Juego — Red** | Mapa de nodos con conexiones; tocar nodo → tarjeta con IP, nombre, puertos/servicios; zoom/pan táctil | nodo desconocido · descubierto · con servicios · asegurado · sospechoso |
| 10 | **Bitácora** | Conceptos aprendidos por dominio (Linux/SQL/Redes), detalle con explicación corta, ejemplos tocables, "Pruébalo en tu Linux real"; buscador; tarjetas de campo | vacía (inicio) · con contenido · detalle |
| 11 | **Mensajes** | Hilos por personaje, burbujas, adjuntos (archivo que aparece en el servidor) | no leído · leído · adjunto |
| 12 | **Misión completada** | Estrellas, XP, concepto aprendido (tarjeta), "tu solución" vs. una alternativa elegante, Siguiente | 1/2/3 estrellas · logro nuevo · subida de rango |
| 13 | **Fin de turno** | Resumen del turno, tarjeta de campo, avance de la historia | — |
| 14 | **Perfil / progreso** | Rango (Becario → Técnico → Técnico Sr. → Ingeniero → Ingeniero Sr. → Líder de Ingeniería), XP, logros, estadísticas | — |
| 15 | **Ajustes** | Tamaño de fuente de terminal, tema (oscuro/claro/alto contraste), reducir movimiento, vibración, sonido, glosas sí/no, personalizar barra de accesos, exportar/importar/reiniciar partida | — |
| 16 | **Modo Taller** | Terminal libre con lista de ejercicios | — |
| 17 | **Final** | Pantalla de desenlace (3 variantes: buena, media, mala) | — |
| 18 | **Estados globales** | Cargando, sin conexión, actualización disponible, error inesperado, confirmación "Restaurar misión" | — |

## 7. Componentes

`TerminalLine` (variantes: prompt+comando, stdout, stderr, glosa, sistema, historia/`wall`) · `CommandInput` · `AccessoryKeyBar` (teclas: Tab, ↑, ↓, `|`, `/`, `-`, `~`, `*`, `>`, `"`, `'`, `.`, Ctrl+C) · `SuggestionChips` · `AppSwitcher` (Terminal, Datos, Red, Bitácora, Mensajes; con insignia de no leídos y estado bloqueado) · `MissionHeader` · `ObjectiveItem` · `AnswerField` · `HintCard` · `BottomSheet` · `DialogueBubble` + `Avatar` · `MessageThreadItem` · `Toast` (objetivo cumplido, mensaje nuevo) · `Modal` de confirmación · `SqlEditor` · `KeywordChip` · `ResultsTable` · `SchemaTree` · `NetworkNode` · `NetworkEdge` · `NodeDetailCard` · `ShiftCard` · `MissionRow` · `StarRating` · `XpBar` · `RankBadge` · `AchievementBadge` · `ConceptCard` · `FieldCard` · `Button` (primario, secundario, fantasma, peligro) · `IconButton` · `Switch` · `Stepper` (tamaño de fuente) · `EmptyState` · `LoadingState` · `ErrorBanner`.

Cada componente con estados: normal, presionado, foco, deshabilitado/bloqueado y, si aplica, cargando y error.

## 8. Contenido real para los mockups

Usar este texto (no lorem ipsum).

**Terminal (Turno 0, misión 2):**
```
becario@srv-sistemas:~$ ls
LEEME.txt  tickets
becario@srv-sistemas:~$ cat leeme.txt
cat: leeme.txt: No such file or directory
↳ No existe "leeme.txt" aquí. Linux distingue mayúsculas: ¿será LEEME.txt?
becario@srv-sistemas:~$ cat LEEME.txt
Para quien me reemplace:

1. El usuario es "becario". La contraseña te la da Don Chuy.
2. Los tickets llegan a ~/tickets/. Uno por archivo.
3. Si la impresora de la Línea 2 falla, casi siempre es el cable.

Y una cosa más: no confíes en los números del turno nocturno.
Revisa todo dos veces.
— R.
becario@srv-sistemas:~$ ▌
```

**Mensaje `wall` (cierre del Turno 4):**
```
Broadcast message from delta_svc@mantto-delta (pts/0) (Fri 23:58):

¿Quién eres, becario?
```

**Briefing:**
- Don Chuy: "Ese LEEME lo dejó la ingeniera Salcido el día que se fue. Nadie lo ha abierto."
- Don Chuy: "Yo no le sé a esas cosas. Ábrelo tú y me dices qué dice."

**Objetivos:** "Lee el contenido de LEEME.txt" (cumplido) · "Ticket T-1042: ¿con qué inicial firmó la ingeniera anterior?" (pendiente, con campo de respuesta).

**Pista nivel 2:** "Hay un comando corto que muestra el contenido completo de un archivo. Su nombre viene de 'concatenate'."

**SQL (Turno 3):**
```sql
SELECT lote, estacion, resultado, fecha_hora
FROM inspecciones
WHERE lote = 4471 AND estacion = 'FUGA'
ORDER BY fecha_hora DESC
LIMIT 5;
```
| lote | estacion | resultado | fecha_hora |
|---|---|---|---|
| 4471 | FUGA | PASA | 2026-11-05 23:59:12 |
| 4471 | FUGA | PASA | 2026-11-05 23:41:03 |
| 4471 | FUGA | PASA | 2026-11-05 23:22:47 |
| 4471 | FUGA | PASA | 2026-11-05 22:58:30 |
| 4471 | FUGA | PASA | 2026-11-05 22:31:19 |

Error SQL de ejemplo: `Parse error: near "FORM": syntax error` + glosa "¿Quisiste decir FROM?".

**Red (Turno 4):** nodos `srv-sistemas 10.7.1.10` (tú), `gw-planta 10.7.1.1`, `impresora-l2 10.7.2.40` (no responde → luego sí), `plc-l3 10.7.2.30`, `est-fuga-l3 10.7.2.32`, `mantto-delta 10.7.3.99` (sospechoso, entra por VPN 10.7.3.1).

**Personajes (avatares):**
- **Don Chuy** — supervisor de mantenimiento, ~60 años, gorra y chaleco reflejante, bigote.
- **Ing. Rebeca Salcido ("R.")** — ex ingeniera de sistemas, ~35 años; aparece sobre todo como notas/firma; avatar puede ser una silueta o inicial "R." hasta el Turno 9.
- **Ing. Karla Ibáñez** — jefa de Calidad, ~40 años, bata y gafete.
- **Lic. Mauricio Treviño** — gerente de planta, ~50 años, camisa formal, sonrisa de junta.
- **Delta** — contratista; solo un ícono de usuario genérico/terminal (nunca se ve su cara).
- **Sistema** — mensajes del juego.

Estilo de avatar a definir con la dirección visual (ilustración plana, línea, o pixel art sobrio). Todos ficticios.

## 9. Movimiento e interacción

- Animaciones cortas y con propósito: aparición de líneas de salida (sin efecto de "tecleo" lento en la salida de comandos; opcional y saltable solo en mensajes narrativos), objetivo cumplido (≤ 300 ms), transición entre apps, hojas inferiores.
- Mantener presionada una línea de comando de la salida → copiar al input.
- Tocar un ejemplo en la Bitácora o la pista 3 → inserta el comando en el input (no lo ejecuta).
- Deslizar hacia abajo cierra hojas inferiores.
- Vibración ligera opcional al cumplir objetivo.

## 10. Entregables esperados de Claude Design

1. Exploración de las 3 direcciones (pantallas 4 y 5) → elegir una.
2. Tokens (CSS custom properties) para tema oscuro, claro y alto contraste.
3. Biblioteca de componentes de §7 con estados.
4. Las 18 pantallas de §6 a 390×844; las pantallas 5 y 8 también a 360×740 y 412×915, con teclado abierto y cerrado; la 5 también a 1280×800.
5. Prototipo interactivo del loop: Título → Mapa → Briefing → Terminal (teclear y ver salida) → Objetivo cumplido → Misión completada.
6. Exportación/handoff a Claude Code (componentes React o HTML/CSS con tokens) para implementar en `src/ui/`.

## 11. Fuera de alcance del diseño

Landing page de marketing, ícono de tienda de apps, materiales impresos, versión en inglés.
