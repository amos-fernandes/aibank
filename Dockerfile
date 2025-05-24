# Etapa 1 – Build da aplicação
FROM node:18-alpine AS builder
WORKDIR /app

# Copiar dependências e config
COPY ./frontend/package.json ./frontend/package-lock.json ./
COPY ./frontend/tsconfig.json ./frontend/tsconfig.app.json ./
COPY ./frontend/vite.config.ts ./

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
EXPOSE 3000

# Rodar servidor
CMD ["serve", "-s", "dist", "-l", "3000"]
