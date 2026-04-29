# ── Stage 1: Build the frontend SPA ──────────────────────────────────────────
FROM node:20-alpine AS spa-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig*.json vite.config.ts index.html ./
COPY public ./public
COPY src ./src
RUN npm run build

# ── Stage 2: Build the backend server ───────────────────────────────────────
FROM node:20-alpine AS server-builder
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/tsconfig.json ./
COPY server/src ./src
RUN npm run build

# ── Stage 3: Production image ───────────────────────────────────────────────
FROM node:20-alpine
WORKDIR /app

# Install only production dependencies for the server
COPY server/package*.json ./
RUN npm ci --omit=dev

# Copy compiled server code
COPY --from=server-builder /app/server/dist ./dist

# Copy SPA build output into the directory the server serves
COPY --from=spa-builder /app/dist ./public

EXPOSE 3000
CMD ["node", "dist/index.js"]
