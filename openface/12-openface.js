module.exports = function(RED) {
    
    "use strict";
    var WebSocket = require('ws');
    var socket;

    function OpenFace(n) {
        
        RED.nodes.createNode(this,n);
        var node = this;

        try{
            socket = new WebSocket("ws:openface:9001");
            socket.binaryType = "arraybuffer";

            socket.onopen = function() {
                console.log("created socket");
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

