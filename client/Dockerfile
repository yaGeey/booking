# TODO! Використовувати сервер на основі serve або nginx, який просто віддає статичні файли з dist.
# pnpm add -D serve
# "serve": "serve -s dist -l 3000"

FROM node:22-slim

WORKDIR /usr/src/app

RUN npm install -g pnpm
RUN npm install -g serve

COPY package*.json ./
COPY pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

ENV NODE_ENV=production

RUN pnpm run build

EXPOSE 3000

CMD ["pnpm", "run", "serve"]