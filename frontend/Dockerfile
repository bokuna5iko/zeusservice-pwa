# ==================== STAGE 1: BUILD ====================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# ==================== STAGE 2: SERVE ====================
FROM nginx:alpine

# Копируем собранную статику из Stage 1
COPY --from=builder /app/dist /usr/share/nginx/html

# Копируем кастомный nginx.conf для frontend (опционально, если нужен)
# COPY nginx-frontend.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
