module.exports = function(RED) {
    
    "use strict";
    //var WebSocket = require('ws');
    //var socket;
    var net = require('net');
    var client = new net.Socket();
    var connected = false;
    
    function connect(fn){
        connected = false;
   
        client.connect(9001, 'openface', function() {
            connected = true;
            if (fn){
                fn();
            }
        })
    }

    function OpenFace(n) {
        console.log("in new openface...");

        RED.nodes.createNode(this,n);
        var node = this;

        connect(function(){
            console.log("connected to openface!");
        });
    

        client.on("error", function(err){
            connected = false;
            console.log("error connecting, retrying in 2 sec");
            setTimeout(function(){connect()}, 2000);
        });

        client.on("message", function(msg){
            console.log("nice - seen message!!", msg);
        });
        
        client.on('uncaughtException', function (err) {
            connected = false;
            console.error(err.stack);
            setTimeout(function(){connect()}, 2000);
        });

        /*try{
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
        }*/

        this.on('input', function (msg) {
            console.log("seen something, sending to openface");
            //if (msg.dataURL){
            client.write(JSON.stringify(msg));
                /*if (socket){
                    try{
                        socket.send("ahello!!");
                    }catch(error){
                        console.log("error sending", error)
                    }
                }*/
            //}
        });
    }

    RED.nodes.registerType("openface",OpenFace); 
}

