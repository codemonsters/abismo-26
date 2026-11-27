FROM node:24-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY main.js ./
COPY modules ./modules

# Archivo de log con rotación por tamaño (ver modules/logger.js). Montar /app/logs como volumen para verlo desde el host.
RUN mkdir -p /app/logs && chown node:node /app/logs

ENV NODE_ENV=production
ENV PORT=9090
ENV LOG_FILE=/app/logs/lobby-server.log
ENV LOG_MAX_SIZE=5m
ENV LOG_MAX_FILES=5
EXPOSE 9090

USER node
CMD ["node", "main.js"]
