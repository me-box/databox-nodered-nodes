module.exports = function(RED) {
    
    "use strict";
    //var WebSocket = require('ws');
    //var socket;
    var net = require('net');
    var client = new net.Socket();
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
            console.log("error!", err);
            connected = false;
            setTimeout(function(){connect()}, 500);
        });

        client.on("data", function(data){
            console.log("got a message");
            node.send({name: node.name || "openface", payload:parse(data)});
        });
        
        client.on('uncaughtException', function (err) {
            connected = false;
            console.error(err.stack);
            setTimeout(function(){connect()}, 2000);
        });

        this.on('input', function (msg) {
            const data = JSON.stringify(msg);
            client.write(netstringify(data));
        });
    }

    RED.nodes.registerType("openface",OpenFace); 
}

