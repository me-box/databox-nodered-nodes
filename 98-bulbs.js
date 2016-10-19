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
    
  
    function Bulbs(n) {
        // Create a RED node
        RED.nodes.createNode(this,n);
       
        var node = this;

        client.on('connect', () => {  
            client.subscribe('ds/bulbs')
        })

		console.log(process.env);
		
        client.on('message', (topic, message) => {  
			console.log("seen message");
			console.log(message);
        });

        this.on("close", function() {
           
        });
    }

    // Register the node by name. This must be called before overriding any of the
    // Node functions.
    RED.nodes.registerType("bulbs",Bulbs);

}