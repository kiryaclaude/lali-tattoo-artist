# --- Build stage ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- Runtime stage ---
FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY server.mjs ./
ENV PORT=3000
EXPOSE 3000
# .mjs => всегда ESM (package.json в runtime не нужен).
# Сервер слушает 0.0.0.0:$PORT, SPA-фолбэк на index.html.
CMD ["node", "server.mjs"]
