Monitor number of elements inside Zeebe DB

## Notable Tools
- Node
- RocksDB/Levelup
- Prometheus

## Run
- `docker build . -t zeebe-snapshots-monitor`

- Find a snapshot path and set the correct ENV
  - or `export ZEEBE_DATA_PATH=/home/del/workspace/PhDAssess/docker/volumes/zeebe_data`
  - or `export ZEEBE_DATA_PATH=/home/del/workspace/tmp/snapshots_for_snapshots_monitor`
- `docker-compose up`
- then, go to 
  - 127.0.0.1:4000 for the dashboards
  - 127.0.0.1:9090 for the metric query
  - 127.0.0.1:8080/metrics for raw metrics

## Prometheus

### Query samples
- Read DB times
  - `rate(db_read_duration_seconds_sum[5m]) / rate(db_read_duration_seconds_count[5m])`
  - `histogram_quantile(0.9, sum(rate(db_read_duration_seconds_bucket[5m])) by (le))`
