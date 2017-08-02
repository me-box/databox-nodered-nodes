module.exports = function(RED) {
    
    "use strict";
 	var express = require('express');
 	var http = require('http');
    var WebSocket = require('ws');
    var wss = new WebSocket.Server({ port: 9000 });

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

  		var server = http.createServer(app);
  		
 		server.listen(8086, "0.0.0.0", function(){
 			console.log("ok am listening now!!");
 		});

        
    }
    
    // Register the node by name. This must be called before overriding any of the
    // Node functions.
    RED.nodes.registerType("webcam", Webcam);

}