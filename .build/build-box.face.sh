#!/bin/sh
docker build --no-cache -f Dockerfile.box.face --build-arg CACHEBUST=$(date +%s)  -t databox/redface .
#./deploy.sh