# Zeebe DB runtime monitor

Monitor number of elements inside Zeebe DB

## Notable Tools
- Node
- RocksDB/Levelup
- Prometheus

## Run
1. Copy the `.env.sample` file to `.env` and set the correct path to your Zeebe data
2. Choose one of the following:
- build and start the apps stack within Docker: `docker-compose up --build zeebe-db-monitor`
- start outside of Docker (easier to debug), on Debian, it will be:
  - ```sudo apt install liblz4-dev```
  - ```
    npx npm@6 install
    node --loader ts-node/esm src/index.ts
    ```
3. Go to
- 127.0.0.1:4000 for the grafana dashboards (Docker only)
- 127.0.0.1:9090 for the prometheus metric query (Docker only)
- 127.0.0.1:8080/metrics for the prometheus exporter inside the app, aka raw metrics

### How does this work ?

#### Folders
The tool use and need two folders:
- The RO folder: the folder where the app will find the zeebe database. It has to be ready-only, as we want 0 modifications on production files, we are only monitoring the DB files.
  - by ex.: a mounted RO folder in kubernetes, the same folder as used by Zeebe to save the data but in RO mode
  - use the env `ZEEBE_DATA_RO_PATH` to set it

#### Error management
To keep with inconsistency on disk access, the app never crash if the db is not available, but return empty values

## Prometheus

### Query samples
- Read DB times
  - `rate(zeebe_db_read_duration_seconds_sum[5m]) / rate(zeebe_db_read_duration_seconds_count[5m])`
  - `histogram_quantile(0.9, sum(rate(zeebe_db_read_duration_seconds_bucket[5m])) by (le))`

## Test

Under Docker:

1. [Obtain a production dump](https://confluence.epfl.ch:8443/pages/viewpage.action?pageId=176426019)
2. Run something like
   ```
   docker build -t zeebe-db-monitor .; \
   docker run --rm --name zeebe-db-monitor -i -p 8080:8080 -e ZEEBE_DATA_RO_PATH=/zeebe -v $HOME/Dev/PhDassess/snapshots/raft-partition/partitions/1/snapshots/237354356-1490-242489550-242489551:/zeebe:ro -- zeebe-db-monitor
   ```
3. Browse http://localhost:8080/
