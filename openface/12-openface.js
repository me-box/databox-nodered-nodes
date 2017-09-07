module.exports = function(RED) {
    
    "use strict";
    //var WebSocket = require('ws');
    //var socket;
    var net = require('net');
    var connected = false;
    var netstring = require("../utils/netstring");

    function connect(fn){
        connected = false;
        
        var client = new net.Socket();
        
        client.connect(9001, 'openface', function() {
            connected = true;
            if (fn){
                fn(client);
            }
        })
    }

    function OpenFace(n) {
        console.log("**** in new openface...");

        RED.nodes.createNode(this,n);
        var node = this;
        var client;

        connect(function(c){
            client = c;
            addListeners();
        });
    
       
        function addListeners(){

            client.on("data", function(data){  
                try{
                    var msg = netstring.parse(data);
                
                    var parsed = msg.map(function(item){
                        return JSON.parse(item);
                    }); 
                    //split the array of points and send each individually
                    parsed[0].forEach(function(payload, i){
                        payload.others = parsed[0].reduce(function(acc, obj, j){
                            if (i != j){
                                acc.push(obj.name);
                            }
                            return acc;
                        },[]);
                        console.log(payload);
                        node.send({name: node.name || "openface", payload:payload});
                    });

                }catch(err){
                    console.log("error parsing data");
                }
            });

            client.on("uncaughtException", function(err){
                connected = false;
            
                client.destroy(function(err){
                    console.log("error destryong client", err);
                });

                setTimeout(function(){
                    connect(function(c){
                        client = c;
                        addListeners();
                    });

                }, 3000);
            
            });

            client.on("error", function(err){
                connected = false;
            
                client.destroy(function(err){
                    console.log("error destryong client", err);
                });

                setTimeout(function(){
                    connect(function(c){
                        client = c;
                        addListeners();
                    });

                }, 3000);
            });
        }

        this.on('input', function (msg) {
            const data = JSON.stringify(msg);
            client.write(netstring.netstringify(data));
        });

        this.on('close', function(){
            //closing this client cleanly
            console.log("CLOSING CLIENT");
            connected = false;
            client.end();
            client.destroy();
        });
    }

    RED.nodes.registerType("openface",OpenFace); 
}

