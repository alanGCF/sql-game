# Glosario del dominio

Términos con significado específico en este proyecto. Úsalos igual en docs, código (en inglés entre paréntesis) y contenido.

| Término | Código | Definición |
|---|---|---|
| **Turno** | `shift` | Capítulo del juego = un día laboral 15:30–00:00 en el reloj de juego. Numerados 0–12. |
| **Misión** | `mission` | Unidad jugable de 3–8 min con 1–3 objetivos y ≤ 2 conceptos nuevos. ID `tN-mNN-slug`. |
| **Ticket** | `ticket` | Tipo de misión: trabajo cotidiano donde se aprende un concepto. |
| **Investigación** | `investigation` | Tipo de misión: se aplica el concepto al misterio. |
| **Objetivo** | `objective` | Condición verificable (predicado) dentro de una misión. |
| **Predicado** | `predicate` | Regla que el motor evalúa sobre el estado del mundo o una respuesta (`archivo_leido`, `respuesta`, `consulta_resultado`…). |
| **Respuesta** | `answer` | Valor que el jugador escribe en el campo de respuesta de un objetivo; se normaliza antes de comparar. |
| **Pista** | `hint` | Ayuda de 3 niveles: empujón, concepto, solución. |
| **Concepto** | `concept` | Unidad del currículo con ID `dominio.área.concepto`. |
| **Bitácora** | `logbook` | App del juego con los conceptos aprendidos, ejemplos y tarjetas de campo. |
| **Tarjeta de campo** | `field card` | Resumen de comandos/consultas aprendidos en un turno. |
| **Glosa** | `gloss` | Explicación en español que aparece debajo de una salida o error real. |
| **Mundo** | `world` | Estado completo simulado: hosts, VFS, red, procesos, base de datos, banderas. |
| **Mundo base** | `base world` | Estado inicial de un turno, definido en `content/mundo/`. |
| **Parche de mundo** | `world patch` | Cambio que una misión aplica al cargar (archivo, permiso, host, SQL…). |
| **Bandera** | `flag` | Booleano de historia (`respaldo_r`, `karla_aliada`) que afecta eventos y finales. |
| **Host** | `host` | Equipo simulado de la red de la planta (`srv-sistemas`, `mantto-delta`…). |
| **Superficie de comandos** | `command surface` | Lista cerrada de comandos y banderas que el shell implementa. |
| **Golden** | `golden` | Salida capturada de un comando real que sirve de referencia de fidelidad. |
| **Solución / alternativa / contraejemplo** | `solution / alternative / counterexample` | Secuencias de pasos que el harness ejecuta para probar que la misión se resuelve, que acepta otros caminos y que no se resuelve con atajos. |
| **Reloj de juego** | `game clock` | Hora simulada; avanza con comandos y eventos, no con el tiempo real. |
| **Restaurar misión** | `reset mission` | Regresar el mundo al estado de inicio de la misión actual. |
| **Modo Taller** | `workshop` | Práctica libre con ejercicios generados con semilla. |
