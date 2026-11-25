# syntax=docker/dockerfile:1
# Imagen de producción para Railway: build del cliente + servidor Fastify. Corre como usuario sin privilegios.

# Imagen base fijada por digest (la que resolvió Railway el 2026-11-25); Dependabot (docker) la actualiza.
FROM node:24-trixie-slim@sha256:4d00acb4bcc42c454c4eb801526f7ad7f772ea3bd4fd168c5cc2e384abcbb9d4 AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:24-trixie-slim@sha256:4d00acb4bcc42c454c4eb801526f7ad7f772ea3bd4fd168c5cc2e384abcbb9d4 AS runtime
ENV NODE_ENV=production
WORKDIR /app
# Los archivos quedan de root: el proceso (usuario node) solo puede leerlos.
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
USER node
EXPOSE 3000
CMD ["node", "dist/node/server/src/index.js"]
