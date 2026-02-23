# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — Builder
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# ── Build arguments ───────────────────────────────────────────────────────────
ARG VITE_API_URL=http://localhost:5101
ARG VITE_WEBSOCKET_URL=http://localhost:5101
ARG VITE_MT5_API_URL=http://localhost:5101

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WEBSOCKET_URL=$VITE_WEBSOCKET_URL
ENV VITE_MT5_API_URL=$VITE_MT5_API_URL

# Copy manifests first — layer cache
COPY package.json ./
RUN yarn install --frozen-lockfile

# Copy source and build
COPY . .
RUN yarn build


# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — Production (Nginx)
# ─────────────────────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS production

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
