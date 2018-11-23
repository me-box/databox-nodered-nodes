module.exports = function (RED) {
    "use strict";
    var deepmerge = require("deepmerge");

    function Rules(n) {
        console.log("creating extract node")
        RED.nodes.createNode(this, n);
        var node = this;
        const rules = n.rules || [];

        console.log("in rules node with rules", rules);

        const _extract = (msg, path) => {
            return path.reduce((acc, item) => {
                return acc[item];
            }, msg)
        }

        this.on('input', function (msg) {
            //const src = this.path().hops[0].source;

            console.log("seen a message", JSON.stringify(msg,null,4));

            rules.forEach((rule)=>{
                console.log("evaluatimng rule", JSON.stringify(rule,null,4));
            });
        });
    }
    RED.nodes.registerType("rules", Rules);
}
