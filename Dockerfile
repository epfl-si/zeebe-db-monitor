FROM node:18-alpine

WORKDIR /app
ADD . /app

RUN npm install

CMD /app/start.sh
