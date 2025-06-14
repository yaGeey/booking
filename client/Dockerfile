FROM node:22-slim

WORKDIR /usr/src/app

RUN npm install -g pnpm

COPY package*.json ./

RUN pnpm install

COPY . .

EXPOSE 3000

CMD ["sh", "-c", "pnpm start"]