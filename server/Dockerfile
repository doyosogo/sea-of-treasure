FROM node:lts-bookworm-slim

WORKDIR /app

COPY server/package*.json ./

RUN npm ci

COPY server/prisma ./prisma
COPY server/src ./src

RUN npx prisma generate

EXPOSE 3001

CMD ["npm", "start"]
