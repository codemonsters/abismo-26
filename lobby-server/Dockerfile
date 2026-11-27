FROM node:24-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY main.js ./
COPY modules ./modules

ENV NODE_ENV=production
ENV PORT=9090
EXPOSE 9090

USER node
CMD ["node", "main.js"]
