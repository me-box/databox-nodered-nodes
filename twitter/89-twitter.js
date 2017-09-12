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

    	let shouldquery = true;

    	const options = {
  			method: 'post',
  			body: {sensor_id: n.subtype},
  			json: true,
  			url: `${process.env.MOCK_DATA_SOURCE}/data/latest`,
		}

		const getData = ()=>{
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
			const nextQuery = Math.round(Math.random() * 30000);
			
			if (shouldquery){
				setTimeout(getData,nextQuery);
			}
		};

		getData();

		node.on("close", function() {
        	console.log("closed!");
        	shouldquery  = false;
		});
    }


    function Twitter(n) {
    
      
        this.name = n.name;
        RED.nodes.createNode(this,n);
        var node = this;
       
    	
		if (process.env.TESTING){
			return testing(node, n);
		}

		
		const databox = require('node-databox');	
		
		try{

			const  API_ENDPOINT = JSON.parse(process.env[`DATASOURCE_${n.id}`] || '{}');
        	const  HREF_ENDPOINT = API_ENDPOINT.href || '';
        	
        	const dsID = API_ENDPOINT['item-metadata'].filter((itm)=>{return itm.rel === 'urn:X-databox:rels:hasDatasourceid'; })[0].val;
        	const endpointUrl = url.parse(HREF_ENDPOINT); 
            const dsUrl = endpointUrl.protocol + '//' + endpointUrl.host;
               
            //first pull out the last reading from twitter and send this 
            databox.timeseries.latest(dsUrl, dsID)
            .then((d)=>{
           
                 const {data, datasource_id, timestamp} = d[0];

                 node.send({	
                	name: n.name || "twitter",
					id:  n.id,
					type: "twitter",
					payload: {
						ts: Math.ceil(timestamp/1000),
						value: data.text, 
					},
				});   
            })
            .catch((err)=>{
                console.log("[Error getting timeseries.latest]",dsUrl, dsID);
            });
             

            //now listen for any new messages
			var dataEmitter = null; 
        	
        	databox.subscriptions.connect(HREF_ENDPOINT).then((emitter)=>{
                dataEmitter = emitter;

                   
                console.log("[subscribing]",dsUrl,dsID);
                
                databox.subscriptions.subscribe(dsUrl,dsID,'ts').catch((err)=>{console.log("[ERROR subscribing]",err)});
                
                dataEmitter.on('data',(hostname, dsID, d)=>{
					node.send({	name: n.name || "twitter",
								id:  n.id,
								type: "twitter",
								payload: {
									ts: Math.ceil(Date.now()/1000),
									value: d.text, 
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