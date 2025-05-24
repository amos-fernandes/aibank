# Etapa 1 – Build da aplicação
FROM node:18-alpine AS builder

# Criar diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependência
COPY ./frontend/package.json ./frontend/package-lock.json ./

# Instalar dependências
RUN npm ci

# Copiar todos os arquivos da aplicação
COPY ./frontend .

# Gerar build
RUN npm run build

# Etapa 2 – Imagem final otimizada
FROM node:18-alpine

# Definir diretório de trabalho
WORKDIR /app

# Copiar apenas o necessário do build
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist  # Ou .next se for Next.js
COPY --from=builder /app/public ./public

# Expor porta padrão do Vite ou Next.js
EXPOSE 3000

# Variáveis de ambiente
ENV PORT=3000
ENV NODE_ENV=production

# Comando para iniciar o servidor
CMD ["npm", "start"]
