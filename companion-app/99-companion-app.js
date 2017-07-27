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
    var net = require('net');
    var client = new net.Socket();
    var connected = false;

    client.on("error", function(err){
        connected = false;
        console.log("error connecting, retrying in 2 sec");
        setTimeout(function(){connect()}, 2000);
    });
    
    client.on('uncaughtException', function (err) {
        connected = false;
        console.error(err.stack);
        setTimeout(function(){connect()}, 2000);
    });

    function connect(fn){
        connected = false;
   
        client.connect(8435, 'databox-test-server', function() {
            console.log('***** companion app connected *******');
            connected = true;
        
            if (fn){
                fn();
            }
        })
    }

    function CompanionApp(n) {
    
        
        // Create a RED node
        RED.nodes.createNode(this,n);
		   
        connect(function(){
            console.log("sending control message!");
            sendmessage({type:"control", payload:{command:"init", data:{id:n.id, layout:n.layout}}});
        });
    

        // Store local copies of the node configuration (as defined in the .html)
        this.appId = n.appId;
		this.layout = n.layout;        
        var node = this;
		
		var fallbackId = (1+Math.random()*42949433295).toString(16);
	
        

        this.on('input', function (m) {
            var msg = {
                channel: node.appId,
                sourceId: m.sourceId || fallbackId,
                type: "data",
                payload: {
                    id:   node.id,
                    name: node.name || "app", 
                    view: m.type || "text", 
                    data: m.payload, 
                    channel: node.appId, 
                }
            }	
            sendmessage(msg);
        });

        this.on("close", function() {
        	sendmessage({channel:node.appId, type:"control", payload:{command:"reset", channel:node.appId}});
        });
    }
    
    function sendmessage(msg){

        if (connected){
           client.write(JSON.stringify({type: "message", msg: msg}))
        }
    }

    // Register the node by name. This must be called before overriding any of the
    // Node functions.
    RED.nodes.registerType("app",CompanionApp);

}
