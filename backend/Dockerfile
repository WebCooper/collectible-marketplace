# ============================================
# Backend (NestJS + Prisma)
#
# Targets:
#   runner  (default)  production API server
#   migrate            one-off job: prisma migrate deploy / db seed
#
# Build:  docker build -t marketplace-backend ./backend
#         docker build --target migrate -t marketplace-backend-migrate ./backend
# ============================================
ARG NODE_VERSION=22-slim

# Prisma's query engine and bcrypt need glibc + OpenSSL, so use the Debian
# "slim" image (not Alpine) and install openssl in every stage that runs Prisma.
FROM node:${NODE_VERSION} AS base
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# ---- Stage 1: install all dependencies and compile ----
FROM base AS build

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund

COPY . .
RUN npx prisma generate && npm run build

# ---- Target: migrate (keeps the prisma CLI and ts-node for migrations/seed) ----
FROM build AS migrate
ENV NODE_ENV=production
USER node
CMD ["npx", "prisma", "migrate", "deploy"]

# ---- Stage 2: production dependencies only ----
FROM base AS prod-deps

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev --no-audit --no-fund

# ---- Target: runner (default) ----
FROM base AS runner

ENV NODE_ENV=production
ENV PORT=3001

COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
# Generated Prisma client (built against the same OS/OpenSSL as this image)
COPY --from=build --chown=node:node /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json ./

USER node
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "fetch('http://localhost:'+(process.env.PORT||3001)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/main"]
