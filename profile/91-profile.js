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

        databox.HypercatToSourceDataMetadata(process.env[`DATASOURCE_${n.id}`]).then((data) => {
            profileSource = data
            console.log("creating profile store from", profileSource.DataSourceURL);
            return databox.NewKeyValueClient(profileSource.DataSourceURL, false)
        }).then((client) => {
            console.log("now have kv client for source", profileSource);
            console.log("am now listening for inputs!!");

            node.on('input', (msg) => {

                client.Read(/*msg.payload.attribute*/"profileEyeColour", "attribute").then((result) => {
                    console.log("sending attribute!", result);
                    node.send({
                        name: n.name || "profile",
                        id: n.id,
                        payload: result
                    });
                }).catch((err) => {
                    console.log("error reading for", msg.payload.attribute);
                });
            });
        });

        this.on("close", () => {
            console.log(`${node.id} stopping requests`);
        });

    }

    // Register the node by name. This must be called beforeoverriding any of the
    // Node functions.
    RED.nodes.registerType("profile", Profile);

}
