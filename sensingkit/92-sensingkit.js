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
  var url = require("url");

  //for testing only
  var stream = require('stream');
  var rs = null;     

  function _seen(arr, value){
    return arr.indexOf(value) != -1;
  }
  
  function startStreaming(stream, sensor){
        
        console.log("starting streaming...");
        //databox-driver-mobile.store:8080
        const url =  `${process.env.MOCK_DATA_SOURCE}/api/${sensor}`
        console.log(`connecting to ${url}`);
        
        //const url = `http://localhost:8087/api/${sensor}`;
        rs = request.post({url:url})
        
        rs.on('error', function(err) {
        rs.abort();
        console.log('error connecting - retrying in 3s');
        console.log(err);
        setTimeout(function(){
          startStreaming(stream,sensor)
        }, 3000);
      });
      
      rs.pipe(stream);
  }

  function _format_payload(data,sensor){

    if (_seen(["bluetooth"], sensor)){
      const [ts1, ts, name, address, rssi] = data;  
      return {
          ts:parseInt(ts), 
          name, 
          address, 
          rssi: parseFloat(rssi)
      };
    }
    else if (_seen(["accelerometer", "linear-acceleration","magnetometer","gravity", "gyroscope"], sensor)){
      const [ts,x,y,z] = data;
      return {
        ts : parseInt(ts),
        x : parseFloat(x),
        y : parseFloat(y),
        z : parseFloat(z)
      };
    }
    else if (_seen(["rotation"], sensor)){
      const [ts,x,y,z,cos,headingAccuracy] = data;
      return {
        ts,
        x,
        y,
        z,
        cos,
        headingAccuracy
      };
    }
    else if (_seen(["battery"], sensor)){
      const [ts,charge,temperature,voltage,plugged,status,health] = data;
      return {
        ts,
        charge,
        temperature,
        voltage,
        plugged,
        status,
        health
      };
    }
    else if (_seen(["light", "audio-level"], sensor)){
      const [ts,value] = data;
      return {
        ts:parseInt(ts), 
        value:parseFloat(value)
      };
    }
    
    return {};
  }
  

  function testing(node, n){
     
    var sensorStream = new stream.Writable();
    var str="";

    sensorStream._write = function(chunk, encoding, done){
      
      str += chunk.toString();
      
      if (str.indexOf("\n") != -1){
        try{
          
          const data = str.replace("\n","").split(",");
          const payload = _format_payload(data, n.subtype);

          node.send({
            name: n.name || "sensingkit",
            id:  n.id,
            type: "sensingkit",
            subtype: n.subtype,
            payload: payload,
          });   
          str = "";
        }
        catch(err){
          console.log(err);
          console.log("error: data is");
          console.log(`[${str.replace("\n","")}]`);
          str = "";
        }
      }
      done();
    }  
    startStreaming(sensorStream,n.subtype);
  
    node.on("close", function() {
      sensorStream.end();
      rs.abort();
    });
  }

  function SensingKit(n){
    console.log("creating sensingkit node");
    this.name = n.name;
  
    RED.nodes.createNode(this,n);
    var node = this;
    
    if (process.env.TESTING){
      return testing(this, n);
    }

    const databox = require('node-databox');  

    const API_ENDPOINT = JSON.parse(process.env[`DATASOURCE_${n.id}`] || '{}');
    //const DATASOURCE_DS_light = JSON.parse(process.env.DATASOURCE_DS_light || '{}');
    const mobileStore = ((url) => url.protocol + '//' + url.host)(url.parse(API_ENDPOINT.href));
    const sensorID = API_ENDPOINT['item-metadata'].filter((pair) => pair.rel === 'urn:X-databox:rels:hasDatasourceid')[0].val;
    
    var dataEmitter = null; 

    databox.waitForStoreStatus(mobileStore, 'active')
      .then(() => databox.subscriptions.connect(mobileStore))
      .then((emitter) => {
        
        dataEmitter = emitter;
        databox.subscriptions.subscribe(mobileStore,sensorID,'ts').catch((err)=>{console.log("[ERROR subscribing]",err)});    
        
        dataEmitter.on('data',(hostname, dsID, d)=>{
            const payload = _format_payload(d, n.subtype);
            console.log("got data", JSON.stringify(payload, null,4));
            node.send({
              name: n.name || "sensingkit",
              id:  n.id,
              type: "sensingkit",
              subtype: n.subtype,
              payload: payload,
             }); 
        });
      }).catch((err) => {
         console.log("error with sensinkit data", err);
      });  

      this.on("close", function() {
        console.log("closed")
        //TODO: cleanup
      });
  }

  RED.nodes.registerType("sensingkit",SensingKit);
}