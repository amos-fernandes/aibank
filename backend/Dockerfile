# Etapa 1 – Build TypeScript
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar dependências
COPY backend/package.json backend/package-lock.json ./

RUN npm ci

# Copiar o código-fonte
COPY backend/ .

# Compilar TypeScript para JavaScript
RUN npm run build

# Etapa 2 – Runtime
FROM node:18-alpine

WORKDIR /app

# Copiar apenas o build e dependências
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Expor a porta (ajuste conforme necessário)
ENV PORT=8080
EXPOSE 8080

# Comando para iniciar o servidor
CMD ["node", "dist/index.js"]
