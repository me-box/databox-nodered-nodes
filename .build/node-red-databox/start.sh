#!/bin/sh
cd /root/node-red-app-webserver/server
npm start &
cd /usr/src/node-red && npm start -- --userDir /data
