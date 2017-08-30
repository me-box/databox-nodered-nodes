module.exports = function(RED) {
    
    "use strict";
 	var express = require('express');
 	var http = require('http');
    var WebSocket = require('ws');
   

    function Webcam(n) {
 		
 		console.log("creating webcam node");
 		
 		RED.nodes.createNode(this,n);
 		var wss = new WebSocket.Server({ port: 9123 });
    	var server;
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
 				console.log("---starting listening on 8096 ----");
 			});
 		}catch(err){
 			console.log(err);
 		}

 		this.on("close", function() {
        	console.log(`---seen a node close event ----`);
        	wss.close();
        	server.close();
    	});
        
    }
    
    

    // Register the node by name. This must be called before overriding any of the
    // Node functions.
    RED.nodes.registerType("webcam", Webcam);

}