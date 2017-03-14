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

module.exports = function(RED) {

    "use strict";
    var request = require('request');
    var moment = require('moment');
    var databox = require('node-databox');
    var url = require("url");

    function OSMonitor(n) {
    
        //const API_ENDPOINT 	= process.env.TESTING ? {} : JSON.parse(process.env[`DATASOURCE_${n.id}`]);
        //const API_URL 		= process.env.TESTING ? `${process.env.MOCK_DATA_SOURCE}/reading/latest` : `http://${API_ENDPOINT.hostname}${API_ENDPOINT.api_url}/reading/latest`;
        //const SENSOR_ID 	= process.env.TESTING ? n.subtype : API_ENDPOINT.sensor_id;


        const  API_ENDPOINT = JSON.parse(process.env[`DATASOURCE_${subtype}`] || '{}');
    	const  HREF_ENDPOINT = API_ENDPOINT.href || '';	
        

        console.log("HAVE API ENDPOINT: ");
        console.log(API_ENDPOINT);
        console.log("HREF ENDPOINT");
        console.log(HREF_ENDPOINT);

        this.name = n.name;

        RED.nodes.createNode(this,n);
        var node = this;
        
        new Promise((resolve,reject)=>{
    			setTimeout(resolve,10000);
  		}).then(()=>{
        	var dataEmitter = null; 
        	
        	if (HREF_ENDPOINT != ''){

        		console.log("setting up endpoints...");
        		var endpointUrl = url.parse(HREF_ENDPOINT);
        		var dsID = API_ENDPOINT['item-metadata'].filter((itm)=>{return itm.rel === 'urn:X-databox:rels:hasDatasourceid'; })[0].val;
        		var dsUrl = endpointUrl.protocol + '//' + endpointUrl.host;
        		var dsType = API_ENDPOINT['item-metadata'].filter((itm)=>{return itm.rel === 'urn:X-databox:rels:hasType';})[0].val;
        
        		//pull out the latest....
        		databox.timeseries.latest(dsUrl, dsID)
		        .then((data)=>{
		            console.log("GOT LATEST READING!");
		            console.log(data);
		            console.log(data[0].data);
		        })
		        .catch((err)=>{
		            console.log("[Error getting timeseries.latest]",dsUrl, dsID);
		        });

		        //subscribe
		        databox.subscriptions.connect(HREF_ENDPOINT)
		        .then((emitter)=>{
		        	dataEmitter = emitter;
		        	var endpointUrl = url.parse(HREF_ENDPOINT);
					var dsID = API_ENDPOINT['item-metadata'].filter((itm)=>{return itm.rel === 'urn:X-databox:rels:hasDatasourceid'; })[0].val;
            		var dsUrl = endpointUrl.protocol + '//' + endpointUrl.host;
            		console.log("[subscribing]",dsUrl,dsID);
            		databox.subscriptions.subscribe(dsUrl,dsID,'ts').catch((err)=>{console.log("[ERROR subscribing]",err)});
		        	
		        	dataEmitter.on('data',(hostname, dsID, data)=>{
		                console.log(hostname, dsID, data);
		                node.send({
							name: n.name || "osmonitor",
							id:  n.id,
							subtype: n.subtype,
							type: "osmonitor",
							payload: {
								ts: moment.utc(time).unix(),
								value: data, 
							},
						});   
		            });

		            dataEmitter.on('error',(error)=>{
		                console.log(error);
		            });
		        
		        }).catch((err)=>{console.log("[Error] connecting ws endpoint ",err);});
			}
		}

        this.on("close", function() {
        	console.log(`${node.id} stopping requests`);
        });
    }

    // Register the node by name. This must be called beforeoverriding any of the
    // Node functions.
    RED.nodes.registerType("osmonitor",OSMonitor);

}