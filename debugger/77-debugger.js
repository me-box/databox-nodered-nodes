/**
 * Copyright 2013 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/




module.exports = function(RED) {
    "use strict";
    var util = require("util");
    var events = require("events");
    var debuglength = RED.settings.debugMaxLength||1000;
    var useColors = false;
    
    var net = require('net');
    var JsonSocket = require('json-socket');
    var client =  new JsonSocket(new net.Socket());
    var connected = false;

    client.on("error", function(err){
        console.log("error connecting, retrying in 2 sec");
        setTimeout(function(){connect()}, 2000);
    });
    
    client.on('uncaughtException', function (err) {
        console.error(err.stack);
        setTimeout(function(){connect()}, 2000);
    });

    function connect(fn){
        connected = false;
        
        const endpoint = process.env.TESTING ? 'databox-test-server' : "127.0.0.1";
        
        client.connect(8435, endpoint, function() {
            console.log('***** debugger connected *******');
            connected = true;
        
            if (fn){
                fn();
            }
        })
    }

    function DebugNode(n) {
    
    	if (!process.env.TESTING) //do nothing if not testing
    		return;
        
        
        
        RED.nodes.createNode(this,n);
         
        connect(function() {
            console.log('Connected');
            closeWebsocket(n.appId);
        });
       
        this.name = n.name;
        this.channel = n.appId;
        this.complete = (n.complete||"payload").toString();

        if (this.complete === "false") {
            this.complete = "payload";
        }

        this.console = n.console;
        this.active = (n.active === null || typeof n.active === "undefined") || n.active;
        var node = this;

        this.on("input",function(msg) {
            if (this.complete === "true") {
            // debug complete msg object
                if (this.console === "true") {
                    node.log("\n"+util.inspect(msg, {colors:useColors, depth:10}));
                }
                if (this.active) {
                    sendDebug({id:this.id,name:this.name,channel:this.channel,topic:msg.topic,msg:msg,_path:msg._path});
                }
            } else {
            // debug user defined msg property
                var property = "payload";
                var output = msg[property];
                if (this.complete !== "false" && typeof this.complete !== "undefined") {
                    property = this.complete;
                    var propertyParts = property.split(".");
                    try {
                        output = propertyParts.reduce(function (obj, i) {
                            return obj[i];
                        }, msg);
                    } catch (err) {
                        output = undefined;
                    }
                }
                if (this.console === "true") {
                    if (typeof output === "string") {
                        node.log((output.indexOf("\n") !== -1 ? "\n" : "") + output);
                    } else if (typeof output === "object") {
                        node.log("\n"+util.inspect(output, {colors:useColors, depth:10}));
                    } else {
                        node.log(util.inspect(output, {colors:useColors}));
                    }
                }
                if (this.active) {
                    sendDebug({id:msg.id||this.id,name:msg.name||this.name,channel:this.channel,topic:msg.topic,property:property,msg:output,_path:msg._path});
                }
            }
        });
        
         this.on("close", function() {
         	 sendClose(this.channel);
         });
    }

    RED.nodes.registerType("debugger",DebugNode);

    function sendDebug(msg) {
        if (msg.msg instanceof Error) {
            msg.format = "error";
            msg.msg = msg.msg.toString();
        } else if (msg.msg instanceof Buffer) {
            msg.format = "buffer ["+msg.msg.length+"]";
            msg.msg = msg.msg.toString('hex');
        } else if (msg.msg && typeof msg.msg === 'object') {
            var seen = [];
            msg.format = msg.msg.constructor.name || "Object";
            var isArray = util.isArray(msg.msg);
            if (isArray) {
                msg.format = "array ["+msg.msg.length+"]";
            }
            if (isArray || (msg.format === "Object")) {
                msg.msg = JSON.stringify(msg.msg, function(key, value) {
                    if (typeof value === 'object' && value !== null) {
                        if (seen.indexOf(value) !== -1) { return "[circular]"; }
                        seen.push(value);
                    }
                    return value;
                }," ");
            } else {
                try { msg.msg = msg.msg.toString(); }
                catch(e) { msg.msg = "[Type not printable]"; }
            }
            seen = null;
        } else if (typeof msg.msg === "boolean") {
            msg.format = "boolean";
            msg.msg = msg.msg.toString();
        } else if (typeof msg.msg === "number") {
            msg.format = "number";
            msg.msg = msg.msg.toString();
        } else if (msg.msg === 0) {
            msg.format = "number";
            msg.msg = "0";
        } else if (msg.msg === null || typeof msg.msg === "undefined") {
            msg.format = (msg.msg === null)?"null":"undefined";
            msg.msg = "(undefined)";
        } else {
            msg.format = "string ["+msg.msg.length+"]";
            msg.msg = msg.msg;
        }

        if (msg.msg.length > debuglength) {
            msg.msg = msg.msg.substr(0,debuglength) +" ....";
        }
       
        sendmessage(msg);
    }

	
	function closeWebsocket(channel){
		console.log("closing any open websockets");
	
        client.write(JSON.stringify({
                                            type: "message", 
                                            msg: {
                                                        channel:channel, 
                                                        type:"control", 
                                                        payload:{
                                                            command:"reset", 
                                                            channel:channel
                                                        }
                                            }
                                        }));
    }
    
	function sendClose(channel){
		
        client.write(JSON.stringify({
                                        type: "message", 
                                        msg: {channel:channel, type:"control", payload:{command:"reset", channel:channel}}
                                     }))
	}
	

    function sendmessage(msg){
        if (connected){
           client.write(JSON.stringify({type: "debug", msg: msg}))
        }
    }

    DebugNode.logHandler = new events.EventEmitter();
    DebugNode.logHandler.on("log",function(msg) {
        if (msg.level === RED.log.WARN || msg.level === RED.log.ERROR) {
            sendDebug(msg);
        }
    });
};
