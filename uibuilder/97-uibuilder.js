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
       

        console.log("would init node");
        console.log(JSON.stringify(node,null,4));

       	console.log("-----");
       	console.log(JSON.stringify(n,null,4));
		
		sendmessage(ipc, {type:"control", payload:{command:"init", data:n}});
        
        //TODO: force node red to send message and originatore with the input event!
        this.on('input', function (msg) {
        	console.log("seen inoput msg");
        	console.log(msg);

        	node.send({type:'uibuilder', sourceId: msg.id || "", payload:msg.payload});
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
