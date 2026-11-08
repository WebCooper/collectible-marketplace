# ============================================
# Client (Next.js, standalone output)
# Build:  docker build -t marketplace-client \
#           --build-arg NEXT_PUBLIC_API_URL=http://localhost:3001 ./client
# ============================================
ARG NODE_VERSION=22-alpine

# ---- Stage 1: install dependencies ----
FROM node:${NODE_VERSION} AS dependencies
WORKDIR /app

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund

# ---- Stage 2: build ----
FROM node:${NODE_VERSION} AS builder
WORKDIR /app

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* values are inlined into the browser bundle at BUILD time, so
# they must be build arguments. Changing them means rebuilding the image.
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ARG NEXT_PUBLIC_ENABLE_DEMO_ACCOUNTS=false
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_ENABLE_DEMO_ACCOUNTS=${NEXT_PUBLIC_ENABLE_DEMO_ACCOUNTS}

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ---- Stage 3: run ----
FROM node:${NODE_VERSION} AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

COPY --from=builder --chown=node:node /app/public ./public

# Writable prerender cache for the non-root user
RUN mkdir .next && chown node:node .next

# Output tracing keeps only the files the server needs
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

USER node
EXPOSE 3000

CMD ["node", "server.js"]
