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
    var request = require('request');
  
   	var databox = require('node-databox');
 	var url = require("url");
	var client = new net.Socket();
    var connected = false;

 	function connect(fn){
        connected = false;
        
        client.connect(8435, 'databox-test-server', function() {
            console.log('***** Connected *******');
            connected = true;
            if (fn){
            	fn();
            }
        }).on("error", function(err){
        	console.log("error connecting, retrying in 2 sec");
        	setTimeout(function(){connect(fn)}, 2000);
        });
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

    	this.name = n.name;
        RED.nodes.createNode(this,n);
        var node = this;

        if (process.env.TESTING){
        	return testing(this, n);
        }
        const API_ENDPOINT = JSON.parse(process.env[`DATASOURCE_${n.id}`] || '{}');
		const HREF_ENDPOINT = API_ENDPOINT.href || ''; 
        const endpointUrl = url.parse(HREF_ENDPOINT);
    	const actuationStore = endpointUrl.protocol + '//' + endpointUrl.host;
    	const sensorID = API_ENDPOINT['item-metadata'].filter((pair) => pair.rel === 'urn:X-databox:rels:hasDatasourceid')[0].val;
    	
		this.on('input', function (msg) {
			
			const value = msg.payload ? msg.payload : n.value ? n.value : null;
			
			databox.timeseries.write(actuationStore,sensorID,{data:value})
		    .then((body)=>{
		   
		    })
		    .catch((error)=>{
		      console.log("error");
		      console.log(err);
		    });
		
       	});
    }
    
    function sendClose(channel){
		try{
		  client.write(JSON.stringify({type: "message", msg: 	{
		  															channel:channel, 
		  															type:"control", 
		  															payload:{
		  																command:"reset", 
		  																channel:channel
		  															}
		  														}
		  								})).on(function(error){
		  									console.log('error writing to socket', error); 
		  									connect(function(){sendClose(channel)});
		  								});

		}catch(err){
			console.log("error sending close messsage");
			console.log(err);
		}finally{
			
		}
	}


    function sendmessage(msg){
        if (connected){
            try{
                client.write(JSON.stringify({type: "bulbsout", msg: msg})).on("error", function(err){
                	console.log('error writing to socket', err); 
                	connect(function(){sendmessage(msg)});
                });
            }catch(err){
                console.log("error sending", err);
                connect();
            }
	    }
	}
	
    // Register the node by name. This must be called before overriding any of the
    // Node functions.
    RED.nodes.registerType("bulbsout",Bulbs);
}