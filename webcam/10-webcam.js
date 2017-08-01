module.exports = function(RED) {
    
    "use strict";
 	var express = require('express');
 	var http = require('http');
    var WebSocket = require('ws');
    var wss = new WebSocket.Server({ port: 9000 });

    function Webcam(n) {
 		
 		RED.nodes.createNode(this,n);
        
        //pas in the name of the image here??
		var app = express();
      
		wss.on('connection', function connection(ws) {
		  ws.on('message', function incoming(message) {
		    console.log('received: %s', message);
		  });
		});

        app.use("/", express.static(__dirname + '/'))

  		var server = http.createServer(app);
  		
 		server.listen(8086, "0.0.0.0", function(){
 			console.log("ok am listening now!!");
 		});

        var node = this;
    }
    
    // Register the node by name. This must be called before overriding any of the
    // Node functions.
    RED.nodes.registerType("webcam", Webcam);

}