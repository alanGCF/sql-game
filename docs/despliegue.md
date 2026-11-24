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
| `TRUST_PROXY_HOPS` | `1` | Saltos de proxy confiables para obtener la IP real (límite de tasa). No lo subas sin revisar los logs |
| `DATABASE_URL` | referencia a la variable de la base (desde F4) | Conexión a PostgreSQL |

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

## 5. Flujo de releases

1. El trabajo se sube a `develop`; el CI corre ahí.
2. Cuando una versión está probada y revisada (CI verde, revisión visual, auditoría de seguridad) y **tú la apruebas**, se lleva a `main` con `git merge --ff-only develop`.
3. Railway despliega `main` automáticamente cuando el CI de ese commit pasa.

## 6. Costos (plan Hobby)

El plan incluye un crédito mensual de uso. Para no pasarte: un solo servicio web, una base pequeña, límites de tasa activos (ya configurados) y revisar el uso en el panel. Configura una alerta de uso en Railway.
