# Zeebe DB runtime monitor

Monitor number of elements inside Zeebe DB

## Notable Tools
- Node
- RocksDB/Levelup
- Prometheus

## Run
- Copy the `.env.sample` file to `.env` and set the correct path to your Zeebe data
- then, build and start the apps stack : `npm run build && docker-compose up --build zeebe-db-monitor`
- then, go to 
  - 127.0.0.1:4000 for the grafana dashboards
  - 127.0.0.1:9090 for the prometheus metric query
  - 127.0.0.1:8080/metrics for the prometheus exporter inside the app, aka raw metrics

## Prometheus

### Query samples
- Read DB times
  - `rate(db_read_duration_seconds_sum[5m]) / rate(db_read_duration_seconds_count[5m])`
  - `histogram_quantile(0.9, sum(rate(db_read_duration_seconds_bucket[5m])) by (le))`

## Deploy
### Openshift test namespace
`npm run build-and-deploy-on-openshift-test`
