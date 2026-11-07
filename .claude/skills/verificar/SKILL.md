---
name: verificar
description: Ejecuta la compuerta de calidad completa del proyecto y reporta resultados reales. Usar antes de declarar terminada cualquier tarea, antes de commit, o cuando se pida "verifica", "corre los tests", "¿pasa todo?".
---

# Verificar

Corre en este orden. Al primer fallo, corrígelo y vuelve a empezar desde ese paso. Nunca desactives, saltes ni borres tests para pasar.

| # | Paso | Comando | Cuándo |
|---|---|---|---|
| 1 | Tipos | `npm run typecheck` | siempre |
| 2 | Lint/format | `npm run lint` | siempre |
| 3 | Motor + contenido | `npm run test` | siempre |
| 4 | Build + presupuestos | `npm run build && npm run size` | siempre |
| 5 | E2E móvil | `npm run e2e -- --trace off` | si cambió `src/ui/`, un flujo de juego o contenido de T0 |

Si un script no existe todavía (Fase 0), dilo literalmente: "no existe aún (F0-04)". No lo cuentes como aprobado.

## Reporte

Tabla `paso | resultado | detalle` con conteos (tests pasados/fallidos, avisos del harness de contenido, tamaños vs presupuesto). Si algo falló y no se pudo corregir, pega la salida relevante. Termina con una línea: `VERDE` o `ROJO: <qué falta>`.
