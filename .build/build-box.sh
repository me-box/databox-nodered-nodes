#!/bin/sh
docker build -f Dockerfile.box --build-arg CACHEBUST=$(date +%s)  -t databox/red .
#./deploy.sh
