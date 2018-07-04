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
    var net = require('net');

    var connected = false;
    var JsonSocket = require('json-socket');
    var client = new JsonSocket(new net.Socket());
    //var netstring = require("../utils/netstring");

    client.on("error", function (err) {
        connected = false;
        console.log("app: error connecting, retrying in 2 sec");
        setTimeout(function () {
            if (!connected) {
                console.log("app: attempting reconnect now")
                connect()
            }
        }, 2000);
    });

    client.on('uncaughtException', function (err) {
        connected = false;
        console.log("app: uncaught exception", err.stack);
        setTimeout(function () {
            if (!connected) {
                console.log("app uce: attempting reconnect now")
                connect()
            }
        }, 2000);
    });

    function connect(fn) {
        connected = false;

        const endpoint = process.env.TESTING ? 'databox-test-server' : "127.0.0.1";

        client.connect(8435, endpoint, function () {
            connected = true;
            console.log("app: successfully connected to testserver");

            if (fn) {
                fn();
            }
        })
    }

    function CompanionApp(n) {

        console.log("creating app node");
        // Create a RED node
        RED.nodes.createNode(this, n);

        connect(function () {
            sendmessage({ type: "control", payload: { command: "init", data: { id: n.id, layout: n.layout } } });
        });


        // Store local copies of the node configuration (as defined in the .html)
        this.appId = n.appId;
        this.layout = n.layout;
        var node = this;

        var fallbackId = (1 + Math.random() * 42949433295).toString(16);

        if (process.env.TESTING) {
            this.on('input', function (m) {

                var msg = {
                    channel: node.appId,
                    sourceId: m.sourceId || fallbackId,
                    type: "data",
                    payload: {
                        id: node.id,
                        name: node.name || "app",
                        view: m.type || "text",
                        data: m.payload,
                        channel: node.appId,
                    }
                }
                sendmessage(msg);
            });
        } else {
            //init databox

            const databox = require('node-databox');
            let loggerActuator = {};

            databox.HypercatToSourceDataMetadata(process.env[`DATASOURCE_personalLoggerActuator`])
                .then((data) => {
                    loggerActuator = data;
                    return databox.NewTimeSeriesBlobClient(loggerActuator.DataSourceURL, false)
                }).then((client) => {

                    this.on('input', function (m) {

                        var msg = {
                            channel: node.appId,
                            sourceId: m.sourceId || fallbackId,
                            type: "data",
                            payload: {
                                id: node.id,
                                name: node.name || "app",
                                view: m.type || "text",
                                data: m.payload,
                                channel: node.appId,
                            }
                        }
                        sendmessage(msg);

                        const { hops = [] } = node.path();
                        const personalpath = hops.reduce((acc, item) => {
                            if (item.ptype && item.ptype.length > 0) {
                                return [...acc, { source: item.source, target: item.target, ptype: item.ptype }]
                            }
                            return acc;
                        }, []);

                        if (personalpath.length > 0) {

                            client.Write(loggerActuator.DataSourceMetadata.DataSourceID, { app: process.env.DATABOX_LOCAL_NAME, path: personalpath }).then((body) => {
                            }).catch((error) => {
                                console.log("failed to write to actuator", error);
                            });
                        }
                    });
                });
        }

        this.on("close", function () {
            sendmessage({ channel: node.appId, type: "control", payload: { command: "reset", channel: node.appId } });
            console.log("companion app closing");
            client.disconnect();
        });

    }

    function sendmessage(msg) {

        if (connected) {
            client.sendMessage({ type: "message", msg: msg });
            //client.write({type: "message", msg: msg});
        }
    }

    // Register the node by name. This must be called before overriding any of the
    // Node functions.
    RED.nodes.registerType("app", CompanionApp);

}
