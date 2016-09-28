/**
 * Copyright 2016 Tom Lodge
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

// If you use this as a template, update the copyright with your own name.
module.exports = function(RED) {
    
    "use strict";
    var request = require('request');
	var rs;
	
	function _seen(arr, value){
		return arr.indexOf(value) != -1;
	}
	
	function _format_payload(data, subtype){
		
		if (_seen(["bluetooth"], subtype)){
			const [ts1, ts, name, address, rssi] = data;	
			return {id:subtype, ts,name, address,rssi};
		}
		else if (_seen(["accelerometer", "linear-acceleration","magnetometer","gravity", "gyroscope"], subtype)){
			const [ts,x,y,z] = data;
			return {id:subtype,ts,x,y,z};
		}
		else if (_seen(["rotation"], subtype)){
			const [ts,x,y,z,cos,headingAccuracy] = data;
			return {id:subtype,ts,x,y,z,cos,headingAccuracy};
		}
		else if (_seen(["battery"], subtype)){
			const [ts,charge,temperature,voltage,plugged,status,health] = data;
			return {id:subtype,ts,charge,temperature,voltage,plugged,status,health};
		}
		else if (_seen(["audio-level", "light"], subtype)){
			const [ts,value] = data;
			return {id:subtype,ts, value};
		}
		return {};
	}
	
   	function startStreaming(macaroon, stream, subtype){
      	console.log("starting streaming");
        const url = `http://databox-driver-mobile.store:8080/api/${subtype}`;  
        //const url = `http://localhost:8087/api/${subtype}`;
        try{
        	rs = request.post({url:url, form: {macaroon:macaroon}}).pipe(stream);
        }catch(err){
        	console.log(`failed to connect to ${url}`);
        	return;
        }	
        //rs.pipe(stream);
    }

    function SensingKit(n) {
       
        const ARBITER_TOKEN = process.env.ARBITER_TOKEN || "";
        const PORT = process.env.PORT || 8080;

        var stream = require('stream');
        var sensorStream = new stream.Writable();
        // Create a RED node
        this.description = n.description;
        this.name = n.name;
		
        RED.nodes.createNode(this,n);
        var node = this;
        var str = "";
       
        sensorStream._write = function(chunk, encoding, done){
          str += chunk.toString();
		  
          if (str.indexOf("\n") != -1){
          	try{
			   const data = JSON.parse(`[${str.replace("\n","")}]`);
			   const payload = _format_payload(data, n.subtype);
		   
			   node.send({
					name: node.name || "sensingkit",
					type: "sensingkit",
					payload: payload,
			   });   

			   str = "";
			}
			catch(err){
				console.log(err);
			}
          }
          done();
        }
        
        const formData = {
                token: ARBITER_TOKEN,
                target: 'databox-driver-mobile.store'
        }
        
        console.log("connecting to arbiter");
        request.post({url:'http://arbiter:8080/macaroon', form: formData},
                function optionalCallback(err, httpResponse, body) {
                	if (err){
                		console.log(err);
                	}
                    startStreaming(body,sensorStream,n.subtype);
        		}
        );
        
         
        this.on("close", function() {
           	console.log("CLOSING STREAM!!");
           	sensorStream.end();
           	console.log("Aborting connection");
           	rs.abort();
        });
    }

    // Register the node by name. This must be called beforeoverriding any of the
    // Node functions.
    RED.nodes.registerType("sensingkit",SensingKit);

}