#!/bin/sh
docker build --no-cache -f Dockerfile.box --build-arg CACHEBUST=$(date +%s)  -t databox/red .
#./deploy.sh
