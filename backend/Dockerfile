# ============================================
# Backend (NestJS + Prisma)
#
# Targets:
#   runner  (default)  production API server
#   migrate            one-off job: prisma migrate deploy (and the seed script)
#
# Build:  docker build -t marketplace-backend ./backend
#         docker build --target migrate -t marketplace-backend-migrate ./backend
#
# Alpine keeps the images small. Prisma needs OpenSSL on musl, so it is
# installed in the shared base. The generated Prisma client and its query
# engine are built here in the same OS image they run in.
# ============================================
ARG NODE_VERSION=22-alpine

FROM node:${NODE_VERSION} AS base
RUN apk add --no-cache openssl
WORKDIR /app

# ---- Stage 1: full install, then compile everything ----
FROM base AS build

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund

COPY . .
# - prisma generate: typed client + query engine for this OS
# - npm run build:   the API, to dist/
# - tsc prisma/seed.ts: the seed script as plain JS, so the migrate image
#   does not need ts-node or any other dev tooling
RUN npx prisma generate \
    && npm run build \
    && npx tsc prisma/seed.ts --outDir seed-dist --module commonjs \
       --moduleResolution node --target ES2023 --esModuleInterop --skipLibCheck

# ---- Stage 2a: dependencies for the API (nothing the server does not need) ----
# @prisma/client declares `prisma` (the CLI) and `typescript` as optional peers.
# The lockfile marks them and their dependencies (effect, @prisma/config, ...)
# "devOptional", so `--omit=dev` alone still installs ~150 MB of them. Adding
# `--omit=optional` drops them; the API never uses them at runtime.
FROM base AS runtime-deps

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev --omit=optional --no-audit --no-fund \
    # Prisma ships WebAssembly query engines for every database (edge /
    # driver-adapter runtimes, ~60 MB). This app uses the native engine on
    # PostgreSQL, which loads none of them. Removed in the same layer so the
    # space is actually reclaimed.
    && find node_modules/@prisma/client/runtime -name '*wasm-base64*' -delete

# ---- Stage 2b: dependencies for the migrate job ----
# Production deps *with* peers, which is what brings in the prisma CLI and its
# schema engine. The build fails if the CLI is missing.
FROM base AS migrate-deps

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev --no-audit --no-fund \
    && test -x node_modules/.bin/prisma \
    && find node_modules/@prisma/client/runtime -name '*wasm-base64*' -delete

# ---- Target: migrate ----
FROM base AS migrate

ENV NODE_ENV=production

COPY --from=migrate-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/node_modules/.prisma ./node_modules/.prisma
COPY --chown=node:node prisma ./prisma
COPY --from=build --chown=node:node /app/seed-dist ./seed-dist
COPY --chown=node:node package.json ./

USER node

# Default: apply migrations.  Seed sample data with: node seed-dist/seed.js
CMD ["node_modules/.bin/prisma", "migrate", "deploy"]

# ---- Target: runner (default, keep this last) ----
FROM base AS runner

ENV NODE_ENV=production
ENV PORT=3001

COPY --from=runtime-deps --chown=node:node /app/node_modules ./node_modules
# Generated Prisma client (built against the same OS/OpenSSL as this image)
COPY --from=build --chown=node:node /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json ./

USER node
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "fetch('http://localhost:'+(process.env.PORT||3001)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/main"]
