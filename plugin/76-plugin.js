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
						const formattedvalue = ["TP-PowerState", "TP-Power-Usage"].indexOf(n.subtype) !== -1 ? data : Number(data);

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
 		
 		console.log("******* creating new plugin node: " + n.id);

 		RED.nodes.createNode(this,n);
        
        var node = this;
		
        if (process.env.TESTING){
            return testing(this, n);
        }
		
        const databox = require('node-databox');

        const DATASOURCE_PLUGIN = process.env[`DATASOURCE_${n.id}`];


        databox.HypercatToSourceDataMetadata(JSON.parse(DATASOURCE_PLUGIN)).then((data)=>{

        	console.log("got hypercat data!");

        	const DS_Metadata = data.DataSourceMetadata;
			
			const store_url = data.DataSourceURL;
			
			console.log("metadata, storeurl", DS_Metadata, store_url);

			const tsc = databox.NewTimeSeriesBlobClient(store_url, false);

			tsc.Observe(DS_Metadata.DataSourceID).then((subs) => {
			

				subs.on("data", (d)=>{
					
					console.log("plugin --- seen data!", d);
				

					const msg = {
						name: n.name || "plugin",
						id:  n.id,
						subtype: n.subtype,
						type: "plugin",
						payload: {
							ts: Date.now(),
							value: JSON.parse(d.data),
						}
					}
					node.send(msg);
				});
				
				subs.on('error',(err)=>{
					console.warn(err);
				});

			}).catch((err) => console.error(err));

        }).catch((err)=>{
        	console.log("error:", err);
        });
    }
    // Register the node by name. This must be called before overriding any of the
    // Node functions.
    RED.nodes.registerType("plugin",Plug);

}