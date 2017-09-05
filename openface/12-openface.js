module.exports = function(RED) {
    
    "use strict";
    //var WebSocket = require('ws');
    //var socket;
    var net = require('net');
    var connected = false;
    

    const NETSTRING_DELIMITER = ',';
    const NETSTRING_SEPARATOR = ':';
    const NETSTRING_SEPARATOR_CODE = 58;

    const netstringify = (string, { encoding = 'utf-8', response = 'string' } = {}) => {

        let result = [];
        let input = [];

        if (!input) {
            return;
        }

        if (!Array.isArray(string)) {
            input.push(string);
        } else {
            input = string;
        }

        input.forEach((text) => {
            let netstring = [];
            netstring.push(new Buffer(`${text.length}${NETSTRING_SEPARATOR}`, encoding));
            netstring.push(new Buffer(text, encoding));
            netstring.push(new Buffer(NETSTRING_DELIMITER, encoding));
            netstring = Buffer.concat(netstring);
            result.push(netstring);
        });
        //For string result
        if (result.length > 0 && response === 'string') {
            result = result.map(netstring => netstring.toString(encoding));
            return result.join('');
        }
        //Return as buffer for all the other types.
        return Buffer.concat(result);
    };

    const parse = (netstring, { encoding = 'utf-8', response = 'string' } = {}) => {
        let result = [];
        if (!netstring) {
            return;
        }
        netstring = new Buffer(netstring, encoding);

        for (let i = 0, val, lenStart = 0, len, stringStart, string; i < netstring.length ; i++) {

            val = netstring[i];
            //First find the ':' - NETSTRING_SEPARATOR character.
            if (NETSTRING_SEPARATOR_CODE === val) {
                //Find the length digits on the left side of NETSTRING_SEPARATOR(:)
                len = netstring.toString(encoding, lenStart, i);
                len = Number.parseInt(len);
                //Find the string based on the length value and slice the string.
                stringStart = i + 1;
                string = netstring.slice(stringStart, stringStart + len);
                result.push((response === 'string') ? string.toString(encoding): string);
                //Reset index to next string.
                i = stringStart + len + 1;
                lenStart = i;
            }
        }
        return result;
    };

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
                    var msg = parse(data);
                
                    var parsed = msg.map(function(item){
                        return JSON.parse(item);
                    }); 
                    //split the array of points and send each individually
                    parsed[0].forEach(function(payload, i){
                        payload.id = payload.id == -1 ? i : ""+payload.id;
                        console.log(payload);
                        node.send({name: node.name || "openface", payload:payload});
                    });

                }catch(err){
                    console.log("error parsing data");
                }
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
            client.write(netstringify(data));
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

