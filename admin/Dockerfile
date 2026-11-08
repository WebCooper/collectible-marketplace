# ============================================
# Admin (Vite + React) served by nginx
# Build:  docker build -t marketplace-admin \
#           --build-arg VITE_API_URL=http://localhost:3001 ./admin
# ============================================
ARG NODE_VERSION=22-slim

# ---- Stage 1: build the static site ----
FROM node:${NODE_VERSION} AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund

COPY . .

# VITE_* values are inlined into the bundle at BUILD time.
ARG VITE_API_URL=http://localhost:3001
ENV VITE_API_URL=${VITE_API_URL}

# Runs `tsc` then `vite build`, output in /app/dist
RUN npm run build

# ---- Stage 2: serve with nginx (non-root, listens on 8080) ----
FROM nginxinc/nginx-unprivileged:alpine AS runner

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 8080
# The base image already runs nginx in the foreground as the nginx user.
