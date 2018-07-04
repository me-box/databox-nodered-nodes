#!/bin/sh
docker build -f Dockerfile.box --no-cache --build-arg CACHEBUST=$(date +%s)  -t databox/red .
#./deploy.sh
