# Etapa de build
FROM node:18-alpine AS builder

WORKDIR /app

# Copia os arquivos de dependência
COPY package*.json ./

# Instala as dependências
RUN npm install

# Copia o restante do código
COPY . .

# Compila o TypeScript
RUN npm run build

# Etapa de produção
FROM node:18-alpine

WORKDIR /app

# Copia apenas os arquivos necessários da etapa de build
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Define a porta que o aplicativo irá escutar
ENV PORT=8080

# Comando para iniciar o servidor
CMD ["node", "dist/index.js"]
