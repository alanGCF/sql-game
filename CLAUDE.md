# CLAUDE.md — Planta 7 *(nombre clave; título del juego por definir, D-05)*

Juego web **de escritorio** que enseña Linux, SQL y redes desde cero mediante una historia de misterio en una planta de manufactura ficticia. Se juega en primera persona, sentado en tu cubículo en 3D: la computadora, el teléfono, la libreta, el pizarrón y el calendario son la interfaz. El plan completo vive en `docs/` (índice: `docs/README.md`). Este archivo es la **constitución**: si algo aquí choca con otro documento, gana este archivo y se corrige el otro.

Idioma del proyecto: **español** (docs, contenido, commits, comentarios). Identificadores de código en inglés.

## Pilares no negociables

1. **Escritorio primero.** Navegador de escritorio con mouse y teclado, 1280×720 como mínimo y 1920×1080 como objetivo. El port a móvil es posterior (v2) y no condiciona decisiones de v1.
2. **Una sola pantalla.** Todo el juego ocurre en una sola escena 3D con interfaz diegética (objetos del escritorio) y capas DOM encima. No hay navegación entre páginas.
3. **La herramienta avanza la trama.** Cada concepto enseñado revela información o cambia el estado del mundo que la historia necesita. Si se puede quitar la herramienta y la historia sigue igual, la misión está mal diseñada.
4. **Validación por resultado.** Los objetivos se cumplen por el estado del mundo o por una respuesta del jugador, nunca comparando la cadena exacta del comando. Cualquier solución correcta debe valer.
5. **Vigencia y fidelidad.** Lo que se enseña es lo **actual**: mismo comportamiento y salida que la versión estable vigente de GNU/Linux (Debian stable / Ubuntu LTS), SQLite y las herramientas de red modernas (`ip`, `ss`, `dig`, `grep -E`, llaves `ed25519`…). Nada obsoleto se enseña como vigente. Política completa: `docs/plan/03-curriculo.md` §Política de vigencia.
6. **Todo se teclea.** El jugador escribe cada comando y cada nota: no se puede pegar en la terminal ni en la libreta, ni copiar texto de la libreta o de las pistas.
7. **Una idea nueva por misión** (máximo dos). Cada concepto se repasa después (misiones y favores).
8. **Contenido como datos; motor sin DOM; mundo determinista por semilla.** `src/engine/` es TypeScript puro. Las misiones son YAML en `content/`. Cada partida tiene una semilla que varía los datos (no la historia) para que las respuestas no se memoricen.
9. **Seguro por defecto.** El sitio es público: toda entrada es hostil hasta validarse. Ver `docs/plan/08-seguridad.md`.
10. **Accesible.** Subtítulos de todo audio, controles alternativos por teclado, contraste AA en la interfaz, opción de reducir movimiento.
11. **Seguridad responsable en la ficción.** El jugador siempre actúa como empleado autorizado administrando o defendiendo su propia red. Nada de técnicas ofensivas reales.

## Cómo se trabaja

- **Ramas:** solo `main` (producción; Railway despliega de aquí) y `develop` (trabajo diario). No se crean más ramas.
- **Commits:** uno por tarea del backlog, mensaje `F#-##: <resumen en español>`. Un push puede llevar varios commits si son de tareas relacionadas.
- **A `main`** solo se lleva `develop` (`git merge --ff-only develop`) cuando: CI en verde, `/verificar` en verde, revisión visual con Playwright sin regresiones, revisión de seguridad sin hallazgos altos **y aprobación del usuario**.
- **Autonomía:** el agente trabaja de forma continua y toma las decisiones de **código**. Las decisiones de **funcionalidad y estética** se consultan con el usuario (proponer opciones con capturas, no decidir solo). Registro: `docs/plan/decisiones-abiertas.md`.
- **Revisión visual constante:** cualquier cambio en la escena o la interfaz pasa por `/revision-visual` (Playwright + capturas) antes de cerrarse.

## Flujo de una tarea

1. `/siguiente-tarea` toma la siguiente tarea desbloqueada de `docs/plan/backlog.md`.
2. Si la tarea toca una decisión de funcionalidad/estética abierta, **pregunta** y sigue con otra tarea mientras tanto.
3. TDD (rojo → verde → refactor). Cambio mínimo completo (ponytail); atajo deliberado = `// shortcut: <qué y cuándo revisarlo>`.
4. `/verificar` y, si hubo cambios visibles, `/revision-visual`.
5. Commit `F#-##: …` en `develop` y push.

Skills del proyecto (`.claude/skills/`): `siguiente-tarea`, `verificar`, `revision-visual`, `nueva-mision`, `nuevo-comando`.
Subagentes (`.claude/agents/`): `disenador-narrativo`, `revisor-curricular`, `verificador-fidelidad`, `qa-visual`, `playtester-novato`, `auditor-seguridad`.

Antes de escribir código contra una librería cuya API cambia (React, three.js, @react-three/fiber, drei, Vite, Fastify, sql.js, Playwright, Zod), consulta su documentación actual (Context7 si está autorizado; si no, `npm view`, el changelog o los tipos instalados).

## Comandos

```bash
npm run dev              # cliente (Vite) + servidor en modo desarrollo
npm run typecheck        # tsc --noEmit (cliente, servidor, scripts)
npm run lint             # biome check
npm run test             # vitest: motor, servidor, harness de contenido
npm run validate:content # solo el harness de contenido (acepta rutas)
npm run play -- --mision <id> [--semilla N] [--solucion]   # jugar headless
npm run e2e              # playwright: flujos + capturas visuales
npm run build && npm run size   # build + presupuestos
npm start                # servidor de producción (sirve el build y /api)
```

Si un script imprime "no implementado: <tarea>", esa parte aún no existe; dilo, no lo cuentes como aprobado.

## Reglas de código

- TypeScript `strict`. Sin `any` salvo en fronteras con librerías, comentado.
- `src/engine/**` no importa de `src/scene/**`, `src/ui/**`, React, three.js ni APIs del DOM.
- `server/**` no confía en nada del cliente: valida con los esquemas Zod de `shared/`, consultas SQL siempre parametrizadas, límites de tamaño y de tasa.
- Un comando simulado = un archivo en `src/engine/commands/` + goldens en `tests/golden/<comando>/` + página de libreta en `content/libreta/comandos/<comando>.md`. Solo las banderas de la superficie de comandos (`03-curriculo.md`).
- Determinismo: el motor no usa `Date.now()` ni `Math.random()`; usa el reloj de juego y el RNG con semilla.
- Dependencia nueva = justificarla en `docs/decisiones/adr.md` y revisar su mantenimiento y licencia.
- Assets (modelos, texturas, sonidos, fuentes) solo con licencia CC0/CC-BY/OFL registrada en `docs/diseno/assets.md`.
- No desactives, saltes ni borres tests para que pase la compuerta.

## Reglas de contenido

- Español de México, tuteo, frases cortas. Máximo 280 caracteres por globo de diálogo.
- Toda misión trae `solucion`, ≥ 1 `soluciones_alternativas` y ≥ 1 `contraejemplos`, y debe resolverse con **cualquier semilla** (formato: `docs/ejemplos/mision-ejemplo.yaml`).
- Las pistas las da el compañero de trabajo por teléfono, en tres niveles: empujón → concepto → comando exacto (que el jugador debe teclear). Las pistas no regañan.
- Datos variables (lote, IPs, horas, conteos, contraseñas) siempre como `{{variable}}` de partida; la historia y los personajes no cambian.
- Personas, empresas, IPs y dominios ficticios; consistencia con la biblia del mundo (`docs/plan/02-trama.md`).

## Definición de terminado

- Tests nuevos o actualizados que fallaban antes del cambio y pasan después.
- `/verificar` en verde (o el fallo reportado explícitamente al usuario).
- Contenido: harness en verde con el conjunto de semillas de CI y revisión de `revisor-curricular`.
- Escena o interfaz: `/revision-visual` sin regresiones y capturas revisadas.
- Servidor o algo expuesto a internet: `auditor-seguridad` sin hallazgos altos.
- Docs afectados actualizados (currículo, superficie de comandos, backlog, ADR).

## Mapa de documentos

- `docs/plan/01-vision.md` — público, objetivos de aprendizaje, plataformas, no-objetivos.
- `docs/plan/02-trama.md` — historia, calendario, personajes, turnos, favores, finales, biblia del mundo.
- `docs/plan/03-curriculo.md` — conceptos, mapa de misiones y favores, superficie de comandos, política de vigencia.
- `docs/plan/04-mecanicas.md` — escritorio 3D, objetos, teléfono, libreta, pizarrón, calendario, terminal, pistas, código de partida, aleatorización.
- `docs/plan/05-arquitectura.md` — stack, módulos, escena, servidor, esquema de misión, presupuestos.
- `docs/plan/06-roadmap.md` — fases, versiones, criterios de salida.
- `docs/plan/07-calidad-harness.md` — harness de agentes, de contenido, pruebas, revisión visual, CI.
- `docs/plan/08-seguridad.md` — modelo de amenazas, controles, revisión antes de producción.
- `docs/plan/backlog.md` — tareas con Hacer / Listo cuando / Verificar.
- `docs/plan/decisiones-abiertas.md` — decisiones de funcionalidad/estética pendientes del usuario.
- `docs/decisiones/adr.md` — decisiones técnicas tomadas.
- `docs/diseno/direccion-arte.md` — escena, objetos, estilo, referencias, audio.
- `docs/diseno/assets.md` — inventario y licencias de assets.
- `docs/glosario.md` — vocabulario del dominio.
