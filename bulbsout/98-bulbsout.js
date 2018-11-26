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
            console.log('***** bulbs out connected *******');
            connected = true;
        
            if (fn){
                fn();
            }
        })
    }


    function testing (node, n){
    	
    	connect();

		node.on('input', function (msg) {
			const testmsg =  {actuator_id: n.id, method: msg.type||n.subtype||"", channel:n.appId, data: msg.payload ? msg.payload : n.value ? n.value : null};
			sendmessage(testmsg);
       	});

		node.on("close", function() {
			sendClose(n.appId);
        });
    }

    
    function Bulbs(n) {
        console.log("creating new bulbs out node");
        this.name = n.name;
        RED.nodes.createNode(this,n);
        var node = this;

        if (process.env.TESTING){
            return testing(this, n);
        }

        const databox = require('node-databox');    
        
        const DATASOURCE_BULBSOUT = process.env[`DATASOURCE_${n.id}`];


        databox.HypercatToSourceDataMetadata(DATASOURCE_BULBSOUT).then((data)=>{

            console.log("bulbsout --> got hypercat data!");

            const DS_Metadata = data.DataSourceMetadata;
            
            const store_url = data.DataSourceURL;
            const tsc = databox.NewTimeSeriesBlobClient(store_url, false);
            
            this.on('input', function (msg) {
                
                const value = msg.payload ? msg.payload : n.value ? n.value : null;
            
                console.log("BULBS actuating", DS_Metadata.DataSourceID, {data:value});
                
                
                tsc.Write(DS_Metadata.DataSourceID,{data:value}).then((body)=>{
           
                }, (err)=>{
                    console.log("error actuating:", err);
                }).catch((error)=>{
                    console.log("error");
                    console.log(error);
                });
            });
        });
    }

    function sendClose(channel){
		client.sendMessage({type: "message", msg: 	{
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
            client.sendMessage({type: "bulbsout", msg: msg});
	    }
	}
	
    // Register the node by name. This must be called before overriding any of the
    // Node functions.
    RED.nodes.registerType("bulbsout",Bulbs);
}