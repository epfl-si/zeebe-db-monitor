Monitor number of elements inside Zeebe DB

## Tools
- Node
- Prometheus (WIP)

## Run
- `docker build . -t zeebe-snapshots-monitor`

- Find a snapshot path and set the correct ENV
  - export SNAPSHOT_PATH=PATH_TO_YOUR_SNAPSHOT
- Run the tests  inside Docker, as a RO volume is a prerequiste when working with Zeebe data from prod)
- `docker run -it --rm -v $(pwd):/app -v $SNAPSHOT_PATH:/snapshots-ro:ro zeebe-snapshots-monitor -e SNAPSHOT_PATH`


export SNAPSHOT_PATH=/home/del/workspace/tmp/snapshots_for_snapshots_monitor && docker run -it --rm -v $(pwd):/app -v $SNAPSHOT_PATH:/snapshots-ro:ro zeebe-snapshots-monitor
