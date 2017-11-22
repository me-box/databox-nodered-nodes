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
    

     function testing(node, n){
    	
    	const API_URL  = `${process.env.MOCK_DATA_SOURCE}/reading/latest`;

    	const options = {
  			method: 'post',
  			body: {sensor_id: n.subtype},
  			json: true,
  			url: API_URL,
		}

    	const periodic = setInterval(function(){
								
			request(options, function (err, res, body) {
				if (err) {
					console.log(err, 'error posting json')
				}else{
					
					if (body.length > 0){
						const result = body[0];
						const {data,timestamp=Date.now()} = result;
						const formattedvalue = ["TP-PowerState"].indexOf(n.subtype) !== -1 ? data : Number(data);

						const msg = {
							name: n.name || "plugin",
							id:  n.id,
							subtype: n.subtype,
							type: "plugin",
							payload: {
								ts: timestamp,
								value: formattedvalue,
							}
						}
							
						node.send(msg);   
					}	
				}
			});
		}, 1000);

        node.on("close", function() {
          	console.log(`${node.id} stopping requests`);
			clearInterval(periodic);
        });
    }

    function Plug(n) {

        this.name = n.name;

        RED.nodes.createNode(this,n);
        var node = this;
       	const API_ENDPOINT 	= process.env.TESTING ? {} : JSON.parse(process.env[`DATASOURCE_${n.id}`]);
        const API_URL 		= process.env.TESTING ? `${process.env.MOCK_DATA_SOURCE}/data/latest` : `http://${API_ENDPOINT.hostname}${API_ENDPOINT.api_url}/data/latest`;
        const SENSOR_ID 	= process.env.TESTING ? n.subtype : API_ENDPOINT.sensor_id;
		let socket, periodic;

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
							const {data,timestamp} = JSON.parse(event.data);
							const formattedvalue = n.subtype==="TP-PowerState" ? data ? 'on': 'off' : Number(data);
													
							const msg = {
									name: n.name || "plugin",
									id:  n.id,
									subtype: n.subtype,
									type: "plugin",
									payload: {
										ts: timestamp,
										value: formattedvalue,
									}
							}
									
							node.send(msg);    
						}
						catch(err){
							console.log("error parsing plugin data!");
							console.log(err);
						}
					}
				};
			}catch(err){
				console.log("error receiving data!");
				console.log(err);
			}
		}
		else{
		
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
			
						
								if (body.length > 0){
									const result = body[0];
									const {data,timestamp} = result;
									const formattedvalue = n.subtype==="power-state" ? data ? 'on': 'off' : Number(data);
													
									const msg = {
										name: n.name || "plugin",
										id:  n.id,
										subtype: n.subtype,
										type: "plugin",
										payload: {
											ts: timestamp,
											value: formattedvalue,
										}
									}
									
									
									node.send(msg);   
								}	
							}
						});
			}, 1000);
		}

        this.on("close", function() {
        	console.log(`${node.id} stopping requests`);
        	if (process.env.TESTING){
				clearInterval(periodic);
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

    // Register the node by name. This must be called before overriding any of the
    // Node functions.
    RED.nodes.registerType("plugin",Plug);

}