#!/bin/bash
if pgrep -x "powermetrics" > /dev/null; then
    exit 0
else
    nohup sudo powermetrics --samplers smc | awk '/CPU die temperature/ {print $0 > "/tmp/mactemp.txt"; fflush()}' > /dev/null 2>&1 &
fi
