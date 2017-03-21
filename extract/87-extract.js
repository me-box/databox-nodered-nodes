module.exports = function(RED) {
    "use strict";
   
   
    //Listify assumes that the incoming object with have a payload that either has
    //a single object, or had an object with a values array
   
    function Extract(n) {
        
        RED.nodes.createNode(this,n);
        
        var node = this;

        const filter = n.filters.reduce()

        this.on('input', function (msg) {
        


        });
    }
}