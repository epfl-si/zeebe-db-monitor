ARG BASE_IMAGE=node:24-trixie

FROM $BASE_IMAGE AS common

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \
    rocksdb-tools \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
RUN mkdir -p out
COPY package*.json ./

FROM common AS build

RUN npm install
COPY . ./
RUN npm run build

FROM common

ENV NODE_ENV=production
RUN npm install
COPY --from=build /app/build/ .

ENV ZEEBE_DB_MONITOR_SNAPSHOT_PATH=/data

CMD ["node", "index.js", "watch"]
