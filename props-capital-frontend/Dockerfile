# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — Builder
# Accepts VITE_* build-time environment variables as Docker build arguments.
# Vite bakes these into the static bundle at build time — they are NOT runtime
# environment variables and cannot be changed without rebuilding.
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# ── Build arguments (passed via docker-compose args or --build-arg) ──────────
ARG VITE_API_URL=http://localhost:5101
ARG VITE_WEBSOCKET_URL=http://localhost:5101
ARG VITE_MT5_API_URL=http://localhost:5101

# Make them visible to Vite during build
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WEBSOCKET_URL=$VITE_WEBSOCKET_URL
ENV VITE_MT5_API_URL=$VITE_MT5_API_URL

# Copy manifests first — layer cache
COPY package.json  ./
RUN yarn install --frozen-lockfile

# Copy source and build
COPY . .
RUN yarn build


# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — Production (Nginx)
# Serves the compiled static assets.  Nginx handles SPA routing and caching.
# ─────────────────────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS production

# Copy compiled Vite output
COPY --from=builder /app/dist /usr/share/nginx/html

# Custom Nginx configuration (SPA routing + caching headers + gzip)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
