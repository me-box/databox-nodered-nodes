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
    var ipc = require('node-ipc');
   
    function Bulbs(n) {

    	this.name = n.name;
        RED.nodes.createNode(this,n);
        var node = this;

    	const API_ENDPOINT = JSON.parse(process.env[`DATASOURCE_${n.id}`] || '{}');
    	const actuationStore = ((url) => url.protocol + '//' + url.host)(url.parse(API_ENDPOINT.href));
    	const sensorID = API_ENDPOINT['item-metadata'].filter((pair) => pair.rel === 'urn:X-databox:rels:hasDatasourceid')[0].val;

    	console.log(`store: ${actuationStore}`);
    	console.log(`sensorID: ${sensorID}`);

        ipc.config.id   = 'webserver';
    	ipc.config.retry= 1500;
    	ipc.config.silent=true;
    	
        if (process.env.TESTING){
        	ipc.connectTo(
            'webserver',
             function(){
             	ipc.of.webserver.on(
                	'connect',
                	function(){
                    	console.log("connected to webserver!!");
                	}
           	 	);
        	});
        }
        
		this.on('input', function (msg) {
			
			if (process.env.TESTING){
				const testmsg =  {actuator_id: n.id, method: msg.type||n.subtype||"", channel:n.appId, data: msg.payload ? msg.payload : n.value ? n.value : null};
				sendmessage(ipc,testmsg);
				return;
			}

			const value == msg.type||n.subtype||"", data: msg.payload ? msg.payload : n.value ? n.value : null
			
			databox.timeseries.write(actuationStore,sensorID,{data:value})
		    .then((body)=>{
		        res.send("<h2>OK > " + body + "</h2>");
		    })
		    .catch((error)=>{
		        res.send("<h2>ERROR::" + error + "</h2>");
		    });
		
       	});
        
        this.on("close", function() {
        	if (process.env.TESTING){
				sendClose(ipc, n.appId);
			}
        });
    }
    
    function sendClose(ipc, channel){
		try{
		  ipc.of.webserver.emit('message',JSON.stringify({channel:channel, type:"control", payload:{command:"reset", channel:channel}}));
		  console.log("scuccessfully sent close message to socket");
		}catch(err){
			console.log("error sending close messsage");
			console.log(err);
		}finally{
			ipc.of.webserver.destroy;
		}
	}

	function sendmessage(ipc, msg){
		try{
		  ipc.of.webserver.emit('bulbsout',JSON.stringify(msg));
		  console.log("scuccessfully sent message to socket");
		}catch(err){
			console.log("error sending bulbsout messsage");
			console.log(err);
		}
	}
	
    // Register the node by name. This must be called before overriding any of the
    // Node functions.
    RED.nodes.registerType("bulbsout",Bulbs);
}