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
 	var url = require("url");

    function testing(node, n){
    	
    	const API_URL  = `${process.env.MOCK_DATA_SOURCE}/reading/latest`;
    	let LAST_PRESENCE_VALUE = false;

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
						console.log("got result", result);
						const {data={},timestamp=Date.now()} = result;
						console.log("data is", JSON.stringify(data,null,4));

						const formattedvalue = ["bulb-on", "hue-ZLLTemperature", "hue-ZLLPresence", "hue-ZLLLightLevel"].indexOf(n.subtype) !== -1 ? data : Number(data);

						var send = true;

						if (n.subtype === "hue-ZLLPresence"){
							if (data.presence === LAST_PRESENCE_VALUE){
								send = false;
							}else{
								send = true;
							}		
							LAST_PRESENCE_VALUE = data.presence;
						}

						if (send){
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
							node.send(msg);   
						}	
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
 		
 		console.log("******* creating new version of bulbsin node: " + n.id);

 		RED.nodes.createNode(this,n);
        
        var node = this;
		

        if (process.env.TESTING){
            return testing(this, n);
        }
		
        const databox = require('node-databox');

        const DATASOURCE_BULBSIN = process.env[`DATASOURCE_${n.id}`];


        databox.HypercatToSourceDataMetadata(DATASOURCE_BULBSIN).then((data)=>{

        	console.log("got hypercat data!");

        	const DS_Metadata = data.DataSourceMetadata;
			
			const store_url = data.DataSourceURL;
			
			console.log("metadata, storeurl", DS_Metadata, store_url);

			const tsc = databox.NewTimeSeriesBlobClient(store_url, false);

			let LAST_PRESENCE_VALUE = false;

			tsc.Observe(DS_Metadata.DataSourceID).then((subs) => {
			

				subs.on("data", (d)=>{

					const d = JSON.parse(d.data);
					console.log("ok got some data:", d);
				
					var send = true;

					if (n.subtype === "hue-ZLLPresence"){

						console.log("CHECKING ", d.presence, " against ", LAST_PRESENCE_VALUE);
						
						if (d.presence === LAST_PRESENCE_VALUE){
							send = false;
						}else{
							send = true;
						}		
						LAST_PRESENCE_VALUE = d.presence;
						console.log("SETTING LAST PRESENCE VALUE TO", d.presence);
					}

					if (send){

		            	var msg = {
							name: n.name || "bulbsin",
							id:  n.id,
							subtype: n.subtype,
							type: "bulbsin",
							payload: {
								ts: Date.now(),
								value: d,
							}
						}
						
						node.send(msg);
					}
				});
				
				subs.on('error',(err)=>{
					console.warn(err);
				});

			}).catch((err) => console.error(err));

        }).catch((err)=>{
        	console.log("error:", err);
        });
    }


    function BulbsOLD(n) {
 		
 		console.log("******* creating bulbsin node: " + n.id);

 		RED.nodes.createNode(this,n);
        
        var node = this;
		

        if (process.env.TESTING){
            return testing(this, n);
        }
		
        const databox = require('node-databox');
        
		const API_ENDPOINT = JSON.parse(process.env[`DATASOURCE_${n.id}`] || '{}');
    
    	console.log(`${n.id} API ENDPOINT IS ${JSON.stringify(API_ENDPOINT,null,4)}`);
    	const bulbStore = ((url) => url.protocol + '//' + url.host)(url.parse(API_ENDPOINT.href));
    	const sensorID = API_ENDPOINT['item-metadata'].filter((pair) => pair.rel === 'urn:X-databox:rels:hasDatasourceid')[0].val;
    	
    	console.log(`${n.id} sensor id is ${sensorID}`);

    	
    	let LAST_PRESENCE_VALUE = false;

    	databox.timeseries.latest(bulbStore, sensorID)
        .then((d)=>{
       		
       		const {timestamp, data} = d[0];

       		var msg = {
					name: n.name || "bulbsin",
					id:  n.id,
					subtype: n.subtype,
					type: "bulbsin",
					payload: {
						ts: timestamp,
						value: data,
					}
			}
			
			if (n.subtype === "hue-ZLLPresence"){
				console.log("DATA IS", data);
				console.log("************** SET LAST_PRESENCE_VALUE TO", data.presence);
				LAST_PRESENCE_VALUE = data.presence;
			}

			node.send(msg);
        })
        .catch((err)=>{console.log("[Error getting timeseries.latest]",bulbStore, sensorID);});

        var dataEmitter = null; 

        
    	databox.waitForStoreStatus(bulbStore, 'active')
    	.then(() => databox.subscriptions.connect(bulbStore))
      	.then((emitter) => {
        	
        	dataEmitter = emitter;

        	databox.subscriptions.subscribe(bulbStore,sensorID,'ts').catch((err)=>{console.log("[ERROR subscribing]",err)});    
        	
        	

        	dataEmitter.on('data',(hostname, dsID, d)=>{
            	
            	var send = true;

				if (n.subtype === "hue-ZLLPresence"){

					console.log("CHECKING ", d.presence, " against ", LAST_PRESENCE_VALUE);
					
					if (d.presence === LAST_PRESENCE_VALUE){
						send = false;
					}else{
						send = true;
					}		
					LAST_PRESENCE_VALUE = d.presence;
					console.log("SETTING LAST PRESENCE VALUE TO", d.presence);
				}

				console.log("SEND IS ", send);

				if (send){

	            	var msg = {
						name: n.name || "bulbsin",
						id:  n.id,
						subtype: n.subtype,
						type: "bulbsin",
						payload: {
							ts: Date.now(),
							value: d,
						}
					}
					
					node.send(msg);
				}
      		})	
		}).catch((err) => console.error(err));
    }
    
    // Register the node by name. This must be called before overriding any of the
    // Node functions.
    RED.nodes.registerType("bulbsin",Bulbs);

}