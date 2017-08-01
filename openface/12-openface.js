module.exports = function(RED) {
    
    "use strict";
    var WebSocket = require('ws');
    
    function OpenFace(n) {
        
        RED.nodes.createNode(this,n);
        var node = this;

        var socket = new WebSocket("ws:127.0.0.1:9001");
        socket.binaryType = "arraybuffer";

        socket.onopen = function() {
           console.log("created socket");
        }
        
        socket.onmessage = function(e) {
            console.log("got message",e);
            node.send(e);
        }

        this.on('input', function (msg) {
            console.log("seen an image, sending to openface");
            if (msg.dataURL){
               socket.send(msg);
            }
        });
    }

    RED.nodes.registerType("openface",OpenFace); 
}

