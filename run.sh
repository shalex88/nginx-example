#!/bin/bash

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

start() {
    sudo nginx
    node $SCRIPT_DIR/back-end/http-controller.js &
    node $SCRIPT_DIR/back-end/back-end.js &
    disown
}

stop_nodejs() {
    process_name=$1
    node_pid=$(pgrep -f "node $process_name")
    if [ -n "$node_pid" ]; then
        echo "Stopping existing node $process_name process (PID: $node_pid)"
        kill -9 $node_pid
    fi
}

stop() {
    sudo killall nginx

    stop_nodejs back-end.js
    stop_nodejs http-controller.js
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