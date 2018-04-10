module.exports = function(RED) {
    "use strict";
   
   
    //Listify assumes that the incoming object with have a payload that either has
    //a single object, or had an object with a values array

    function Extract(n) {
        console.log("creating extract node");
        RED.nodes.createNode(this,n);
        
        var node = this;

     
        console.log("in extract with filters", JSON.stringify(n.filters,null,4));

        const _lookup = n.filters.reduce((acc, item)=>{
            const entry = acc[item.sid] || []
            //const [head, ...tail] = item.path;
            //entry.push(tail);
            //entry.push(item.path);
            acc[item.sid] = [...entry, item.path];
            return acc;
        },{});

        console.log("lookup is", JSON.stringify(_lookup,null,4));

        const _extract = (msg,path)=>{
            return path.reduce((acc,item)=>{
                return acc[item];
            },msg)
        }

        this.on('input', function (msg) {
            
            console.log("extract msg:" , JSON.stringify(msg,null,4));    
            console.log("filyters are", JSON.stringify(n.filters,null,4));
            console.log("looking up", msg.id, " in ", JSON.stringify(_lookup));

            const paths = _lookup[msg.id] || [];
         
            console.log("paths are", JSON.stringify(paths,null,4));

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

                console.log("extracted is", JSON.stringify(extracted,null,4));

                if (Object.keys(extracted).length > 0){
                    console.log("sending",{
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

