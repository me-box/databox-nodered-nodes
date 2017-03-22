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
						const formattedvalue = n.subtype==="bulb-on" ? data ? 'on': 'off' : Number(data);
											
						const msg = {
							name: n.name || "bulbsin",
							id:  n.id,
							subtype: n.subtype,
							type: "bulbsin",
							payload: {
								ts: timestamp,
								value: formattedvalue,
							}
						}
							
						console.log(msg)
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
    
    function Bulbs(n) {
 		
 		RED.nodes.createNode(this,n);
        
        if (process.env.TESTING){
            return testing(this, n);
        }
		
		const API_ENDPOINT = JSON.parse(process.env[`DATASOURCE_${n.id}`] || '{}');
    
    	const bulbStore = ((url) => url.protocol + '//' + url.host)(url.parse(API_ENDPOINT.href));
    	const sensorID = API_ENDPOINT['item-metadata'].filter((pair) => pair.rel === 'urn:X-databox:rels:hasDatasourceid')[0].val;
    
    	var dataEmitter = null; 

    	databox.timeseries.latest(bulbStore, sensorID)
        .then((d)=>{
       		console.log("got latest reading as ");
       		console.log(d[0]);
       		
       		const {timestamp, data} = d[0];

       		const msg = {
					name: n.name || "bulbsin",
					id:  n.id,
					subtype: n.subtype,
					type: "bulbsin",
					payload: {
						ts: timestamp,
						value: data,
					}
			}
			node.send(msg);
        })
        .catch((err)=>{console.log("[Error getting timeseries.latest]",dsUrl, dsID);});

    	databox.waitForStoreStatus(bulbStore, 'active')
    	.then(() => databox.subscriptions.connect(bulbStore))
      	.then((emitter) => {
        
        	dataEmitter = emitter;

        	databox.subscriptions.subscribe(bulbStore,sensorID,'ts').catch((err)=>{console.log("[ERROR subscribing]",err)});    
        
        	dataEmitter.on('data',(hostname, dsID, d)=>{
            	console.log("seen some data!!");
            	console.log(d);
            	const msg = {
					name: n.name || "bulbsin",
					id:  n.id,
					subtype: n.subtype,
					type: "bulbsin",
					payload: {
						ts: Date.now(),
						value: d,
					}
				}
				console.log('sending');
				console.log(msg);
				node.send(msg);

      		}).catch((err) => console.error(err));		
		})
    }
    
    // Register the node by name. This must be called before overriding any of the
    // Node functions.
    RED.nodes.registerType("bulbsin",Bulbs);

}