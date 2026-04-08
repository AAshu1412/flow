
FROM node:24-slim as builder
WORKDIR /flow
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build 


FROM node:24-slim as production
WORKDIR /flow
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /flow/dist ./dist

EXPOSE 5001

CMD ["node", "dist/server.js"]

