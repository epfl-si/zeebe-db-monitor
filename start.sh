#!/bin/sh

# Use to create the symlink and start the app (tests)
ln -s /snapshots-ro /snapshots-rw
exec npm test
