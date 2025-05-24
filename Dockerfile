# Etapa 1 – Build da aplicação
FROM node:18-alpine AS builder
WORKDIR /app

# Copiar dependências e config
COPY frontend/src/package.json frontend/src/package-lock.json ./
COPY frontend/src/tsconfig.json frontend/src/tsconfig.app.json ./
COPY frontend/vite.config.ts ./


# Instalar dependências
RUN npm ci

# Copiar o restante
COPY ./frontend .

# Build da aplicação
RUN npm run build

# Etapa 2 – Imagem final com servidor estático
FROM node:18-alpine
WORKDIR /app

# Instalar servidor estático (serve)
RUN npm install -g serve

# Copiar arquivos do build
COPY --from=builder /app/dist ./dist

# Expor porta padrão
EXPOSE 8080

# Rodar servidor
CMD ["sh", "-c", "serve -s dist -l ${PORT:-8080}"]
