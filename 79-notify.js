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
    var ENDPOINT = process.env.DATABOX_NOTIFICATIONS_ENDPOINT;
    
    function Notify(n) {
 		
        // Create a RED node
        RED.nodes.createNode(this,n);
        
        var node = this; 
		
		
		this.on('input', function (msg) {
        	var channel = msg.channel || n.subtype;
        	switch (channel){
        
        		case "twitter":
        			tweet(msg, n);
        			break;
        			
        		default: //no op
        		
        	}
        	
        });
        
        this.on("close", function() {
           
        });
    }
    
    function tweet(msg, n){
    	
        var message;
        var to;
        
        if (msg.payload.message && msg.payload.message.trim() != ""){
        	message = msg.payload.message.trim();
        }
        else{
        	message = n.message.trim() != "" ? n.message.trim() : null;
        }	
		
		if (msg.payload.to && msg.payload.to.trim() != ""){
			to = msg.payload.to.trim();
		}
		else{
			to = n.to.trim() != "" ? n.to.trim() : null; 
		}
		
		if (message && to){
			
			to = to.indexOf("@") == 0 ? to : `@${to}`;
			
			const options = {
				method: 'post',
				body: {to:to, body:message},
				json: true,
				url: `${ENDPOINT}/twitter`,
			}
			
			console.log("notify options are");
			console.log(options);
			
			request(options, function (err, res, body) {
				if (err) {
					console.log(err, 'error posting json')
				}else{
					console.log(body);
				}
			});
		}else{
			console.log("to or message not set, so cannot send");
		}
    }

    // Register the node by name. This must be called before overriding any of the
    // Node functions.
    RED.nodes.registerType("notify",Notify);

}