# frontend/Dockerfile


FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

#Копируем весь код гыггы

COPY . .

# Открываем порт Vite dev server

EXPOSE 5173

# Запускаем dev сервер с hot reload
CMD ["npm", "run", "dev"]
