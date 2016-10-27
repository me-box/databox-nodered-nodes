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
		let socket;
        
        this.name = n.name;

        RED.nodes.createNode(this,n);
        var node = this;
       
        
		const options = {
  			method: 'post',
  			body: {sensor_id: SENSOR_ID},
  			json: true,
  			url: API_URL,
		}
		
		
		if (!process.env.TESTING){
			
		 	socket = new WebSocket(`ws://${API_ENDPOINT.hostname}`);
		
			console.log(`connecting to ws://${API_ENDPOINT.hostname}`);
			console.log(socket);
			
			socket.onopen? = (event)=>{
				console.log("socket --- opened!!");
				socket.send("message", {sensor_id: SENSOR_ID});
			};
		
			socket.onmessage = (event)=>{
				console.log("socket --- got data!!");
 	 			console.log(event.data);
			};
		}
		
		
		if (process.env.TESTING){
					const periodic = setInterval(function(){
									request(options, function (err, res, body) {
										if (err) {
											console.log(err, 'error posting json')
										}else{
											try{
												if (body.length > 0){
													const result = body[0];
													const {data, sensor_id, vendor_id, timestamp} = result;
												
													console.log("got result");
													console.log(data);
													console.log(data.text);	
												
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
												console.log(err);
											}
										}
									});
						}, 2000);
		}
		
        this.on("close", function() {
        	console.log(`${node.id} stopping requests`);
        	if (process.env.TESTING){
				clearInterval(periodic);
			}else{
				socket.close();
			}
        });
    }

    // Register the node by name. This must be called beforeoverriding any of the
    // Node functions.
    RED.nodes.registerType("twitter",Twitter);

}