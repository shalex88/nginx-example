#!/bin/bash

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

start() {
    sudo systemctl start nginx
    node $SCRIPT_DIR/back-end/server.js &
    disown
}

stop() {
    sudo systemctl stop nginx

    NODE_PID=$(pgrep -f "node server.js")
    if [ -n "$NODE_PID" ]; then
        echo "Stopping existing node server.js process (PID: $NODE_PID)"
        kill -9 $NODE_PID
    fi
}

case "$1" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    *)
        echo "Usage: $0 {start|stop}"
        exit 1
        ;;
esac