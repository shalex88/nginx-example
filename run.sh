#!/bin/bash

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

start() {
    sudo systemctl start nginx
    node $SCRIPT_DIR/back-end/http-controller.js &
    node $SCRIPT_DIR/back-end/back-end.js &
    disown
}

stop() {
    sudo systemctl stop nginx

    NODE_PID=$(pgrep -f "node back-end")
    if [ -n "$NODE_PID" ]; then
        echo "Stopping existing node back-end.js process (PID: $NODE_PID)"
        kill -9 $NODE_PID
    fi

    NODE_PID=$(pgrep -f "node http-controller.js")
    if [ -n "$NODE_PID" ]; then
        echo "Stopping existing node http-controller.js process (PID: $NODE_PID)"
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