module.exports = function (RED) {

    "use strict";
    var cv = require('opencv4nodejs');
    var classifier = new cv.CascadeClassifier(cv.HAAR_FRONTALFACE_ALT2);

    function FaceDetect(n) {

        console.log("creating os facedetect node");

        RED.nodes.createNode(this, n);

        this.name = n.name;
        const node = this;

        this.on('input', function (msg) {

            console.log("seen a msg", msg);
            const image = msg.payload.image;
            const imgdata = image.replace(/^data:image\/\w+;base64,/, "");
            const buffer = Buffer.from(imgdata, 'base64');
            const img = cv.imdecode(buffer);
            const grayImg = img.bgrToGray();

            classifier.detectMultiScaleAsync(grayImg, (err, res) => {
                if (err) {
                    console.log(err);
                }
                console.log(res.objects);

                if (!res.objects.length) {
                    console.log("failed to detect any faces!");
                } else {

                    var face = grayImg.getRegion(res.objects[0]);
                    var outBase64 = cv.imencode('.jpg', face).toString('base64');
                    //ws.send(JSON.stringify({ type: "result" }));
                    node.send({
                        payload: {
                            image: `data:image/jpeg;base64,${outBase64}`
                        }
                    })
                }
            });

            this.on("close", () => {

            });
        });
    }
    RED.nodes.registerType("facedetect", FaceDetect);
}
