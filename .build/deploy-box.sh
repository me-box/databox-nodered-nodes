#!/bin/sh
docker tag databox/red registry.upintheclouds.org/databox/red && docker push registry.upintheclouds.org/databox/red
docker tag databox/red registry.iotdatabox.com/databox/red && docker push registry.iotdatabox.com/databox/red
