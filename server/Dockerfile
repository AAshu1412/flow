
FROM node:24-slim as builder
WORKDIR /flow
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build


FROM node:24-slim as production
WORKDIR /flow
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile
COPY --from=builder /flow/dist ./dist

EXPOSE 5001

CMD ["node", "dist/server.js"]

