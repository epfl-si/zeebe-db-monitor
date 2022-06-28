#!/bin/sh

mkdir -p /zeebe-data-rw  # for dev, as we may have an empty dir. In prod, it should be a volume

# Use to create the symlink and start the app (tests)
ln -sf /zeebe-data-ro/* /zeebe-data-rw

# set the new RW folder as the one to use
export ZEEBE_DATA_PATH=/zeebe-data-rw
exec node index.js

# tried with or without success, keep a list of idea

# -> to dockerFile ? : RUN apk update && apk add inotify-tools
# inotifywait -rm -e CLOSE_WRITE --format "%w" source | stdbuf -o0 sed 's@/$@@'| xargs -n1 -I{} rsync -Rva {} destination
# from https://stackoverflow.com/questions/66788981/can-i-use-cp-in-bash-to-watch-files-and-folders-and-upon-changes-copy-them-ot

#cp -rs --reflink /zeebe-data-ro/ /zeebe-data-rw/
#cp -rs --reflink=always /zeebe-data-ro/ /zeebe-data-rw/

#lndir /zeebe-data-ro /zeebe-data-rw
