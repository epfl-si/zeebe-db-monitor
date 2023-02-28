FROM node:18-alpine AS common
WORKDIR /app

COPY package*.json ./

FROM common AS build

RUN apk add python3 git make g++ linux-headers

RUN npm install
COPY . ./
RUN npm run build

FROM common

ENV NODE_ENV=production
RUN npm install

COPY --from=build /app/build/ .

CMD node index.js
