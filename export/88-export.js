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
    
    function Export(n) {

    	this.name = n.name;
        RED.nodes.createNode(this,n);
        var node = this;

    	if (process.env.TESTING){
            return;
        }

        const databox = require('node-databox');    

		this.on('input', function (msg) {
            const {url="",data={}} = msg.payload || {};
			console.log("sending ", data, " to ", url);
            if (url.trim() != ""){
                databox.export.longpoll(url, payload)
                .catch((err)=>{
                    console.log("ERROR databox.export.longpoll " + err)
                });
            }
       	});
    }
    
    // Register the node by name. This must be called before overriding any of the
    // Node functions.
    RED.nodes.registerType("export",Export);
}