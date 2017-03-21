module.exports = function(RED) {
    "use strict";
   
   
    //Listify assumes that the incoming object with have a payload that either has
    //a single object, or had an object with a values array

    function Extract(n) {
        
        RED.nodes.createNode(this,n);
        
        var node = this;

        const _lookup = n.filters.reduce((acc, item)=>{
            const entry = acc[item.source] || []
            entry.push(item.path);
            acc[item.source] = entry;
            return acc;
        },{});

        const _extract = (msg,path)=>{
            return path.reduce((acc,item)=>{
                return msg[item];
            },null)
        }

        console.log("created lookup");
        console.log(_lookup);

        this.on('input', function (msg) {
            
          
            const paths = _lookup[msg.type];
          
            if (paths){
                const extracted = paths.reduce((acc,path)=>{
                    if (path.length > 0){
                        const extracted = _extract(msg, path);
                        if (extracted){
                            acc[path[path.length-1]] = extracted;
                        }
                    }
                    return acc;    
                },{}); 

                if (Object.keys(extracted).length > 0){
                    console.log("sending:")
                    console.log({
                        name: n.name || "extract",
                        id:  n.id,
                        payload: extracted
                    });
                    node.send({
                        name: n.name || "extract",
                        id:  n.id,
                        payload: extracted
                    });
                }
            }
        });
    }
    RED.nodes.registerType("extract",Extract); 
}

