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

// If you use this as a template, update the copyright with your own name.
module.exports = function(RED) {
    
    "use strict";
    
    var net = require('net');
    var connected = false;
    var JsonSocket = require('json-socket');
    var url = require("url");
    var client =  new JsonSocket(new net.Socket());
    //var netstring = require("../utils/netstring");

    client.on("error", function(err){
        connected = false;
        console.log("error connecting, retrying in 2 sec");
        setTimeout(function(){connect()}, 2000);
    });
    
    client.on('uncaughtException', function (err) {
        connected = false;
        console.error(err.stack);
        setTimeout(function(){connect()}, 2000);
    });

    function connect(fn){
        connected = false;
        
        const endpoint = process.env.TESTING ? 'databox-test-server' : "127.0.0.1";

        client.connect(8435, endpoint, function() {
            console.log('***** plugs out connected *******');
            connected = true;
        
            if (fn){
                fn();
            }
        })
    }


    function testing (node, n){
        console.log("in testing, connecting");
        connect();

        node.on('input', function (msg) {
            console.log("plug, seen input", msg);

            const testmsg =  {
                actuator_id: n.id, 
                method: msg.type||n.subtype||"TP-SetPowerState", 
                channel:n.appId, 
                data: msg.payload || ""
            };

            console.log("sending test message", testmsg);

            sendmessage(testmsg);
        });

        node.on("close", function() {
            sendClose(n.appId);
        });
    }
   
    
    function Plugs(n) {

        console.log("creating plugout node");

        if (process.env.TESTING){
            console.log("in testing mode");
            return testing(this, n);
        }
        console.log("running on databox");
        const databox = require('node-databox');   
 		const API_ENDPOINT 	= JSON.parse(process.env[`DATASOURCE_${n.id}`]);
        const HREF_ENDPOINT = API_ENDPOINT.href || ''; 
        const endpointUrl = url.parse(HREF_ENDPOINT);   
        const actuationStore = endpointUrl.protocol + '//' + endpointUrl.host;
        const sensorID = API_ENDPOINT['item-metadata'].filter((pair) => pair.rel === 'urn:X-databox:rels:hasDatasourceid')[0].val;
  

        this.name = n.name;

        RED.nodes.createNode(this,n);
        var node = this;
       
		this.on('input', function (msg) {
			const value = msg.payload ? msg.payload : n.value ? n.value : null;
            
            databox.timeseries.write(actuationStore,sensorID,{data:value}).then((body)=>{
                console.log("success", body); 
            }).catch((err)=>{
                console.log("error");
                console.log(err);
                return;
            });
        });
        
        this.on("close", function() {
           
        });
    }

    function sendClose(channel){
        client.sendMessage({type: "message", msg:   {
                                                                    channel:channel, 
                                                                    type:"control", 
                                                                    payload:{
                                                                        command:"reset", 
                                                                        channel:channel
                                                                    }
                                                                }
                                        });
        
    }


    function sendmessage(msg){
        if (connected){
            client.sendMessage({type: "plugout", msg: msg});
        }
    }

    // Register the node by name. This must be called before overriding any of the
    // Node functions.
    RED.nodes.registerType("plugout",Plugs);
}