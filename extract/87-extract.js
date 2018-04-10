module.exports = function(RED) {
    "use strict";
   
   
    //Listify assumes that the incoming object with have a payload that either has
    //a single object, or had an object with a values array

    function Extract(n) {
        
        RED.nodes.createNode(this,n);
        var node = this;
        const paths = n.filters.reduce((acc, item)=>{
            return [...acc, item.path];
        },[]);

        const _extract = (msg,path)=>{
            return path.reduce((acc,item)=>{
                return acc[item];
            },msg)
        }

        this.on('input', function (msg) {
            
            if (paths){
                
                const extracted = paths.reduce((acc,path)=>{
                    if (path.length > 0){
                        const extracted = _extract(msg, path);
                        if (extracted != undefined){
                            acc[[msg.id,...path].join(".")] = extracted;
                        }
                    }
                    return acc;    
                },{}); 
        
                if (Object.keys(extracted).length > 0){
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

