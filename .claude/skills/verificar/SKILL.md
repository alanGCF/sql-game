---
name: verificar
description: Ejecuta la compuerta de calidad completa del proyecto y reporta resultados reales. Usar antes de declarar terminada cualquier tarea, antes de commit, o cuando se pida "verifica", "corre los tests", "¿pasa todo?".
---

# Verificar

En orden; al primer fallo, corrige y repite desde ese paso. Nunca desactives, saltes ni borres tests.

| # | Paso | Comando | Cuándo |
|---|---|---|---|
| 1 | Tipos | `npm run typecheck` | siempre |
| 2 | Lint/format | `npm run lint` | siempre |
| 3 | Motor + servidor + contenido | `npm run test` | siempre |
| 4 | Build + presupuestos | `npm run build && npm run size` | siempre |
| 5 | Flujos y capturas | `npm run e2e -- --trace off` | si cambió `src/scene`, `src/ui`, `src/game`, `server` o contenido jugable |
| 6 | Dependencias | `npm audit --audit-level=high` | si cambió `package.json` o el lock |

Si un script imprime "no implementado: <tarea>", dilo literalmente; no cuenta como aprobado.

Reporte: tabla `paso | resultado | detalle` (conteos de tests, avisos del harness, tamaños vs presupuesto). Última línea: `VERDE` o `ROJO: <qué falta>`.
