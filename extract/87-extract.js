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

        console.log("created lookup");
        console.log(_lookup);

        this.on('input', function (msg) {
            
            console.log("seen a msg");
            console.log(msg);
            node.send(msg);

        });
    }
}