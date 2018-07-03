/**
 * Copyright 2016 Tom Lodge
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

module.exports = function (RED) {

    "use strict";

    function PersonalFlow(n) {

        console.log("creating personal flow node");
        // Create a RED node
        RED.nodes.createNode(this, n);


        var node = this;

        if (process.env.TESTING) {
            console.log("not doing anything...am testing!");
            return;
        } else {
            //init databox
            const databox = require('node-databox');
            let personalDatastore = {}

            databox.HypercatToSourceDataMetadata(process.env[`DATASOURCE_${n.id}`]).then((data) => {
                personalDatastore = data
                console.log("creating monitor store from", personalDatastore.DataSourceURL);
                return databox.NewTimeSeriesBlobClient(personalDatastore.DataSourceURL, false)
            }).then((store) => {
                return store.Observe(personalDatastore.DataSourceMetadata.DataSourceID)
            }).then((emitter) => {
                emitter.on('data', (data) => {

                    const tosend = {
                        name: n.name || "personalflow",
                        id: n.id,
                        subtype: n.subtype,
                        type: "personalflow",
                        payload: {
                            ts: Date.now(),
                            values: JSON.parse(data.data),
                        }
                    }
                    console.log("personal flow sending", tosend);
                    node.send(tosend);
                });

                emitter.on('error', (err) => {
                    console.warn(err);
                });
            }).catch((err) => {
                console.warn("Error Observing ", personalDatastore.DataSourceMetadata.DataSourceID, " ", err);
            });
        }

        this.on("close", function () {
            console.log("personal flow...closing");
        });

    }

    // Register the node by name. This must be called before overriding any of the
    // Node functions.
    console.log("registering personal flow!");
    RED.nodes.registerType("personalflow", PersonalFlow);

}
