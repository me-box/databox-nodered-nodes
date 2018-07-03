const forEachPromise = (items, fn, results = []) => {
    return items.reduce(function (promise, item) {
        return promise.then((x = []) => {
            return fn(item, [...results, ...x]);
        });
    }, Promise.resolve([]));
}

module.exports = function (RED) {

    "use strict";


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

        const toregister = (n.subtype || []).map(i => process.env[`DATASOURCE_${n.id}_${i}`]);
        //should be able to just create a client for one datasource and re-use for all;

        databox.HypercatToSourceDataMetadata(toregister[0]).then((data) => {
            profileSource = data
            return databox.NewKeyValueClient(profileSource.DataSourceURL, false)
        }).then((client) => {


            const read = (datasourceid, results) => {
                return new Promise((resolve, reject) => {
                    client.Read(datasourceid, "attribute").then((result) => {
                        resolve([...results, result]);
                    }).catch((err) => {
                        console.log("error reading for", datasourceid);
                        resolve([...results]);
                    });
                });
            }

            node.on('input', (msg) => {

                const toread = msg.payload && msg.payload.profiles ? msg.payload.profiles : n.subtype;
                console.log("** profile reading:", toread, " **");
                forEachPromise(toread, read).then((results) => {
                    //turn results into key,value
                    console.log("results are", JSON.stringify(results, null, 4));
                    const data = results.reduce((acc, item) => {
                        acc[item.key] = item.value;
                        return acc;
                    }, {});

                    console.log("sending payload:", data);

                    node.send({
                        name: n.name || "profile",
                        id: n.id,
                        payload: data,
                    });
                });
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
