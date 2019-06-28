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
                                name: n.name || "browserwebcam",
                                id: n.id,
                                subtype: n.subtype,
                                type: "browserwebcam",
                                payload: {
                                    ts: moment.utc(time).unix(),
                                    image: value,
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

    function BrowserWebcam(n) {

        console.log("creating os browserwebcam node");

        RED.nodes.createNode(this, n);

        if (process.env.TESTING) {
            return testing(this, n);
        }

        const databox = require('node-databox');
        var periodic;


        this.name = n.name;
        const node = this;


        let webcamStream = null;

        const cb = (data) => {

            console.log("seen some webcam data!!");

            const tosend = {
                name: n.name || "browserwebcam",
                id: n.id,
                subtype: n.subtype,
                type: "browserwebcam",
                payload: {
                    ts: Date.now(),
                    image: JSON.parse(data.data).data,
                }
            }
            node.send(tosend);
        }

        databox.HypercatToSourceDataMetadata(JSON.parse(process.env[`DATASOURCE_${n.id}`])).then((data) => {
            console.log("creating kv client!");
            webcamStream = data
            return databox.NewKeyValueClient(webcamStream.DataSourceURL, false)
        }).then((store) => {
            console.log("observing changes in browser store");
            return store.Observe(webcamStream.DataSourceMetadata.DataSourceID)
        }).then((emitter) => {
            console.log("got emitter!");
            this.emitter = emitter;
            emitter.on('data', cb);
            emitter.on('error', (err) => {
                console.warn(err);
            });
        }).catch((err) => {
            console.warn("Error Observing ", webcamStream.DataSourceMetadata.DataSourceID, " ", err);
        });


        this.on("close", () => {
            console.log(`${node.id} stopping requests`);
            this.emitter.removeListener("data", cb);
            clearInterval(periodic);
        });

    }

    // Register the node by name. This must be called before overriding any of the
    // Node functions.
    RED.nodes.registerType("browserwebcam", BrowserWebcam);

}
