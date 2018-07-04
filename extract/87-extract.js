module.exports = function (RED) {
    "use strict";

    function Extract(n) {
        console.log("creating extract node")
        RED.nodes.createNode(this, n);
        var node = this;
        const paths = n.filters.reduce((acc, item) => {
            return [...acc, item.path];
        }, []);

        console.log("paths is", paths);

        const _extract = (msg, path) => {
            console.log("extracting msg", msg, " path ", path);

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


                const extracted = paths.reduce((acc, path) => {
                    if (path.length > 0) {
                        const extracted = _extract(msg, path);
                        console.log("extracted is", extracted);

                        if (extracted != undefined) {
                            var keys = [msg.id, ...path]
                            var value = extracted;
                            var res = keys.reduceRight((value, key) => ({ [key]: value }), value);
                            console.log(JSON.stringify(res, null, 4));
                            return res;
                            //const obj = [msg.id, ...path].reduce((o, i) => o[i], {})

                            //console.log("have obj", JSON.stringify(obj));
                            /*const obj = [msg.id, ...path].reverse().reduce((acc, key, i) => {
                                if (i == 0) {
                                    acc = {};

                                    acc[key] = extracted;
                                    console.log("acc is", JSON.stringify(acc));
                                } else {
                                   
                                }
                                return acc[key];
                            }, acc);

                            console.log("extracted", JSON.stringify(obj, null, 4));
                            //[msg.id, ...path].reduce((o, i) => o[i], acc) = extracted;
                            //console.log("extracted obj", JSON.stringify(acc, null, 4));
                            //const ref = [msg.id, ...path].reduce((x, k) => x[k])
                            //ref = extracted;*/
                            //acc[[msg.id, ...path].join(".")] = extracted;
                        }
                    }
                    return acc;
                }, {});

                console.log("----- extracted is ", JSON.stringify(extracted));

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

