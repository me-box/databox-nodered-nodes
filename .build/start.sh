#!/bin/sh
cd /root/sdk-app-webserver/server
npm start &
cd /usr/src/node-red && npm start -- --userDir /data
