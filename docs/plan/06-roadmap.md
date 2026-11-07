# 06 — Roadmap

Tamaños relativos: **S** (una sesión de trabajo con Claude Code), **M** (2–4 sesiones), **L** (5+). Las tareas concretas viven en `backlog.md`.

## Dos pistas en paralelo

```
Pista A — Motor y contenido (Claude Code)   F0 ─ F1 ─ F2 ──────────────┐
Pista B — Diseño (tú, en Claude Design)          D1 ─ D2 ──────────────┤
                                                                       ├─ F3 (UI) ─ F4 ─ F5 ─ v0.2 MVP ─ F6 ─ F7 ─ F8 ─ v1.0
```

El motor (F1–F2) **no depende** del diseño: se construye y prueba headless. El diseño solo bloquea F3.

## Fases

### F0 — Harness y base del proyecto · S–M
- **Meta:** plan aprobado, decisiones abiertas cerradas, repo con tooling y CI, "hola mundo" desplegado y abierto en tu teléfono.
- **Entregables:** docs de `docs/plan/`, `.claude/` (harness), scaffold Vite+React+TS+Biome+Vitest+Playwright, CI, GitHub Pages.
- **Criterio de salida:** `npm run typecheck && npm run lint && npm run test && npm run build` en verde en CI; URL de Pages abre en Android e iPhone.

### D1 — Dirección visual (Claude Design) · tú
- **Meta:** elegir una dirección visual y validar la pantalla de juego con teclado abierto.
- **Entregables:** 2–3 direcciones de la pantalla de juego (§Dirección visual del brief), tokens preliminares.
- **Criterio de salida:** dirección elegida + pantalla de juego a 360×740 y 390×844, teclado abierto y cerrado.

### F1 — Motor: shell + VFS + comandos de T0–T2 · L
- **Meta:** un shell headless que ejecuta los comandos de Turnos 0–2 con salida fiel.
- **Entregables:** VFS con permisos, lexer/parser/expansión/ejecución (pipes, redirecciones, `&&`/`||`), comandos de T0–T2 con goldens, autocompletado, glosas, "quisiste decir", `npm run play --exec`.
- **Criterio de salida:** todos los goldens de T0–T2 pasan; `verificador-fidelidad` sin desviaciones no documentadas.

### F2 — Runtime de misiones + harness de contenido + Turno 0 · M
- **Meta:** jugar el Turno 0 completo en la terminal con `npm run play`.
- **Entregables:** esquema Zod, pipeline YAML→JSON, predicados, eventos, pistas, guardado/restauración, `validate:content` con todas las reglas de `07-calidad-harness.md`, 4 misiones de T0.
- **Criterio de salida:** `validate:content` verde; `playtester-novato` completa T0 sin leer el contenido.

### D2 — Sistema de diseño completo (Claude Design) · tú
- **Meta:** todas las pantallas y componentes del brief, prototipo del loop principal.
- **Criterio de salida:** checklist de entregables del brief completo; handoff exportado.

### F3 — UI móvil · L *(depende de D2)*
- **Meta:** T0 jugable en el navegador del teléfono con el diseño final.
- **Entregables:** tokens, shell de app, Terminal + input + barra de accesos + autocompletado, Mensajes, Bitácora, briefing, objetivos, pistas, misión completada, mapa de turnos, ajustes, guardado en IndexedDB, PWA básica.
- **Criterio de salida:** E2E móviles verdes (Pixel 7, iPhone 13); `qa-movil` sin bloqueantes; axe sin violaciones serias.

### F4 — SQL + Turnos 1–3 · L
- **Meta:** arco Linux 1–2 y SQL 1 jugables.
- **Entregables:** contenido T1–T2, `sql.js` diferido, `sqlite3` en terminal, app Datos, predicados SQL, generador de `mes.db`, contenido T3.
- **Criterio de salida:** T0–T3 completables por `play --solucion` y por E2E; presupuesto de carga respetado.

### F5 — Red + Turno 4 → **v0.2 MVP** · M
- **Meta:** primera versión pública: Turnos 0–4 (Linux, SQL y redes).
- **Entregables:** modelo de red, `ip`/`ping`/`host`/`dig`/`traceroute`/`wall`, app Red, contenido T4, pulido del final del MVP.
- **Criterio de salida:** playtest con ≥ 5 novatos (protocolo en `07`), métricas registradas, bloqueantes corregidos. Deploy público.

### F6 — Turnos 5–8 → v0.5 · L
- Permisos, procesos, `find`, puertos/`ss`/`nmap`/`curl`, SQL 2–3 (agregaciones, JOINs). Logros. Modo Taller T0–T4.

### F7 — Turnos 9–12 + finales → v0.9 · L
- SSH/llaves/`scp`/`tar`, scripts y `cron`, SQL 4 (DDL/DML/transacciones), firewall, finales, base de datos escribible y persistida.

### F8 — Pulido → **v1.0** · M
- Auditoría de accesibilidad completa, presupuestos de rendimiento en Lighthouse CI, offline total, tarjetas de campo, playtest final, landing page.

## Versiones

| Versión | Contenido | Público |
|---|---|---|
| v0.0 | Harness + scaffold + Pages | interno |
| v0.1 | T0 en navegador | interno (tú + conocidos) |
| **v0.2 MVP** | T0–T4 | **público** |
| v0.5 | T0–T8 | público |
| v1.0 | T0–T12, finales, pulido | público |
| v2 (futuro) | Backend Django: cuentas, sync, modo salón para profesores, inglés | — |

## Riesgos principales

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Teclado móvil tapa la terminal o se cierra al tocar la barra | Juego injugable en celular | Prototipo de input en F0-07 (spike) antes de F3; E2E con viewport reducido; ADR-002 |
| Fidelidad pobre → lo aprendido no sirve en Linux real | Rompe el objetivo del juego | Goldens desde Linux real; `verificador-fidelidad`; superficie de comandos acotada |
| Alcance del contenido (52 misiones) | Proyecto que no termina | MVP de 20 misiones; harness que hace barato escribir y validar misiones |
| Peso de `sql.js` en datos móviles | Abandono en T3 | Carga diferida + precarga en segundo plano durante T2 |
| Narrativa que se siente ejercicio | Aburrimiento | Patrón Ticket+Investigación; `disenador-narrativo` revisa acoplamiento herramienta→trama |
| Tiempo disponible del autor (turno vespertino) | Avance lento | Backlog en tareas S; `/siguiente-tarea` para retomar sin recordar contexto |
