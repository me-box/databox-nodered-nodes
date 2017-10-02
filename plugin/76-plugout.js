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
    const databox = require('node-databox');   
    const url = require("url");
    
    function Plug(n) {

 		const API_ENDPOINT 	= process.env.TESTING ? {} : JSON.parse(process.env[`DATASOURCE_${n.id}`]);
        const HREF_ENDPOINT = API_ENDPOINT.href || ''; 
        const endpointUrl = url.parse(HREF_ENDPOINT);   
        const actuationStore = endpointUrl.protocol + '//' + endpointUrl.host;
             
        const sensorID = API_ENDPOINT['item-metadata'].filter((pair) => pair.rel === 'urn:X-databox:rels:hasDatasourceid')[0].val;
        console.log("actuation store", actuationStore);
        console.log("sensor ID", sensorID);

        this.name = n.name;

        RED.nodes.createNode(this,n);
        var node = this;
       
		this.on('input', function (msg) {
			const value = msg.payload ? msg.payload : n.value ? n.value : null;
            
            databox.timeseries.write(actuationStore,sensorID,{data:value}).then((body)=>{
                console.log("success", body); 
            }).catch((err)=>{
                console.log("error");
                console.log(err);
                return;
            });
        });
        
        this.on("close", function() {
           
        });
    }

    // Register the node by name. This must be called before overriding any of the
    // Node functions.
    RED.nodes.registerType("plugout",Plug);
}