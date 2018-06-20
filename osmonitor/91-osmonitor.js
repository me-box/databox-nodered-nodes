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


        const periodic = setInterval(function () {
            request(options, function (err, res, body) {
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


        node.on("close", function () {
            console.log(`${node.id} stopping requests`);
            clearInterval(periodic);
        });
    }

    function OSMonitor(n) {

        console.log("creating os monitor node");

        RED.nodes.createNode(this, n);

        if (process.env.TESTING) {
            return testing(this, n);
        }

        const databox = require('node-databox');
        var periodic;


        this.name = n.name;
        const node = this;

        let monitorStore = null;

        databox.HypercatToSourceDataMetadata(process.env[`DATASOURCE_${n.id}`]).then((data) => {
            monitorStream = data
            console.log("creating monitor stream from", data.DataSourceURL);
            monitorStore = databox.NewTimeSeriesBlobClient(data.DataSourceURL, false)
            return monitorStore;
        }).then((store) => {
            return store.Observe(monitorStore.DataSourceMetadata.DataSourceID)
        }).then((emitter) => {
            emitter.on('data', (data) => {
                //new data!
                console.log("seen new data!", data);
                const tosend = {
                    name: n.name || "osmonitor",
                    id: n.id,
                    subtype: n.subtype,
                    type: "osmonitor",
                    payload: {
                        ts: Date.now(),
                        value: data[0].data,
                    }
                }
                console.log(tosend);
                node.send(tosend);
            });

            emitter.on('error', (err) => {
                console.warn(err);
            });
        }).catch((err) => {
            console.warn("Error Observing ", monitorStore.DataSourceMetadata.DataSourceID, " ", err);
        });
        /*new Promise((resolve,reject)=>{
            setTimeout(resolve,10000);
        }).then(()=>{
            var dataEmitter = null; 
            
            if (HREF_ENDPOINT != ''){
 
               
                var endpointUrl = url.parse(HREF_ENDPOINT);
                var dsID = API_ENDPOINT['item-metadata'].filter((itm)=>{return itm.rel === 'urn:X-databox:rels:hasDatasourceid'; })[0].val;
                var dsUrl = endpointUrl.protocol + '//' + endpointUrl.host;
                var dsType = API_ENDPOINT['item-metadata'].filter((itm)=>{return itm.rel === 'urn:X-databox:rels:hasType';})[0].val;
                
                
                //pull out the latest....
 
                periodic = setInterval(()=>{
                    databox.timeseries.latest(dsUrl, dsID).then((data)=>{
                        
 
                        const tosend = {
                            name: n.name || "osmonitor",
                            id:  n.id,
                            subtype: n.subtype,
                            type: "osmonitor",
                            payload: {
                                ts: Date.now(),
                                value: data[0].data, 
                            }
                        }
 
                      
 
                        node.send(tosend);   
                    })
                    .catch((err)=>{
                        console.log("[Error getting timeseries.latest]",dsUrl, dsID);
                        console.log("node", JSON.stringify(n,null,4));
                    });
                }, 3000);
            }
        });*/

        this.on("close", function () {
            console.log(`${node.id} stopping requests`);
            clearInterval(periodic);
        });

    }

    // Register the node by name. This must be called beforeoverriding any of the
    // Node functions.
    RED.nodes.registerType("osmonitor", OSMonitor);

}
