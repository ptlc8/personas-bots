FROM node:lts-slim

WORKDIR /app

RUN mkdir -p data/personas

COPY ./package*.json ./
RUN npm ci

COPY ./*.js ./
COPY ./*.json ./

CMD ["node", "index.js"]
