FROM node:18-alpine

ENV NODE_ENV=production

WORKDIR /app
COPY package*.json ./
COPY start.sh ./

RUN npm install

COPY build/ ./

CMD /app/start.sh
