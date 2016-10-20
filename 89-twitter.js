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
    var moment = require('moment');
    
    function Twitter(n) {
    
        const API_ENDPOINT 	= process.env.TESTING ? {} : JSON.parse(process.env[`DATASOURCE_${n.id}`]);
        const API_URL 		= process.env.TESTING ? `${process.env.MOCK_DATA_SOURCE}/reading/latest` : `http://${API_ENDPOINT.hostname}${API_ENDPOINT.api_url}/data/latest`;
        const SENSOR_ID 	= process.env.TESTING ? n.subtype : API_ENDPOINT.sensor_id;

        this.name = n.name;

        RED.nodes.createNode(this,n);
        var node = this;
       
        
		const options = {
  			method: 'post',
  			body: {sensor_id: SENSOR_ID},
  			json: true,
  			url: API_URL,
		}
		
		console.log(options);
		
		const periodic = setInterval(function(){
									request(options, function (err, res, body) {
										if (err) {
											console.log(err, 'error posting json')
										}else{
											if (body.length > 0){
												const result = body[0];
												const {data, sensor_id, vendor_id, timestamp} = result;
												
												console.log("got result");
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
									});
						}, 10000);

        this.on("close", function() {
        	console.log(`${node.id} stopping requests`);
			clearInterval(periodic);
        });
    }

    // Register the node by name. This must be called beforeoverriding any of the
    // Node functions.
    RED.nodes.registerType("twitter",Twitter);

}