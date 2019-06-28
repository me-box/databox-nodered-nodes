module.exports = function (RED) {

    "use strict";
    var request = require('request');
    var moment = require('moment');

    var url = require("url");

    function testing(node, n) {

        const API_URL = `${process.env.MOCK_DATA_SOURCE}/reading/latest`;

        const options = {
            method: 'post',
            body: { sensor_id: n.subtype },
            json: true,
            url: API_URL,
        }


        const periodic = setInterval(() => {
            request(options, (err, res, body) => {
                if (err) {
                    console.log(err, 'error posting json')
                } else {
                    if (body.length > 0) {
                        const result = body[0];
                        if (result.length > 0) {
                            const { time, value } = result[0];

                            node.send({
                                name: n.name || "osmonitor",
                                id: n.id,
                                subtype: n.subtype,
                                type: "osmonitor",
                                payload: {
                                    ts: moment.utc(time).unix(),
                                    value: Number(value),
                                },
                            });
                        }
                    }
                }
            });
        }, 3000);


        node.on("close", () => {
            console.log(`${node.id} stopping requests`);
            clearInterval(periodic);
        });
    }

    function OSMonitor(n) {

        console.log("creating new os monitor node");

        RED.nodes.createNode(this, n);

        if (process.env.TESTING) {
            console.log("running in test mode!");
            return testing(this, n);
        }

        const databox = require('node-databox');
        var periodic;

        this.name = n.name;
        const node = this;
       

        const cb = (data) => {

            console.log("nice, seen data");
            console.log(JSON.parse(data.data).data);

            const tosend = {
                name: n.name || "osmonitor",
                id: n.id,
                subtype: n.subtype,
                type: "osmonitor",
                payload: {
                    ts: Date.now(),
                    value: JSON.parse(data.data).data,
                }
            }
            node.send(tosend);
        }
        

        const hcatobj = JSON.parse(process.env[`DATASOURCE_${n.id}`]);
        console.log("getting hypercat to source data metadata", hcatobj);

        const monitorStream = databox.HypercatToSourceDataMetadata(hcatobj);

        console.log("have monitorstream", monitorStream);

        databox.NewStoreClient(monitorStream.DataSourceURL, process.env['DATABOX_ARBITER_ENDPOINT'], false).then((store)=>{
            return store.Observe(monitorStream.DataSourceMetadata.DataSourceID);
        }).then((emitter) => {
            console.log("now have emitter!");
            this.emitter = emitter;
            emitter.on('data', cb);
            emitter.on('error', (err) => {
                console.warn(err);
            });
        }).catch((err) => {
            console.warn("Error Observing ", monitorStream.DataSourceMetadata.DataSourceID, " ", err);
        });
           
        /* //return databox.NewTimeSeriesBlobClient(monitorStream.DataSourceURL, false)
        }).then((store) => {
            console.log("got store, so observing!");
            return store.Observe(monitorStream.DataSourceMetadata.DataSourceID)
        }).then((emitter) => {
            console.log("now have emitter!");
            this.emitter = emitter;
            emitter.on('data', cb);
            emitter.on('error', (err) => {
                console.warn(err);
            });
        }).catch((err) => {
            console.warn("Error Observing ", monitorStream.DataSourceMetadata.DataSourceID, " ", err);
        });*/


        this.on("close", () => {
            console.log(`${node.id} stopping requests`);
            this.emitter.removeListener("data", cb);
            clearInterval(periodic);
        });

    }

    // Register the node by name. This must be called beforeoverriding any of the
    // Node functions.
    RED.nodes.registerType("osmonitor", OSMonitor);
}
