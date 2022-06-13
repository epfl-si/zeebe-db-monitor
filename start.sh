#!/bin/sh

# Use to create the symlink and start the app (tests)
rm -rf /zeebe-data-rw
ln -s /zeebe-data-ro /zeebe-data-rw
chmod -R 777 /zeebe-data-rw

# set the new RW folder as the one to use
export ZEEBE_DATA_PATH=/zeebe-data-rw
exec npm start


# monitor for changes, so we can get ?
# TODO: use ln or cp instead of RSYNC
# -> to dockerFile ? : RUN apk update && apk add inotify-tools
#cp -rs --reflink /zeebe-data-ro/ /zeebe-data-rw/
#cp -rs --reflink=always /zeebe-data-ro/ /zeebe-data-rw/
#lndir /zeebe-data-ro /zeebe-data-rw
# inotifywait -rm -e CLOSE_WRITE --format "%w" source | stdbuf -o0 sed 's@/$@@'| xargs -n1 -I{} rsync -Rva {} destination
# from https://stackoverflow.com/questions/66788981/can-i-use-cp-in-bash-to-watch-files-and-folders-and-upon-changes-copy-them-ot
