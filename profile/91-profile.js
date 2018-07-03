const forEachPromise = (items, fn, results = []) => {
    return items.reduce(function (promise, item) {
        return promise.then((x = []) => {
            return fn(item, [...results, ...x]);
        });
    }, Promise.resolve([]));
}

module.exports = function (RED) {

    "use strict";
    var request = require('request');
    var url = require("url");

    function testing(node, n) {

    }

    function Profile(n) {

        console.log("creating profile node");

        RED.nodes.createNode(this, n);

        if (process.env.TESTING) {
            return testing(this, n);
        }

        const databox = require('node-databox');

        this.name = n.name;
        const node = this;

        let profileSource = null;
        let store = null;

        const toregister = (node.subtype || []).map(i => process.env[`DATASOURCE_${n.id}_${i}`]);
        //should be able to just create a client for one datasource and re-use for all;
        console.log("to register is", toregister);

        databox.HypercatToSourceDataMetadata(toregister[0]).then((data) => {
            profileSource = data
            console.log("creating profile store from", profileSource.DataSourceURL);
            return databox.NewKeyValueClient(profileSource.DataSourceURL, false)
        }).then((client) => {

            console.log("default profiles are", n.subtype);

            const read = (datasourceid, results) => {
                return new Promise((resolve, reject) => {
                    client.Read(datasourceid, "attribute").then((result) => {
                        console.log("result:", datasourceid, result);
                        resolve([...results, { key: datasourceid, value: result }]);
                    }).catch((err) => {
                        console.log("error reading for", datasourceid);
                        resolve([...results]);
                    });
                });
            }

            node.on('input', (msg) => {
                console.log("profile, seen input", msg);
                const toread = msg.payload && msg.payload.profiles ? msg.payload.profiles : n.subtype;
                console.log("to read is", toread);
                forEachPromise(toread, read).then((results) => {
                    //turn results into key,value
                    console.log("have results", results);
                    const data = results.reduce((acc, item) => {
                        acc[item.key] = item.value;
                        return acc;
                    }, {});
                    node.send({
                        name: n.name || "profile",
                        id: n.id,
                        payload: data,
                    });
                });

                /*client.Read("profileEyeColour", "attribute").then((result) => {
                    console.log("sending attribute!", result);
                    node.send({
                        name: n.name || "profile",
                        id: n.id,
                        payload: {
                            [result.key]: result.value
                        }
                    });
                }).catch((err) => {
                    console.log("error reading for", msg.payload.attribute);
                });*/
            });
        }).catch((err) => {
            console.warn("Error setting up stores", err);
        });

        this.on("close", () => {
            console.log(`${node.id} stopping requests`);
        });

    }

    // Register the node by name. This must be called beforeoverriding any of the
    // Node functions.
    RED.nodes.registerType("profile", Profile);

}
