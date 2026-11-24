# 06 — Roadmap

Tamaños relativos: **S** (una sesión de trabajo de Claude Code), **M** (2–4), **L** (5+). Tareas concretas: `backlog.md`.

## Dependencias entre pistas

```
Motor (headless)   F1 ── F2 ─────────────────────────────┐
Escena 3D          F0-07 (spike + estilo) ── F3 ── F4 ───┼── F5 ── F6 (v0.2 MVP) ── F7 ── F8 ── F9 (v1.0)
Servidor           F0-04/06 (base) ─────────── F4 ───────┘
```

El motor no depende de la escena: se construye y prueba headless mientras se decide el estilo visual.

## Fases

### F0 — Base del proyecto · M
- **Meta:** decisiones cerradas, scaffold, CI, despliegue en Railway, spike de la escena 3D con propuestas de estilo.
- **Criterio de salida:** CI verde en `develop`; servicio en Railway respondiendo `/healthz` desde `main`; el usuario eligió estilo visual (D-08) viendo capturas del spike.

### F1 — Motor: shell, VFS, clasificador, comandos T1–T3 · L
- VFS con permisos, lexer/parser/expansión/ejecución, clasificador de entrada (globo de pensamiento), variables de partida y RNG, comandos de T1–T3 con goldens de `debian:stable`, glosas, autocompletado, `npm run play --exec`.
- **Salida:** goldens verdes; `verificador-fidelidad` sin desviaciones ni comandos obsoletos.

### F2 — Runtime de misiones + harness de contenido + T1 headless · M
- Esquema Zod, pipeline de contenido, predicados, `esperado_de`, eventos, pistas, guardado, harness C1–C18, `npm run play` completo, mundo base y misiones de T1.
- **Salida:** `validate:content` verde con 25 semillas; `playtester-novato` completa T1.

### F3 — Escena del cubículo · L *(depende de D-08)*
- Cubículo con el estilo elegido, cámara que sigue al cursor, objetos interactivos con resaltado, transiciones de acercamiento, monitor con la terminal conectada al motor, menú sobre la escena, ajustes básicos, modo `?test=1`, capturas de referencia.
- **Salida:** se puede jugar T1 en el navegador desde el escritorio 3D; revisión visual aprobada por el usuario.

### F4 — Sistemas del escritorio + servidor de partidas + T0 → **v0.1** · L
- Teléfono (directorio, marcar, paciencia, llamadas entrantes), pistas de Lupita, libreta (automática y notas propias, sin copiar/pegar), pizarrón y post-its, calendario, gafete, visitas, audio ambiental y subtítulos, oficina viva básica.
- Servidor: API de partidas, código, checkpoints, sincronización.
- Contenido: Turno 0 (bienvenida y tutorial) completo.
- **Salida:** T0–T1 jugables de punta a punta; continuar con código en otra computadora; playtest ronda 1. Release interno v0.1 en Railway.

### F5 — SQL + T2–T4 + favores · L
- `sql.js` en worker, generador de `mes.db` con semilla, `sqlite3`, app Datos, predicados SQL; contenido T2–T4 y favores T1–T3.

### F6 — Red + T5 → **v0.2 MVP público** · M
- Modelo de red, comandos de red, app Red, `wall`, contenido T5 y favor T4–T5; auditoría de seguridad completa (ZAP + ASVS L1); playtest ronda 2.

### F7 — T6–T8 + Tiempo extra · L
- Permisos, procesos, `find`, puertos/`ss`/`nmap`/`curl`, SQL 2; turno de tiempo extra del sábado 7; logros; repetir misiones desde el calendario.

### F8 — T9–T13 + finales + epílogo → v0.9 · L
- JOINs, SSH/llaves/`scp`/`tar`, scripts y `cron`, DDL/DML/transacciones, firewall, decisión final y epílogo del lunes 16; playtest ronda 3.

### F9 — Pulido → **v1.0** · M
- Rendimiento medido en hardware real, accesibilidad completa, audio final, revisión de vigencia de todos los comandos, revisión de seguridad final, página de créditos y licencias.

## Versiones

| Versión | Contenido | Público |
|---|---|---|
| v0.0 | Scaffold + CI + Railway `/healthz` | interno |
| v0.1 | T0–T1 en el escritorio 3D, código de partida | interno (tú + conocidos) |
| **v0.2 MVP** | T0–T5 (Linux, SQL, redes) | **público** |
| v0.5 | T0–T8 + tiempo extra | público |
| v0.9 | Historia completa con finales | público |
| v1.0 | Pulido, auditorías, vigencia revisada | público |
| v2 | Port a móvil/tablet | — |

## Riesgos principales

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Rendimiento 3D en laptops con GPU integrada | Juego lento, abandono | Presupuestos de draw calls/texturas, estilo low-poly, medición en hardware real desde F3, opción de calidad baja |
| Assets 3D con licencias dudosas | Problema legal al publicar | Solo CC0/CC-BY/OFL, inventario en `docs/diseno/assets.md` revisado antes de cada release |
| Fidelidad o vigencia pobre | Lo aprendido no sirve | Goldens en `debian:stable`, `verificador-fidelidad`, revisión de vigencia por release |
| Abuso del servidor | Caída o costos en Railway Hobby | Límites de tasa y tamaño, retención, alertas de uso en Railway |
| Alcance (52 misiones + 17 favores + escena viva) | Proyecto que no termina | MVP de 5 turnos; harness que abarata escribir y validar contenido; la oficina viva crece por fases |
| Capturas WebGL inestables en CI | Falsos positivos | Modo `?test=1` determinista, tolerancias, misma versión de Chromium en CI y local |
| Tiempo disponible del autor | Avance lento | Trabajo autónomo del agente en código; consultas al usuario agrupadas con capturas |
