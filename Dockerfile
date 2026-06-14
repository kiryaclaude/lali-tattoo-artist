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
RUN npm install -g serve@14
COPY --from=build /app/dist ./dist
# serve читает $PORT (Railway задаёт его) и слушает на 0.0.0.0
ENV PORT=3000
EXPOSE 3000
CMD ["sh", "-c", "serve -s dist -l tcp://0.0.0.0:${PORT}"]
