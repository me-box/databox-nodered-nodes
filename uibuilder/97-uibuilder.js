module.exports = function(RED) {

    "use strict";
 	/*var ipc = require('node-ipc');
    ipc.config.id   = 'webserver';
    ipc.config.retry= 1500;
    ipc.config.silent=false;*/
    var net = require('net');
 	var client = new net.Socket();
 	var connected = false;

 	function connect(fn){
        connected = false;
        
        client.connect(8435, 'databox-test-server', function() {
            console.log('***** Connected *******');
            connected = true;
            if (fn){
            	fn();
            }
        }).on("error", function(err){
        	console.log("error connecting, retrying in 2 sec");
        	setTimeout(function(){connect(fn)}, 2000);
        });
    }

    function UIBuilder(n) {
     
      	connect(function(){
      		sendmessage({type:"control", payload:{command:"init", data:n}});
      	});

        this.name = n.name;
        RED.nodes.createNode(this,n);
        var node = this;
       	
        this.on('input', function (msg) {
        	//pass along the full route + data of this node. 	  	
        	msg._path = this.path();
        	node.send({type:'uibuilder', sourceId: n.id, payload:msg});
		})

        this.on("close", function() {
        	console.log(`${node.id} stopping requests`);
        });
    }

    function sendmessage(msg){
        if (connected){
            client.write(JSON.stringify({type: "message", msg: msg})).on("error", function(err){
                console.log('error writing to socket', err); 
                connect(function(){sendmessage(msg)});
            });
        }
	}

    // Register the node by name. This must be called before overriding any of the
    // Node functions.
    RED.nodes.registerType("uibuilder",UIBuilder);
}
