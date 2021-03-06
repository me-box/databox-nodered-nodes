/**
 * Copyright 2014, 2015 IBM Corp.
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
    var mustache = require("mustache");
    function TriggerNode(n) {
        console.log("creating trigger node!!");
        
        RED.nodes.createNode(this,n);
        
        console.log("created trigger node", n);

        this.op1 = n.op1 || "1";
        this.op2 = n.op2 || "0";
        this.op1type = n.op1type || "str";
        this.op2type = n.op2type || "str";

        if (this.op1type === 'val') {
            if (this.op1 === 'true' || this.op1 === 'false') {
                this.op1type = 'bool'
            } else if (this.op1 === 'null') {
                this.op1type = 'null';
                this.op1 = null;
            } else {
                this.op1type = 'str';
            }
        }
        if (this.op2type === 'val') {
            if (this.op2 === 'true' || this.op2 === 'false') {
                this.op2type = 'bool'
            } else if (this.op2 === 'null') {
                this.op2type = 'null';
                this.op2 = null;
            } else {
                this.op2type = 'str';
            }
        }
        this.extend = n.extend || "false";
        this.units = n.units || "ms";
        this.reset = n.reset || '';
        this.duration = n.duration || 250;
        if (this.duration <= 0) { this.duration = 0; }
        else {
            if (this.units == "s") { this.duration = this.duration * 1000; }
            if (this.units == "min") { this.duration = this.duration * 1000 * 60; }
            if (this.units == "hr") { this.duration = this.duration * 1000 *60 * 60; }
        }
        this.op1Templated = (this.op1type === 'str' && this.op1.indexOf("{{") != -1);
        this.op2Templated = (this.op2type === 'str' && this.op2.indexOf("{{") != -1);
        if ((this.op1type === "num") && (!isNaN(this.op1))) { this.op1 = Number(this.op1); }
        if ((this.op2type === "num") && (!isNaN(this.op2))) { this.op2 = Number(this.op2); }
        if (this.op1 == "null") { this.op1 = null; }
        if (this.op2 == "null") { this.op2 = null; }
        //try { this.op1 = JSON.parse(this.op1); }
        //catch(e) { this.op1 = this.op1; }
        //try { this.op2 = JSON.parse(this.op2); }
        //catch(e) { this.op2 = this.op2; }

        var node = this;
        var tout = null;
        var m2;
        this.on("input", function(msg) {

            console.log("seen a msg");
            console.log("op1", this.op1, "opt2", this.op2, "op1type", this.op1type, "op2type", this.op2type, "duration", this.duration);

            if (msg.hasOwnProperty("reset") || ((node.reset !== '')&&(msg.payload == node.reset)) ) {
                clearTimeout(tout);
                tout = null;
                node.status({});
            }
            else {
                if ((!tout) && (tout !== 0)) {
                    if (node.op2type === "pay" || node.op2type === "payl") { m2 = msg.payload; }
                    else if (node.op2Templated) { m2 = mustache.render(node.op2,msg); }
                    else if (node.op2type !== "nul") {
                        m2 = RED.util.evaluateNodeProperty(node.op2,node.op2type,node,msg);
                    }

                    if (node.op1type === "pay") { }
                    else if (node.op1Templated) { msg.payload = mustache.render(node.op1,msg); }
                    else if (node.op1type !== "nul") {
                        msg.payload = RED.util.evaluateNodeProperty(node.op1,node.op1type,node,msg);
                    }

                    console.log("** -> sending", {
                        name: n.name || "trigger",
                        id: n.id,
                        payload:msg.payload
                    });
                    
                    if (node.op1type !== "nul") { node.send({
                                                                name: n.name || "trigger",
                                                                id: n.id,
                                                                payload:msg.payload
                                                            }
                                                )}//node.send(msg); }

                    if (node.duration === 0) { tout = 0; }
                    else {
                        tout = setTimeout(function() {
                            console.log("seen a timeout!!");

                            if (node.op2type !== "nul") {
                                if (node.op2type === "pay" || node.op2type === "payl"){
                                    var msg2 = RED.util.cloneMessage(msg);
                                    
                                    if (node.op2type === "flow" || node.op2type === "global") {
                                        m2 = RED.util.evaluateNodeProperty(node.op2,node.op2type,node,msg);
                                    }
                                    msg2.payload = m2;
                                    console.log("sending", msg2);
                                    node.send(msg2);
                                }else{

                                    console.log("sending", {
                                        name: n.name || "trigger",
                                        id: n.id,
                                        payload:m2,
                                    });

                                    node.send({
                                        name: n.name || "trigger",
                                        id: n.id,
                                        payload:m2,
                                    })
                                }
                            }

                            tout = null;
                            node.status({});
                        },node.duration);
                    }
                    node.status({fill:"blue",shape:"dot",text:" "});
                }
                else if ((node.extend === "true" || node.extend === true) && (node.duration > 0)) {
                    clearTimeout(tout);
                    if (node.op2type === "payl") { m2 = msg.payload; }
                    tout = setTimeout(function() {
                        if (node.op2type !== "nul") {
                            //var msg2 = RED.util.cloneMessage(msg);
                            //if (node.op2type === "flow" || node.op2type === "global") {
                            //    m2 = RED.util.evaluateNodeProperty(node.op2,node.op2type,node,msg);
                            //}
                            //msg2.payload = m2;
                            //node.send(msg2);
                            console.log("ne is true sending" , m2);

                            node.send({
                                        name: n.name || "trigger",
                                        id: n.id,
                                        payload:m2,
                            });
                        }
                        tout = null;
                        node.status({});
                    },node.duration);
                } else {
                    console.log("am here...!, not sending anything");
                    if (node.op2type === "payl") { m2 = msg.payload; }
                }
            }
        });
        this.on("close", function() {
            if (tout) {
                clearTimeout(tout);
            }
            node.status({});
        });
    }
    RED.nodes.registerType("trigger",TriggerNode);
}
