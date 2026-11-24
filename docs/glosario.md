# Glosario del dominio

Términos con significado específico en este proyecto. Úsalos igual en docs, código (en inglés entre paréntesis) y contenido.

| Término | Código | Definición |
|---|---|---|
| **Turno** | `shift` | Un día laboral (15:30–00:00 en el reloj de juego). T0 (bienvenida) a T13 (vie 13 nov), más TE y el epílogo. |
| **Tiempo extra** (TE) | `overtime` | Turno opcional del sábado 7 de noviembre con 3–4 favores de repaso. |
| **Epílogo** | `epilogue` | Lunes 16 de noviembre: se ve el final; no hay comandos. |
| **Misión** | `mission` | Unidad jugable de 3–8 min con 1–3 objetivos y ≤ 2 conceptos nuevos. ID `tN-mNN-slug`. |
| **Favor** | `favor` | Misión secundaria de repaso (tipo *good first issue*), opcional, 1–2 misiones después del tema; no afecta la historia. ID `tN-fNN-slug`. |
| **Ticket** / **Investigación** | `ticket` / `investigation` | Tipos de misión: aprender en un problema cotidiano / aplicar al misterio. |
| **Objetivo** | `objective` | Condición verificable; se muestra como **pendiente** en el pizarrón. |
| **Predicado** | `predicate` | Regla que el motor evalúa sobre el mundo o una respuesta. |
| **Respuesta** | `answer` | Lo que el jugador teclea en un ticket o en la libreta; se normaliza y se compara con el valor calculado del mundo. |
| **Pista** | `hint` | Ayuda de 3 niveles que da Eduardo por teléfono. |
| **Paciencia** | `patience` | Cuántas llamadas aguanta un contacto en un turno antes de dejar de contestar. |
| **Rumor** | `rumor` | Charla de ambiente o dirección de la historia; nunca resuelve un objetivo. |
| **Visita** | `visit` | Alguien se acerca al cubículo (historia, favor o ambiente). |
| **Libreta** | `notebook` | Objeto con pestañas Historia, Comandos, Pistas y Mis notas; no se puede copiar ni pegar. |
| **Pizarrón** | `whiteboard` | Pendientes del turno y post-its de favores. |
| **Calendario** | `calendar` | Avance de la partida y calificación por día. |
| **Gafete** | `badge` | Muestra el número de empleado = código de partida *(D-15)*. |
| **Código de partida** | `save code` | 12 caracteres que identifican la partida en el servidor; permite continuar en otra computadora. |
| **Checkpoint** | `checkpoint` | Momento en que la partida se sube al servidor (fin de misión, favor o turno). |
| **Semilla** | `seed` | Número por partida que decide las variables. |
| **Variable de partida** | `run variable` | Dato que cambia con la semilla (`{{lote}}`, `{{ip_delta}}`…). |
| **Globo de pensamiento** | `thought` | Reacción del protagonista cuando la entrada está fuera de alcance; la línea no se ejecuta. |
| **Glosa** | `gloss` | Explicación en español bajo una salida o error real. |
| **Superficie de comandos** | `command surface` | Lista cerrada de comandos y banderas implementados. |
| **Vigencia** | `currency` | Que lo enseñado corresponda a la versión estable actual de las herramientas. |
| **Golden** | `golden` | Salida capturada del comando real en `debian:stable`. |
| **Mundo / mundo base / parche** | `world / base world / patch` | Estado simulado completo / inicial del turno / cambio que aplica una misión. |
| **Bandera** | `flag` | Booleano de historia que afecta eventos y finales. |
| **Vista acercada** | `focus view` | Cámara acercada a un objeto (monitor, teléfono, libreta, pizarrón, calendario). |
| **Restaurar misión** | `reset mission` | Volver el mundo al inicio de la misión actual. |
