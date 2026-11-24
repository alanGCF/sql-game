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
| D-08 | Estilo visual 3D | **C · Estilizado limpio** (ver `docs/diseno/direccion-arte.md`) |
| D-13 | Compañero que da pistas | **Eduardo Téllez**, Sistemas Sr., ext. 214 |
| D-14 | Paciencia del compañero | Recomendación aceptada: pedir pista **nunca** gasta paciencia; platicar sí |
| D-15 | Código de partida | Recomendación aceptada: número de empleado impreso en el gafete y "Checar entrada" en el menú |
| D-16 | Recompensa de favores | Recomendación aceptada: XP + adorno nuevo en el escritorio |
| D-17 | Dónde se responden las preguntas | Recomendación aceptada: tickets en la app Tickets; hallazgos en la libreta |
| D-18 | Retención de partidas en el servidor | **2 meses** (60 días sin actividad) |
| D-19 | Voces y sonido | Recomendación aceptada: balbuceo por personaje + subtítulos. Además: **sonido escaso**, solo de vez en cuando, nunca ruido constante (reglas en `direccion-arte.md` §Audio) |
| D-20 | Fechas especiales | Recomendación aceptada, marcadas en el calendario, con adornos en el escritorio y comentarios de los compañeros; nada afecta la historia (`02-trama.md` §Fechas especiales) |

## Abiertas

| ID | Decisión | Opciones | Recomendación | Bloquea |
|---|---|---|---|---|
| **D-05** | Nombre del juego | Propuestos por el usuario: Código Sombra · Archivo Cero · Operación Medianoche · Huellas en el Sistema · Rastro en el Log · Desde el Cubículo · Consulta Nocturna | **Rastro en el Log** (alternativa: Huellas en el Sistema). Pendiente de confirmar; nombre clave mientras tanto: Planta 7 | menú, créditos |
