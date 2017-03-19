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
	
module.exports = function(RED) {
    
    "use strict";
    var request = require('request');
    var ipc = require('node-ipc');
    
    function PipstaPrint(n) {

 		const API_ENDPOINT 	= process.env.TESTING ? {} : JSON.parse(process.env[`DATASOURCE_${n.id}`]);
        const API_URL 		= process.env.TESTING ? `${process.env.MOCK_DATA_SOURCE}/actuate` : `http://${API_ENDPOINT.hostname}${API_ENDPOINT.api_url}/actuate`;
        const SENSOR_ID 	= process.env.TESTING ? n.subtype : API_ENDPOINT.sensor_id;

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
        
        this.name = n.name;

        RED.nodes.createNode(this,n);
        var node = this;
       
		this.on('input', function (msg) {
			
        	const options = {
  				method: 'post',
  				body: {actuator_id: SENSOR_ID, method: msg.type||n.subtype||"", data: msg.payload ? msg.payload : n.value ? n.value : null},
  				json: true,
  				url: API_URL,
			}
			
			if (process.env.TESTING){
				const testmsg =  {actuator_id: n.id, method: msg.type||n.subtype||"", channel:n.appId, data: msg.payload ? msg.payload : n.value ? n.value : null};
				sendmessage(ipc,testmsg);
			}
			
			console.log(options);
			request(options, function (err, res, body) {
						if (err) {
							console.log(err, 'error posting json')
						}else{
							console.log(body);
						}
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
		  ipc.of.webserver.emit('pipstaprint',JSON.stringify(msg));
		  console.log("scuccessfully sent message to socket");
		}catch(err){
			console.log("error sending bulbsout messsage");
			console.log(err);
		}
	}
    // Register the node by name. This must be called before overriding any of the
    // Node functions.
    RED.nodes.registerType("pipstaprint",PipstaPrint);
}