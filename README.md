# Zeebe DB runtime monitor

Export or Monitor a Zeebe DB

## Notable Tools
- Node.js
- [ldb from rocksdb](https://www.github.com/facebook/rocksdb/wiki/Administration-and-Data-Access-Tool#ldb-tool)
- Prometheus

## Run

### As a snapshot to JSON exporter

- In a Node.js setup:
  ```
    export ZEEBE_DB_MONITOR_SNAPSHOT_PATH=/path_to_your_snapshot; tsx src/index.ts export --limit 10 --columnFamilyName INCIDENTS
  ```
- With Docker:
  ```
    docker build . -t rocksdb-ldb
    docker run --rm -it -v /path_to_your_snapshot:/data rocksdb-ldb node index.js export --limit 10 --columnFamilyName INCIDENTS
  ```

### As Prometheus snapshot watcher
- In a Node.js setup:
  ```
    export ZEEBE_DB_MONITOR_SNAPSHOT_PATH=/path_to_your_snapshot; tsx src/index.ts watch
  ```
- With Docker:
  ```
    docker run --rm --init -it -v /path_to_your_snapshot:/data -p 8081:8081 rocksdb-ldb
  ```

- 127.0.0.1:4000 for the grafana dashboards (Docker Compose only)
- 127.0.0.1:9090 for the prometheus metric query (Docker Compose only)
- 127.0.0.1:8081/metrics for the prometheus exporter inside the app, aka raw metrics

#### Configure

| Env vars                                         |                                                               |
|--------------------------------------------------|---------------------------------------------------------------|
| ZEEBE_DB_MONITOR_SNAPSHOT_PATH                   | path to your snapshot, where the 'CURRENT' file resides       |
| ZEEBE_DB_MONITOR_DECODER_SHOW_WARNING_IN_CONSOLE | shows the warnings in console.log. Default: false             |
| ZEEBE_DB_MONITOR_LDB_RESULTS_CACHE_TTL           | Time in ms that the ldb operations are cached. Default: 15000 |
| ---------------------------------------          | ---------------------------------------------------------     |

### How does this work?

#### Error management
To keep with inconsistency on disk access, the app never crashes if the db is not available but returns empty values

## Prometheus

### Query samples
- Read DB times
  - `rate(zeebe_db_read_duration_seconds_sum[5m]) / rate(zeebe_db_read_duration_seconds_count[5m])`
  - `histogram_quantile(0.9, sum(rate(zeebe_db_read_duration_seconds_bucket[5m])) by (le))`

## Test

1. Run something like
   ```
   npm run test
   ```
