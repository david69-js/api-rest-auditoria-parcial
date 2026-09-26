# ---- Imagen base ----
FROM node:22-alpine

# Directorio de trabajo dentro del contenedor
WORKDIR /app

# Instala solo dependencias de producción (aprovecha la caché de capas)
COPY package*.json ./
RUN npm install --omit=dev

# Copia el resto del código
COPY . .

# Railway inyecta la variable PORT; la exponemos por documentación
ENV NODE_ENV=production
EXPOSE 3000

# Ejecuta como usuario no-root (más seguro)
USER node

CMD ["npm", "start"]
