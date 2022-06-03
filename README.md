Monitor number of elements inside Zeebe DB

## Notable Tools
- Node
- RocksDB/Levelup
- Prometheus

## Run
- `docker build . -t zeebe-snapshots-monitor`

- Find a snapshot path and set the correct ENV
  - `export SNAPSHOT_PATH=PATH_TO_YOUR_SNAPSHOT`
- `docker-compose up`

## Prometheus

### Query samples
- Read DB times
  - `rate(db_read_duration_seconds_sum[5m]) / rate(db_read_duration_seconds_count[5m])`
  - `histogram_quantile(0.9, sum(rate(db_read_duration_seconds_bucket[5m])) by (le))`
