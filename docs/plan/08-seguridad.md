# 08 — Seguridad

El juego será público. Se asume que lo van a probar personas con conocimientos avanzados. Objetivo: que no puedan **comprometer el servidor, la base de datos ni a otros jugadores**, ni usar el sitio como plataforma de abuso. Que un jugador haga trampa en su propia partida no es una amenaza (es un juego de un jugador).

## Superficie expuesta

| Componente | Expuesto | Comentario |
|---|---|---|
| Archivos estáticos (HTML, JS, assets) | sí | Servidos por Fastify |
| API `/api/partidas` | sí | Única entrada de datos al servidor |
| `/healthz` | sí | Sin información interna |
| PostgreSQL | **no** | Red privada de Railway; solo el servicio web la alcanza |
| Shell, VFS, SQL del juego | solo en el navegador del jugador | El SQL del jugador corre en SQLite WASM en su navegador; **nunca** llega al servidor |

## Modelo de amenazas (STRIDE resumido)

| Amenaza | Ejemplo | Controles |
|---|---|---|
| **Inyección SQL en el servidor** | Código o datos maliciosos en la partida | Consultas siempre parametrizadas (`pg` con `$1`), sin SQL dinámico; el JSON se guarda como `jsonb` validado |
| **Adivinar códigos ajenos** | Fuerza bruta sobre `GET /api/partidas/:codigo` | ≈ 60 bits de entropía (CSPRNG), límite de tasa por IP, validación de formato antes de tocar la base, respuesta uniforme para inexistente, alertas por volumen |
| **Sobrescribir partidas ajenas** | `PUT` con un código adivinado | Mismo control anterior; además `revision` monotónica |
| **Robo de la base** | Fuga de datos | Solo se guarda `sha256(código)`; no hay datos personales salvo el nombre elegido; respaldos de Railway |
| **Usar el servidor como almacenamiento gratis** | Partidas de 10 MB con basura | Cuerpo ≤ 64 KB, esquema Zod estricto (rechaza claves desconocidas), límites por campo (notas ≤ 200 × 500 car.), límite de creación 10/h por IP, retención de 60 días (D-18) |
| **Denegación de servicio** | Ráfagas de peticiones | `@fastify/rate-limit` con dos contadores por IP (página/API 300/min; `/assets/` 1200/min para salones detrás de un NAT), los 404 también cuentan, límites de cuerpo y tiempo de conexión, sin operaciones costosas por petición; protección del proxy de Railway; CDN delante si crece el tráfico |
| **XSS** | Nombre o notas con `<script>` | React escapa por defecto; prohibido `dangerouslySetInnerHTML` (regla de lint); contenido Markdown de la libreta se compila en build, no del usuario; CSP estricta |
| **Clickjacking** | Juego embebido en otro sitio | `frame-ancestors 'none'`, `X-Frame-Options: DENY` |
| **Cadena de suministro** | Dependencia comprometida | `package-lock.json` comprometido en git, `npm ci`, `npm audit --audit-level=high` en CI, Dependabot, pocas dependencias y revisadas (ADR por dependencia), sin scripts de instalación innecesarios |
| **Secretos expuestos** | `DATABASE_URL` en el repo | Variables de entorno en Railway; `.env` ignorado y negado a los agentes; escaneo de secretos de GitHub; nada sensible en el bundle del cliente |
| **Abuso de la ficción** | Aprender técnicas ofensivas | El shell es simulado; comandos fuera de la superficie no se ejecutan (globo de pensamiento); la historia solo enseña administración y defensa |

## Controles del servidor (checklist obligatorio)

- [ ] Fastify con `bodyLimit: 65536`, `trustProxy` configurado para el proxy de Railway (IP real del cliente para el límite de tasa).
- [ ] `@fastify/helmet` con CSP: `default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self'; worker-src 'self' blob:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'` (ajustar solo con ADR).
- [ ] HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `Permissions-Policy` restrictiva, `Cross-Origin-Opener-Policy: same-origin`.
- [ ] Validación Zod de parámetros y cuerpo en cada ruta (esquemas en `shared/`); formato del código validado con regex y dígito verificador antes de consultar.
- [ ] Consultas parametrizadas; usuario de base con permisos mínimos (solo la tabla `partidas`).
- [ ] Límite de tasa por ruta (ver `05-arquitectura.md` §Servidor).
- [ ] Errores sin trazas ni detalles internos hacia el cliente, incluida la URL malformada (`frameworkErrors`); logs con `pino` que registran solo método, **ruta declarada** (`/api/partidas/:codigo`, nunca la URL real) e IP, sin cabeceras ni cuerpos.
- [ ] Variables de entorno validadas al arrancar (`PORT`, `TRUST_PROXY_HOPS` 0–3); un valor inválido detiene el proceso.
- [ ] `TRUST_PROXY_HOPS` comprobado contra el proxy real en el primer despliegue (`docs/despliegue.md` §4).
- [ ] Contenedor como usuario no root que no es dueño de su código (archivos de root, solo lectura para el proceso), imagen Debian stable (`node:24-trixie-slim`), solo `dist/` y dependencias del servidor (las del cliente son de desarrollo: Vite ya las empaqueta). El job `imagen` de CI lo comprueba.
- [ ] Sin endpoints de administración expuestos.
- [ ] Tarea de retención: borrado de partidas con 60 días sin actividad (D-18).

## Controles del cliente

- Sin `eval`, `new Function`, ni `dangerouslySetInnerHTML`.
- El texto del jugador (nombre, notas, respuestas) se muestra solo como texto.
- Los datos de una partida cargada del servidor se validan con el mismo esquema Zod antes de usarse (una partida manipulada no debe romper el cliente).
- Assets y WASM servidos desde el mismo origen (sin CDNs de terceros en producción).

## Proceso

1. **En cada PR/push a `develop`:** CI con `npm audit --audit-level=high`, `npm ci --ignore-scripts`, Actions fijadas por SHA, imagen Docker construida y probada, pruebas de seguridad del servidor (límites, validación, cabeceras, respuestas uniformes) y escaneo de secretos de GitHub. **CodeQL** (el repositorio es público desde 2026-11-24; en uno privado requeriría licencia de GitHub Code Security): sube resultados a la pestaña Security y falla el job si hay hallazgos. Con el repo público también aplican el escaneo de secretos y la protección de push de GitHub. El único job con escritura (`capturas-subir`, F3-09) no instala dependencias ni corre código del repo: valida el artefacto de capturas como hostil (nombres, cantidad, tamaño, estructura PNG) antes de hacer checkout con token, y su commit se revisa antes de llevar `develop` a `main`.
2. **Antes de llevar `develop` a `main`:** subagente `auditor-seguridad` sobre el diff + `/security-review`; ningún hallazgo alto o crítico abierto.
3. **Antes del primer release público:** escaneo OWASP ZAP baseline contra el despliegue de prueba y revisión manual con la lista OWASP ASVS nivel 1.
4. **Mensual:** revisar alertas de Dependabot y actualizar dependencias.
5. **Incidente:** rotar `DATABASE_URL`, revisar logs, restaurar respaldo, publicar nota si afecta a jugadores.

## Privacidad

- No se piden correos ni cuentas. El nombre del jugador es libre (se sugiere un apodo).
- No hay analítica de terceros ni cookies. Logs del servidor sin cuerpos de petición, retenidos 14 días.
- Aviso de privacidad breve en Créditos.
