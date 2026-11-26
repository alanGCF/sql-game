# Decisiones de funcionalidad y estética

Las decisiones de **código** las toma el agente (quedan en `docs/decisiones/adr.md`). Aquí van las de **funcionalidad y estética**, que decide el usuario. Cada una trae recomendación.

## Decididas

| ID | Decisión | Respuesta del usuario |
|---|---|---|
| D-01 | Ambientación | Planta 7 de Industrias Ocotillo, misterio de datos de calidad |
| D-02 | Público | Principiantes 16+ y técnicos de manufactura |
| D-03 | Motor SQL | SQLite (`sql.js`) |
| D-04 | Salida de comandos | Inglés real + glosa en español |
| D-06 | Licencia | Gratis; código MIT, contenido CC BY-NC |
| D-07 | Backend | Aceptó backend en el futuro. **Actualizado:** el código de partida lo requiere ya en v1; el agente eligió Fastify + PostgreSQL en Railway (ADR-010) |
| D-09 | Pistas | Solo afectan estrellas |
| D-10 | Sonido | **Sí** quiere sonidos |
| D-11 | Hosting | Railway, plan Hobby |
| D-12 | R. | Reaparece desde T10 y ayuda en el final |
| — | Plataforma | Escritorio primero; móvil después (v2) |
| — | Perspectiva | Primera persona sentado en un cubículo 3D, cámara hacia el cursor |
| — | Calendario | T0 = mar 27 oct, T1 = mié 28 oct, último turno vie 13 nov, final lun 16 nov, tiempo extra opcional sáb 7 nov, solo lunes a viernes |
| — | Pistas | Las da un compañero(a) del departamento por teléfono |
| — | Favores | Misiones secundarias 1–2 misiones después del tema, sin afectar la historia |
| — | Libreta | Física, automática + notas propias, sin copiar/pegar |
| — | Código de partida | Se genera al empezar; continuar desde el menú |
| — | Fuera de alcance | Globo de pensamiento "no sé qué haga esto, mejor no le doy Enter" |
| — | Ramas | Solo `main` y `develop` |
| D-05 | Nombre del juego | **Rastro en el Log** (la planta de la historia sigue siendo Industrias Ocotillo, Planta 7) |
| D-08 | Estilo visual 3D | **C · Estilizado limpio** (ver `docs/diseno/direccion-arte.md`) |
| D-13 | Compañero que da pistas | **Eduardo Téllez**, Sistemas Sr., ext. 214 |
| D-14 | Paciencia del compañero | Recomendación aceptada: pedir pista **nunca** gasta paciencia; platicar sí |
| D-15 | Código de partida | Recomendación aceptada: número de empleado impreso en el gafete y "Checar entrada" en el menú |
| D-16 | Recompensa de favores | Recomendación aceptada: XP + adorno nuevo en el escritorio |
| D-17 | Dónde se responden las preguntas | Recomendación aceptada: tickets en la app Tickets; hallazgos en la libreta |
| D-18 | Retención de partidas en el servidor | **2 meses** (60 días sin actividad) |
| D-19 | Voces y sonido | Recomendación aceptada: balbuceo por personaje + subtítulos. Además: **sonido escaso**, solo de vez en cuando, nunca ruido constante (reglas en `direccion-arte.md` §Audio) |
| D-20 | Fechas especiales | Recomendación aceptada, marcadas en el calendario, con adornos en el escritorio y comentarios de los compañeros; nada afecta la historia (`02-trama.md` §Fechas especiales) |
| D-21 | Look de la app Tickets | **A · mesa de ayuda corporativa** (clara, lista a la izquierda y detalle con respuesta a la derecha) |
| D-22 | Diálogos, llamadas y visitas | **Llamadas: tarjeta a un lado (C)** con iniciales, nombre y extensión. **Todo lo demás: subtítulo abajo (A)** con el nombre y el **departamento** de quien habla (nunca la palabra "visita") |
| D-28 | Vista del teléfono (F4-01) | **A · aparato y hoja de papel**: la escena se oscurece un poco; el teléfono de plástico oscuro con pantalla verde y teclas con letras, y a su lado el directorio impreso pegado con cinta. La llamada va en la tarjeta de D-22 |
| D-27 | Entrega del número de empleado al empezar | **A + C**: tarjeta de Recursos Humanos con el número grande, "Anótalo en un papel" y "Ya lo anoté" (los diálogos esperan); además un post-it con el número en el monitor y Eduardo lo menciona en su primer diálogo. El gafete del escritorio trae nombre y número enmascarado (D-26) |
| D-26 | Computadoras compartidas (salones) | **C**: botón "No soy yo: olvidar esta partida en esta computadora" (con confirmación; la partida sigue en el servidor con su número) y el gafete muestra solo los últimos 4 caracteres del número, salvo con "Mostrar mi número" |
| D-25 | Fuentes empaquetadas (OFL) | **JetBrains Mono** para la terminal y **Atkinson Hyperlegible** para la interfaz y las texturas, empaquetadas (elegidas viendo las muestras) |
| D-24 | Límites de la API para un salón detrás de una sola IP | **Se quedan como están**: 10 partidas nuevas por hora por IP (o /56 de IPv6), 60 lecturas/guardados por minuto, 20 códigos inexistentes por hora |
| D-23 | Menú de inicio | **C · tu gafete de empleado** sobre la escena desenfocada: "Primer día de trabajo", "Checar entrada con mi número" (el número de empleado es el código de partida, D-15), ajustes y créditos |

## Abiertas

### D-29 · Libreta: disposición y letra manuscrita (F4-05)

Pestañas Historia, Comandos, Pistas y Mis notas sobre papel con renglones. Lo que escribe el juego va a mano; tus notas, en letra normal.

- **Disposición A · libreta de reportero:** una hoja grande con la espiral arriba y las pestañas encima.
- **Disposición B · libreta abierta:** dos páginas con la espiral al centro y las pestañas al costado; a la izquierda el índice o la nota nueva, a la derecha la página. *(Recomendada: aprovecha la pantalla ancha.)*
- **Letra:** Patrick Hand *(recomendada, la más legible en números y rutas)*, Kalam o Caveat (las tres OFL).

Bloquea: cerrar F4-05 (capturas aprobadas). Mientras tanto queda B con Patrick Hand.
