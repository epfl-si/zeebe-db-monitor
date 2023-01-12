# Zeebe DB runtime monitor

Monitor number of elements inside Zeebe DB

## Notable Tools
- Node
- RocksDB/Levelup
- Prometheus

## Run
- Copy the `.env.sample` file to `.env` and set the correct path to your Zeebe data
- then choose to:
  - build and start the apps stack : `npm run build && docker-compose up --build zeebe-db-monitor`
  - start directly with `node --loader ts-node/esm src/index.ts`
- then, go to
  - 127.0.0.1:4000 for the grafana dashboards
  - 127.0.0.1:9090 for the prometheus metric query
  - 127.0.0.1:8080/metrics for the prometheus exporter inside the app, aka raw metrics

### How does this work ?

#### Folders
The tool use and need two folders:
- The RO folder: the folder where the app will find the zeebe database. It has to be ready-only, as we want 0 modifications on production files, we are only monitoring the DB files.
  - by ex.: a mounted RO folder in kubernetes, the same folder as used by Zeebe to save the data but in RO mode
  - use the env `ZEEBE_DATA_RO_PATH` to set it
- The RW folder
  - the folder where the app will create necessary files to be able to read the zeebe database. The trick here is about the zeebeDb reader library : it needs to write files around the DB being read.
  - it needs all the zeebe data files, so this where the app will create the symlink between from the RO folder
  - by ex.: a mounted RW folder in kubernetes
  - use the env `ZEEBE_DATA_RW_BASE_PATH` to set it

#### Error management
To keep with inconsistency on disk access, the app never crash if the db is not available, but return empty values

## Prometheus

### Query samples
- Read DB times
  - `rate(db_read_duration_seconds_sum[5m]) / rate(db_read_duration_seconds_count[5m])`
  - `histogram_quantile(0.9, sum(rate(db_read_duration_seconds_bucket[5m])) by (le))`

## Deploy
### Openshift test namespace
`npm run build-and-deploy-on-openshift-test`
