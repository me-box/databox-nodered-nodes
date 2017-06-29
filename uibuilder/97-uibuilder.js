module.exports = function(RED) {

    "use strict";
 	var ipc = require('node-ipc');
    ipc.config.id   = 'webserver';
    ipc.config.retry= 1500;
    ipc.config.silent=true;

    function UIBuilder(n) {
     
        ipc.connectTo(
            'webserver',
             function(){
             ipc.of.webserver.on(
                'connect',
                function(){
                    
                }
            );
        });
      
        this.name = n.name;
        RED.nodes.createNode(this,n);
        var node = this;
       	
		sendmessage(ipc, {type:"control", payload:{command:"init", data:n}});
        
        this.on('input', function (msg) {
        	//pass along the full route + data of this node.  

        	console.log("uibuilder, received msg", msg);      	
        	msg._path = this.path();
        	node.send({type:'uibuilder', sourceId: n.id, payload:msg});
		})

        this.on("close", function() {
        	console.log(`${node.id} stopping requests`);
        });
    }

    function sendmessage(ipc, msg){
		try{
		   //console.log(msg);
		   ipc.of.webserver.emit(
							'message',  //any event or message type your server listens for 
							JSON.stringify(msg)
						)
			//client.publish(MQTT_APP_CHANNEL, JSON.stringify(msg));
		}catch(err){
			console.log(err);
		}
	}
    // Register the node by name. This must be called before overriding any of the
    // Node functions.
    RED.nodes.registerType("uibuilder",UIBuilder);
}
