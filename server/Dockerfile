
FROM node:24-slim as builder

WORKDIR /flow

COPY package*.json ./


RUN npm i

COPY . .

EXPOSE 5001


CMD ["npm", "run","dev"]

