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
    var WebSocket = require('ws');
    
    function Twitter(n) {
    
        const API_ENDPOINT 	= process.env.TESTING ? {} : JSON.parse(process.env[`DATASOURCE_${n.id}`]);
        const API_URL 		= process.env.TESTING ? `${process.env.MOCK_DATA_SOURCE}/data/latest` : `http://${API_ENDPOINT.hostname}${API_ENDPOINT.api_url}/data/latest`;
        const SENSOR_ID 	= process.env.TESTING ? n.subtype : API_ENDPOINT.sensor_id;
		let socket, periodic;
        
        this.name = n.name;

        RED.nodes.createNode(this,n);
        var node = this;
       
    	
		if (!process.env.TESTING){
			
			try{
				socket = new WebSocket(`ws://${API_ENDPOINT.hostname}`);
		
				console.log(`connecting to ws://${API_ENDPOINT.hostname}`);
				console.log(socket);
			
				socket.onopen = (event)=>{
					console.log("successfully opened websocket");
				};
		
				socket.onmessage = (event)=>{
				
				
					if (event.data === "ack"){
						//subscribe
						console.log("subscribing to sensor!");
						socket.send(JSON.stringify({sensor_id: SENSOR_ID}));
					}else{
						try{
							const {data, sensor_id, vendor_id, timestamp} = JSON.parse(event.data);
							
							node.send({	name: n.name || "twitter",
										id:  n.id,
										type: "twitter",
										payload: {
											ts: Math.ceil(timestamp/1000),
											value: data.text, 
										},
							});   
						}catch(err){
							console.log("error parsing twitter data!");
							console.log(err);
						}
					}
				};
			}catch(err){
				console.log("error receiving data!");
				console.log(err);
			}
		}
		else if (process.env.TESTING){
			const options = {
  				method: 'post',
  				body: {sensor_id: SENSOR_ID},
  				json: true,
  				url: API_URL,
			}
		
			periodic = setInterval(function(){
							request(options, function (err, res, body) {
								if (err) {
									console.log(err, 'error posting json')
								}else{
									try{
										if (body.length > 0){
											const result = body[0];
											const {data, sensor_id, vendor_id, timestamp} = result;
										
											node.send({
													name: n.name || "twitter",
													id:  n.id,
													type: "twitter",
													payload: {
														ts: Math.ceil(timestamp/1000),
														value: data.text, 
													},
											});   
										}
									}
									catch(err){
										console.log("error parsing twitter data");
										console.log(err);
									}
								}
							});
				}, 2000);
		}
		
        this.on("close", function() {
        	console.log(`${node.id} stopping requests`);
        	if (process.env.TESTING){
        		console.log("clearing timer!");
        		try{
					clearInterval(periodic);
				}catch(err){
					console.log("hmmm failed to clear timer!");
					console.log(err);
				}
			}else{
				try{
					socket.close();
				}catch(err){
					console.log("error closing socket");
					console.log(err);
				}
			}
        });
    }

    // Register the node by name. This must be called beforeoverriding any of the
    // Node functions.
    RED.nodes.registerType("twitter",Twitter);

}