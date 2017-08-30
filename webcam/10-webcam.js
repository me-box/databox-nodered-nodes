module.exports = function(RED) {
    
    "use strict";
 	var express = require('express');
 	var http = require('http');
    var WebSocket = require('ws');
    var wss = new WebSocket.Server({ port: 9123 });
    var server;

    function Webcam(n) {
 		
 		RED.nodes.createNode(this,n);
        var node = this;
        //pas in the name of the image here??
		var app = express();

		wss.on('connection', function connection(ws) {
		  console.log("successfully connected websocket!");
		  ws.on('message', function incoming(message) {
		    //console.log('received: %s', message);
		  	node.send(message);
		  });
		});

        app.use("/", express.static(__dirname + '/'))

  		server = http.createServer(app);
  		
  		try{
 			server.listen(8096, "0.0.0.0", function(){
 				console.log("ok am listening now!!");
 			});
 		}catch(err){
 			console.log(err);
 		}

        
    }
    
    this.on("close", function() {
        console.log(`---seen a node close event ----`);
        server.close();
    });

    // Register the node by name. This must be called before overriding any of the
    // Node functions.
    RED.nodes.registerType("webcam", Webcam);

}