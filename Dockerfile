# syntax=docker/dockerfile:1
# Imagen de producción para Railway: build del cliente + servidor Fastify. Corre como usuario sin privilegios.

# shortcut: fijar las imágenes por digest (@sha256) en F0-06; Dependabot (docker) las mantiene al día.
FROM node:24-trixie-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:24-trixie-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
# Los archivos quedan de root: el proceso (usuario node) solo puede leerlos.
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
USER node
EXPOSE 3000
CMD ["node", "dist/node/server/src/index.js"]
