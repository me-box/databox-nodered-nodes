module.exports = function(RED) {
    "use strict";
   
   
    //Listify assumes that the incoming object with have a payload that either has
    //a single object, or had an object with a values array

    function Extract(n) {
        console.log("creating extract node");
        RED.nodes.createNode(this,n);
        
        var node = this;

     

        const _lookup = n.filters.reduce((acc, item)=>{
            const entry = acc[item.source] || []
            //const [head, ...tail] = item.path;
            //entry.push(tail);
            entry.push(item.path);
            acc[item.source] = entry;
            return acc;
        },{});


        const _extract = (msg,path)=>{
            return path.reduce((acc,item)=>{
                return acc[item];
            },msg)
        }

        this.on('input', function (msg) {
            
            

            const paths = _lookup[msg.type];
         

            if (paths){
                const extracted = paths.reduce((acc,path)=>{
                    if (path.length > 0){
                        const extracted = _extract(msg, path);
                        if (extracted != undefined){
                            acc[path[path.length-1]] = extracted;
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

