# Despliegue en Railway (plan Hobby)

Un servicio web (imagen del `Dockerfile` en la raíz) y, desde F4, una base PostgreSQL. Railway despliega la rama **`main`**.

> No hay archivo de configuración de Railway en el repo a propósito: su formato "config as code" está en transición y no pude verificar su documentación desde la sesión (`docs.railway.com` está bloqueado por la red del entorno). Todo se configura en el panel. Si los nombres de los menús no coinciden exactamente, la intención de cada paso es la misma.

## 1. Crear el servicio

1. En Railway: **New Project → Deploy from GitHub repo** → elige `alanGCF/sql-game`.
2. En el servicio → **Settings → Source**: rama **`main`**. Activa la opción de **esperar a que pase el CI** de GitHub antes de desplegar (aparece como "Wait for CI" / check suites).
3. **Build:** Railway detecta el `Dockerfile` en la raíz y lo usa. No configures comando de build ni de arranque (el `CMD` del Dockerfile ya arranca el servidor).
4. **Deploy → Healthcheck Path:** `/healthz`.
5. **Networking → Generate Domain** para obtener la URL pública (`*.up.railway.app`). Más adelante puedes poner tu dominio propio.

## 2. Variables de entorno

| Variable | Valor | Para qué |
|---|---|---|
| `PORT` | (la pone Railway) | Puerto donde escucha el servidor |
| `NODE_ENV` | `production` | Ya viene en la imagen |
| `TRUST_PROXY_HOPS` | `1` | Saltos de proxy confiables para obtener la IP real (límite de tasa). Entero de 0 a 3; un valor inválido detiene el arranque. No lo cambies sin hacer la prueba del paso 4 |
| `DATABASE_URL` | referencia a la variable de la base | Conexión a PostgreSQL para la API de partidas (F4-11). Sin ella, en producción la API contesta 503 y el resto del sitio sigue. La tabla `partidas` se crea sola en el primer uso. |
| `PARTIDAS_PEPPER` | 64 caracteres hex (32 bytes aleatorios) | Clave del HMAC con que se guardan los códigos de partida. Genérala en tu computadora con `openssl rand -hex 32` y pégala directo en Railway (nunca en un chat ni en el repo). Sin ella la API de partidas contesta 503. **No la cambies después**: con otra clave, ningún código existente vuelve a encontrar su partida. |

Nunca pongas secretos en el repositorio ni en el código del cliente.

## 3. Base de datos (a partir de F4)

1. En el proyecto: **New → Database → PostgreSQL**.
2. En el servicio web → **Variables**: agrega `DATABASE_URL` como referencia a la variable `DATABASE_URL` del servicio PostgreSQL (Railway la ofrece en el autocompletado de variables).
3. La base no debe tener dominio público: solo la red privada del proyecto.

## 4. Verificar el despliegue

```bash
curl -s https://TU-DOMINIO.up.railway.app/healthz
```

```bash
curl -sI https://TU-DOMINIO.up.railway.app/
```

Debe responder `{"ok":true}` y, en las cabeceras de la segunda, `content-security-policy`, `strict-transport-security`, `x-frame-options: DENY` y `x-content-type-options: nosniff`.

**IP real del cliente (obligatorio en el primer despliegue, antes de anunciar el sitio; verificado el 2026-11-25 con `TRUST_PROXY_HOPS=1`).** El límite de tasa usa la IP que calcula el servidor con `TRUST_PROXY_HOPS`. Si el número de saltos no coincide con los proxies reales de Railway, o todos los jugadores comparten una IP interna (y un solo límite), o la IP se puede falsificar.

```bash
curl -s -H 'X-Forwarded-For: 1.2.3.4' https://TU-DOMINIO.up.railway.app/healthz
```

Hazlo desde dos redes distintas (por ejemplo, Wi-Fi de casa y datos del celular). En **Deploy Logs**, el campo `remoteAddress` de cada solicitud debe ser la IP pública de cada red: nunca `1.2.3.4` ni una IP interna (`10.x`, `100.64.x`, `fd…`). Si sale una IP interna, sube `TRUST_PROXY_HOPS` en 1 y repite; si sale `1.2.3.4`, bájalo.

## 5. Flujo de releases

1. El trabajo se sube a `develop`; el CI corre ahí.
2. Cuando una versión está probada y revisada (CI verde, revisión visual, auditoría de seguridad) y **tú la apruebas**, se lleva a `main` con `git merge --ff-only develop`.
3. Railway despliega `main` automáticamente cuando el CI de ese commit pasa.

## 6. Costos (plan Hobby)

El plan incluye un crédito mensual de uso. Para no pasarte: un solo servicio web, una base pequeña, límites de tasa activos (ya configurados) y revisar el uso en el panel. Configura una alerta de uso en Railway.

El tráfico de salida (descargas del juego) también cuenta. El límite por IP frena a un solo abusador, no a muchos a la vez. Si el sitio se vuelve popular, conviene poner un CDN o proxy con caché delante (por ejemplo, el plan gratuito de Cloudflare) para que los archivos de `/assets/`, que nunca cambian, no salgan de Railway en cada visita.

## Usuario de base con permisos mínimos (F4-11, antes de anunciar el sitio)

La app puede funcionar con el usuario dueño que da Railway, pero lo recomendado es que use uno que solo pueda leer y escribir la tabla `partidas`. Después del primer despliegue con la API (la tabla ya existe), en la consola de datos del servicio PostgreSQL:

```sql
CREATE ROLE rastro_app LOGIN PASSWORD '<contraseña generada con openssl rand -hex 24>';
GRANT CONNECT ON DATABASE railway TO rastro_app;
GRANT USAGE ON SCHEMA public TO rastro_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON partidas TO rastro_app;
```

Luego cambia `DATABASE_URL` del servicio web para que use `rastro_app` (misma host y base, otro usuario y contraseña). Con ese usuario la app no crea tablas: solo DML.
