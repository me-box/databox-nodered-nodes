module.exports = function(RED) {
    "use strict";
   
   
    //Listify assumes that the incoming object with have a payload that either has
    //a single object, or had an object with a values array

    function Extract(n) {
        
        RED.nodes.createNode(this,n);
        
        var node = this;

        console.log("*******************************");
        console.log("initing with filters", JSON.stringify(n.filters, null, 4));

        const _lookup = n.filters.reduce((acc, item)=>{
            const entry = acc[item.source] || []
            const [head, ...tail] = item.path;
            entry.push(tail);
            acc[item.source] = entry;
            return acc;
        },{});

        console.log("lookup is", JSON.stringify(_lookup,null, 4));

        const _extract = (msg,path)=>{
            return path.reduce((acc,item)=>{
                return acc[item];
            },msg)
        }

        this.on('input', function (msg) {
            
            console.log("new msg:");
            console.log(JSON.stringify(msg,null,4));
            console.log("looking up", msg.type);

            const paths = _lookup[msg.type];
            console.log("ok have paths", JSON.stringify(paths));

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

