---
name: nuevo-comando
description: Implementa o amplía un comando simulado del shell del juego (ls, grep, ping, sqlite3…) con fidelidad y vigencia respecto a Debian stable. Usar al pedir "implementa el comando X", "agrega la bandera -n a grep", o al tocar src/engine/commands/.
---

# Nuevo comando

1. **Alcance y vigencia:** revisa `docs/plan/03-curriculo.md` §Superficie de comandos y §Política de vigencia. Solo banderas listadas; si piden otra, primero agrégala a la tabla (y dilo). Si el comando es obsoleto en sistemas actuales, no se implementa: va a glosas (`command not found` + equivalente moderno).
2. **Documentación actual:** revisa el `man` de la versión de referencia (en `debian:stable`) y, para librerías, Context7 o el changelog.
3. **Goldens desde el sistema real:**
   - escribe `setup.sh` (estado), `cmd.txt` (comando);
   - captura con `scripts/capture-goldens.sh <comando> <caso>` en `debian:stable` (Docker local o job de CI `goldens`); guarda `stdout.txt`, `stderr.txt`, `code.txt`, `version.txt`;
   - si no hay Docker, captura en el sandbox **solo** si la versión coincide y anótalo; si no coincide, deja el caso marcado `pendiente-captura` para el job de CI;
   - cubre: caso feliz, cada bandera, combinaciones, archivo inexistente, permiso denegado, bandera fuera de superficie (debe ir al clasificador, no al comando).
   - SQL: `python3 -I -c "import sqlite3 …"`. Redes: formato de la documentación oficial con `# fuente:`.
4. **TDD:** test de goldens rojo → `src/engine/commands/<comando>.ts` con la interfaz `Command` (registrando lecturas y cambios) → verde.
5. **Clasificador:** agrega el comando y sus banderas a la superficie; banderas reales no soportadas deben producir globo de pensamiento.
6. **Glosas** de errores comunes en `src/engine/gloss/`.
7. **Libreta:** `content/libreta/comandos/<comando>.md` (explicación corta, ejemplo, "En tu Linux real…", y si aplica "Si lo ves en un tutorial viejo…").
8. Registro y autocompletado.
9. `verificador-fidelidad` sobre los casos nuevos; luego `/verificar`.

Reporta: banderas implementadas, goldens (cuántos, versión de referencia), desviaciones documentadas, vigencia revisada y resultado de la verificación.
