FROM node:18-alpine AS common

RUN apk add lz4-libs

WORKDIR /app

COPY package*.json ./

FROM common AS build

RUN apk add python3 git make g++ linux-headers lz4-dev

# SIGH. https://github.com/npm/cli/issues/2774
RUN npm install -g npm@'^6.4.11'

RUN npm install
COPY . ./
RUN npm run build

FROM common

ENV NODE_ENV=production
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/build/ .

CMD node index.js
