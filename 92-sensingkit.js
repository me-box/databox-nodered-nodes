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
			return {subtype, ts, name, address, rssi};
		}
		else if (_seen(["accelerometer", "linear-acceleration","magnetometer","gravity", "gyroscope"], subtype)){
			const [ts,x,y,z] = data;
			return {subtype,ts,x,y,z};
		}
		else if (_seen(["rotation"], subtype)){
			const [ts,x,y,z,cos,headingAccuracy] = data;
			return {subtype,ts,x,y,z,cos,headingAccuracy};
		}
		else if (_seen(["battery"], subtype)){
			const [ts,charge,temperature,voltage,plugged,status,health] = data;
			return {subtype,ts,charge,temperature,voltage,plugged,status,health};
		}
		else if (_seen(["audio-level", "light"], subtype)){
			const [ts,value] = data;
			return {subtype,ts, value};
		}
		return {};
	}
	
   	function startStreaming(macaroon, stream, subtype){
      	
      	console.log("starting streaming...");
      	//databox-driver-mobile.store:8080
        const url =  process.env.TESTING ? `${process.env.MOCK_DATA_SOURCE}/${subtype}` : `http://databox-store-passthrough:8080/api/${subtype}`;  
        console.log(`connecting to ${url}`);
        
        //const url = `http://localhost:8087/api/${subtype}`;
        rs = request.post({url:url, form: {macaroon:macaroon}})
        
        rs.on('error', function(err) {
        	rs.abort();
    		console.log('error connecting - retrying in 3s');
    		console.log(err);
    		setTimeout(function(){
    						startStreaming(macaroon,stream,subtype)
    				   }, 3000);
  		});
  		
    	rs.pipe(stream);
    }

    function SensingKit(n) {
        
        
        console.log(process.env);
        const ARBITER_TOKEN = process.env.ARBITER_TOKEN || "";
        const PORT = process.env.PORT || 8080;
		const ARBITER = process.env.TESTING ? process.env.MOCK_DATA_SOURCE : process.env.DATABOX_ARBITER_ENDPOINT.replace("/api","");
		
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
          	   console.log(str);
          	   const data = str.replace("\n","").split(",");
        
			   const payload = _format_payload(data, n.subtype);
			   
			   node.send({
					name: node.name || "sensingkit",
					id:  node.id,
					type: "sensingkit",
					payload: payload,
			   });   

			   str = "";
			}
			catch(err){
				console.log(err);
				console.log("data is");
				console.log(`[${str.replace("\n","")}]`);
				str = "";
			}
          }
          done();
        }
        
        const formData = {
                token: ARBITER_TOKEN,
                //target: 'databox-driver-mobile.store'
       			target:'databox-store-passthrough'
        }
        
        console.log("calling arbiter");
        console.log(`${ARBITER}/macaroon`);
        
        request.post({url:`${ARBITER}/macaroon`, form: formData},
                function optionalCallback(err, httpResponse, body) {
                	console.log("got response");
                	if (err){
                		console.log("error!");
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
        	console.log("done");
        });
    }

    // Register the node by name. This must be called beforeoverriding any of the
    // Node functions.
    RED.nodes.registerType("sensingkit",SensingKit);

}