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
    
    function testing(node, n){
    	const options = {
  			method: 'post',
  			body: {sensor_id: SENSOR_ID},
  			json: true,
  			url: API_URL,
		}
		
		const periodic = setInterval(function(){
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

		node.on("close", function() {

        	console.log("clearing timer!");
        	try{
				clearInterval(periodic);
			}catch(err){
				console.log(err);
			}
		}
    }


    function Twitter(n) {
    
        const API_ENDPOINT 	= process.env.TESTING ? {} : JSON.parse(process.env[`DATASOURCE_${n.id}`]);
        const API_URL 		= process.env.TESTING ? `${process.env.MOCK_DATA_SOURCE}/data/latest` : `http://${API_ENDPOINT.hostname}${API_ENDPOINT.api_url}/data/latest`;
        const SENSOR_ID 	= process.env.TESTING ? n.subtype : API_ENDPOINT.sensor_id;
		let socket, periodic;
        
        this.name = n.name;

        RED.nodes.createNode(this,n);
        var node = this;
       
    	
		if (process.env.TESTING){
			return testing(node, n);
		}
			
		try{

			const  API_ENDPOINT = JSON.parse(process.env[`DATASOURCE_${n.id}`] || '{}');

        	const  HREF_ENDPOINT = API_ENDPOINT.href || ''; 

        	databox.subscriptions.connect(HREF_ENDPOINT)
                .then((emitter)=>{
                    dataEmitter = emitter;
                    
                    var endpointUrl = url.parse(HREF_ENDPOINT);
                    
                    var dsID = API_ENDPOINT['item-metadata'].filter((itm)=>{return itm.rel === 'urn:X-databox:rels:hasDatasourceid'; })[0].val;
                    
                    var dsUrl = endpointUrl.protocol + '//' + endpointUrl.host;
                    
                    console.log("[subscribing]",dsUrl,dsID);
                    
                    databox.subscriptions.subscribe(dsUrl,dsID,'ts').catch((err)=>{console.log("[ERROR subscribing]",err)});
                    
                    dataEmitter.on('data',(hostname, dsID, data)=>{
                    	console.log("GOT SOME TWITTER DATA!")
                    	console.log(hostname, dsID, data);		
						
						node.send({	name: n.name || "twitter",
									id:  n.id,
									type: "twitter",
									payload: {
										ts: Math.ceil(timestamp/1000),
										value: data, 
									},
						});   
                    });

                    dataEmitter.on('error',(error)=>{
                        console.log(error);
                    });
                
                }).catch((err)=>{console.log("[Error] connecting ws endpoint ",err);});	
		}
		catch(err){
			console.log("error receiving data!");
			console.log(err);
		}
		

        this.on("close", function() {
        	console.log(`${node.id} stopping requests`);
        });
    }

    // Register the node by name. This must be called beforeoverriding any of the
    // Node functions.
    RED.nodes.registerType("twitter",Twitter);

}