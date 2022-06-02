#!/bin/sh

# Use to create the symlink and start the app (tests)
ln -s /snapshots-ro /snapshots-rw
# set the new RW folder as the one to use
export SNAPSHOT_PATH=/snapshots-rw
exec npm test
