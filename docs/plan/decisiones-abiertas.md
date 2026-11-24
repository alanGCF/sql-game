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
| D-08 (parte) | Herramienta de diseño | Respondido por el agente: seguir en Claude Code (ver ADR-016); falta elegir estilo |

## Abiertas

| ID | Decisión | Opciones | Recomendación | Bloquea |
|---|---|---|---|---|
| **D-05** | Nombre del juego | "Fuga" (doble sentido: prueba de fuga y fuga de información) · "23:59" · "Lote {{n}}" · "Planta 7" · "Turno Vespertino" · otro | **"Fuga"** o **"23:59"**; nombre clave mientras tanto: Planta 7 | menú, créditos |
| **D-08** | Estilo visual 3D | A "Low-poly cálido" · B "Retro PS1" · C "Estilizado limpio" (capturas del spike F0-07) | Decidir viendo capturas | F3 |
| **D-13** | Compañero(a) que da pistas | Lupita Rentería (técnica Sr., 29) · Memo Saldívar (técnico Sr., 31) · otro | **Lupita** (ya escrita en los docs, fácil de cambiar) | contenido T0 |
| **D-14** | ¿Lupita deja de contestar si la llamas mucho? | (a) pedir pista nunca gasta paciencia; platicar sí · (b) todo gasta paciencia | **(a)**: si deja de contestar, el jugador se atora | F4 |
| **D-15** | Código de partida como número de empleado | (a) impreso en tu gafete y "Checar entrada" en el menú · (b) código genérico en el menú | **(a)**: diegético y fácil de recordar dónde está | F4 |
| **D-16** | Recompensa de favores | (a) XP + adorno nuevo en tu escritorio · (b) solo XP | **(a)**: el escritorio cuenta tu historia | F4 |
| **D-17** | Dónde se responden las preguntas | (a) tickets en la app Tickets; hallazgos en la libreta · (b) todo en la libreta | **(a)** | F2-03 |
| **D-18** | Retención de partidas en el servidor | 6 · 12 · 24 meses sin actividad | **12 meses** | F4 |
| **D-19** | Estilo de las voces | (a) balbuceo por personaje + subtítulos · (b) sin voz, solo subtítulos y sonido de teléfono · (c) voces grabadas | **(a)**: barato y con personalidad | F4 |
| **D-20** | Fechas especiales | Halloween (T3), altar de muertos (T4), lunes 16 festivo con citación | **Todas**: dan vida a la oficina | contenido |
