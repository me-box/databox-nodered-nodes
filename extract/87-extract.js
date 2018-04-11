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
            const src = this.path().hops[0].source;

            console.log("in extract", JSON.stringify(msg,null,4));
            console.log("path is", JSON.stringify(this.path(),null,4), "src is", src);
            console.log("filters are",JSON.stringify(n.filters,null,4));
            console.log("so PATHS are", paths);

            if (paths){
                
                const extracted = paths.reduce((acc,path)=>{
                    console.log("extracting ", JSON.stringify(path,null,4));

                    if (path.length > 0){
                        const extracted = _extract(msg, path);
                        if (extracted != undefined){
                            acc[[src,...path].join(".")] = extracted;
                        }
                    }
                    return acc;    
                },{}); 
        
                if (Object.keys(extracted).length > 0){
                    console.log("sending on", JSON.stringify({
                        name: n.name || "extract",
                        id:  n.id,
                        payload: extracted
                    },null,4));
                    node.send({
                        name: n.name || "extract",
                        id:  n.id,
                        payload: extracted
                    });
                }else{
                    console.log("no extraction!");
                }
            }else{
                console.log("no paths!");
            }
        });
    }
    RED.nodes.registerType("extract",Extract); 
}

