module.exports = function(RED) {

  "use strict";
 	
 	var connected = false;
	var net = require('net');
  var JsonSocket = require('json-socket');
  var client =  new JsonSocket(new net.Socket());

	client.on("error", function(err){
        console.log("error connecting, retrying in 2 sec");
        setTimeout(function(){connect()}, 2000);
    });
	
	client.on('uncaughtException', function (err) {
  		console.error(err.stack);
  		setTimeout(function(){connect()}, 2000);
	});

 	function connect(fn){
        connected = false;
   		
   		const endpoint = process.env.TESTING ? 'databox-test-server' : "127.0.0.1";
        
        client.connect(8435, endpoint, function() {
            console.log('***** Connected *******');
            connected = true;
  		
            if (fn){
            	fn();
            }
        })
    }

    function UIBuilder(n) {
        
        console.log("creating uibuilder node.");

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
           client.sendMessage({type: "message", msg: msg});
           //client.write({type: "message", msg: msg});
           //client.write(JSON.stringify({type: "message", msg: msg}))
	    }
	}

    // Register the node by name. This must be called before overriding any of the
    // Node functions.
    RED.nodes.registerType("uibuilder",UIBuilder);
}
