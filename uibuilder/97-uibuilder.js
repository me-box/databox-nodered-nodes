module.exports = function(RED) {

    "use strict";
 	/*var ipc = require('node-ipc');
    ipc.config.id   = 'webserver';
    ipc.config.retry= 1500;
    ipc.config.silent=false;*/
    //var net = require('net');
 	//var client = new net.Socket();
 	var connected = false;
 	//var netstring = require("../utils/netstring");

	var JSONTCPSOCKET = require('json-tcp-socket');
	var JSONTCPSOCKET = new JSONTCPSOCKET({tls: false});
	var client = new JSONTCPSOCKET.Socket();

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
   	
        client.connect(8435, 'databox-test-server', function() {
            console.log('***** Connected *******');
            connected = true;
  		
            if (fn){
            	fn();
            }
        })
    }

    function UIBuilder(n) {
     
      	connect(function(){
      		sendmessage({type:"control", payload:{command:"init", data:n}});
      		console.log("sending uibuilder init data to test server", JSON.stringify(n,null, 4));
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
           client.write({type: "message", msg: msg});
           //client.write(JSON.stringify({type: "message", msg: msg}))
	    }
	}

    // Register the node by name. This must be called before overriding any of the
    // Node functions.
    RED.nodes.registerType("uibuilder",UIBuilder);
}
