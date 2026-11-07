---
name: nuevo-comando
description: Implementa o amplía un comando simulado del shell del juego (ls, grep, ping, sqlite3…) con fidelidad a Linux real. Usar al pedir "implementa el comando X", "agrega la bandera -n a grep", o al tocar src/engine/commands/.
---

# Nuevo comando

1. **Alcance:** revisa `docs/plan/03-curriculo.md` §Superficie de comandos. Solo se implementan las banderas listadas. Si piden una nueva, primero agrégala a esa tabla (y dilo en el reporte).
2. **Consulta la API** de librerías involucradas con Context7 si aplica (p. ej. `sql.js` para `sqlite3`).
3. **Captura el comportamiento real** en un directorio nuevo y vacío del scratchpad:
   - escribe `setup.sh` que crea el estado (archivos, permisos, contenido);
   - ejecuta el comando real con `LC_ALL=C TZ=UTC`;
   - guarda en `tests/golden/<comando>/<caso>/`: `setup.sh`, `cmd.txt`, `stdout.txt`, `stderr.txt`, `code.txt`.
   - Cubre: caso feliz, cada bandera soportada, combinación de banderas, archivo inexistente, permiso denegado, bandera no soportada.
   - SQL: usa `python3 -I -c "import sqlite3 …"` (no hay CLI `sqlite3`). Redes: no hay equivalente real; escribe el golden según la documentación oficial y cita la fuente con `# fuente:`.
4. **TDD:** el test de goldens falla → implementa `src/engine/commands/<comando>.ts` con la interfaz `Command` de `05-arquitectura.md` (registrando rutas leídas y cambios para los predicados) → pasa.
5. **Glosas:** errores comunes del comando con glosa en español (`src/engine/gloss/`).
6. **Man en español:** `content/man/<comando>.md` con resumen, sinopsis, banderas soportadas, 2–3 ejemplos y "En Linux real además…".
7. **Registro y autocompletado** del comando.
8. **Revisión:** subagente `verificador-fidelidad` sobre los casos nuevos.
9. Skill `verificar`.

Reporta: banderas implementadas, casos golden (cuántos y cuáles), desviaciones documentadas y resultado de la verificación.
