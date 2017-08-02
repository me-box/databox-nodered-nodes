module.exports = function(RED) {
    
    "use strict";
    var WebSocket = require('ws');
    var socket;

    function OpenFace(n) {
        console.log("in openfacce...");

        RED.nodes.createNode(this,n);
        var node = this;

        try{
            console.log("creating new websocket");

            socket = new WebSocket("ws:openface:9001");
            socket.binaryType = "arraybuffer";

            console.log("done creating new websocket");

            socket.onerror = function(err){
                console.log("errored creating scoket", err);
            }

            socket.onopen = function() {
                console.log("created socket");
            }
        
            socket.onclose = function(event){
                console.log("closed socket", event);
            }
            
            socket.onmessage = function(e) {
                console.log("got message",e);
                node.send("hello");
            }
        }catch(error){
            console.log("error connecting to socket", error);
        }

        this.on('input', function (msg) {
            console.log("seen an image, sending to openface");
            if (msg.dataURL){
                if (socket){
                    try{
                        socket.send("ahello!!");
                    }catch(error){
                        console.log("error sending", error)
                    }
                }
            }
        });
    }

    RED.nodes.registerType("openface",OpenFace); 
}

