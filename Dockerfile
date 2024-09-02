FROM node:lts-slim

WORKDIR /app

COPY ./*.js ./
COPY ./*.json ./

RUN mkdir -p data/personas

RUN npm ci

CMD ["node", "index.js"]
