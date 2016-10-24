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
    
    function Bulbs(n) {
 		const API_ENDPOINT 	= process.env.TESTING ? {} : JSON.parse(process.env[`DATASOURCE_${n.id}`]);
        const API_URL 		= process.env.TESTING ? `${process.env.MOCK_DATA_SOURCE}/data/latest` : `http://${API_ENDPOINT.hostname}${API_ENDPOINT.api_url}/data/latest`;
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
		
		
		
		const periodic = setInterval(function(){
					console.log("posting - sensor is is " + SENSOR_ID);
					console.log("options are");
					console.log(options);
					
					request(options, function (err, res, body) {
						if (err) {
							console.log(err, 'error posting json')
						}else{
							console.log("result is ");
								console.log(body);
							if (body.length > 0){
								const result = body[0];
								
								if (result.length > 0){
									const {time,value} = result[0];
								
									node.send({
											name: n.name || "bulbs-in",
											id:  n.id,
											subtype: n.subtype,
											type: "bulbs-in",
											payload: {
												ts: moment.utc(time).unix(),
												value: Number(value), 
											},
									});   
								}
							}	
						}
					});
		}, 1500);

        this.on("close", function() {
          	console.log(`${node.id} stopping requests`);
			clearInterval(periodic);
        });
    }

    // Register the node by name. This must be called before overriding any of the
    // Node functions.
    RED.nodes.registerType("bulbs-in",Bulbs);

}