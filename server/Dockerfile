FROM node:22-alpine

WORKDIR /usr/src/app

COPY package.json package-lock.json ./

# ENV NODE_ENV=production
# RUN npm install -g ts-node
# npm ci - only prod
# RUN npm ci
RUN npm install && npm cache clean --force

COPY . .
# TODO not production ready

CMD ["sh", "-c", "npm run db:deploy && npm run build"]