module.exports = function (RED) {
    "use strict";
    var deepmerge = require("deepmerge");

    function Extract(n) {
        console.log("creating extract node")
        RED.nodes.createNode(this, n);
        var node = this;
        const paths = n.filters.reduce((acc, item) => {
            return [...acc, item.path];
        }, []);

        console.log("paths is", paths);

        const _extract = (msg, path) => {


            return path.reduce((acc, item) => {
                return acc[item];
            }, msg)
        }

        this.on('input', function (msg) {
            const src = this.path().hops[0].source;

            /*console.log("in extract", JSON.stringify(msg,null,4));
            console.log("path is", JSON.stringify(this.path(),null,4), "src is", src);
            console.log("filters are",JSON.stringify(n.filters,null,4));
            console.log("so PATHS are", paths);
            */

            if (paths) {

                console.log("seen msg", JSON.stringify(msg), " path ", paths);
                const extracted = paths.reduce((acc, path) => {
                    if (path.length > 0) {
                        const _path = path.reduce((acc, item) => {
                            return [...acc, ...item.split(".")]
                        }, [])
                        const extracted = _extract(msg, _path);

                        if (extracted != undefined) {
                            var keys = [msg.id, ..._path]
                            var value = extracted;
                            console.log("acc is", JSON.stringify(acc));
                            const res = keys.reduceRight((value, key) => ({ [key]: value }), extracted);
                            console.log("res is", JSON.stringify(res));
                            const merged = deepmerge(acc, res);

                            console.log("merged is", JSON.stringify(merged, null, 4));
                            return merged;
                            //acc[[msg.id, ...path].join(".")] = extracted;
                        }
                    }
                    return acc;
                }, {});

                console.log("||----- extracted is ", JSON.stringify(extracted));

                if (Object.keys(extracted).length > 0) {
                    node.send({
                        name: n.name || "extract",
                        id: n.id,
                        payload: extracted
                    });
                }
            }
        });
    }
    RED.nodes.registerType("extract", Extract);
}

