var socket;
var vidReady = false;
var vid = document.getElementById('videoel');

navigator.getUserMedia = navigator.getUserMedia 
						|| navigator.webkitGetUserMedia 
						|| (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) ? function(c, os, oe) { navigator.mediaDevices.getUserMedia(c).then(os,oe);} : null 
						|| navigator.msGetUserMedia;


window.requestAnimFrame = (function() {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function(/* function FrameRequestCallback */ callback, /* DOMElement Element */ element) {
            return window.setTimeout(callback, 1000/60);
        };
})();

if (navigator.getUserMedia) {
    var videoSelector = {video : true};
    navigator.getUserMedia(videoSelector, umSuccess, function() {
             alert("Error fetching video from webcam");
    });
}

function umSuccess(stream) {
    if (vid.mozCaptureStream) {
        vid.mozSrcObject = stream;
    } else {
        vid.src = (window.URL && window.URL.createObjectURL(stream)) || stream;
    }
    vid.play();
    vidReady = true;
    sendFrameLoop();
}

function sendFrameLoop() {

    if (socket == null || socket.readyState != socket.OPEN || !vidReady) {
        return;
    }

    var canvas = document.createElement('canvas');
    canvas.width = vid.width;
    canvas.height = vid.height;
    var cc = canvas.getContext('2d');
    cc.drawImage(vid, 0, 0, vid.width, vid.height);
    var apx = cc.getImageData(0, 0, vid.width, vid.height);

    var dataURL = canvas.toDataURL('image/jpeg', 0.6)

    var msg = {
        'type': 'FRAME',
        'dataURL': dataURL,
    };

    socket.send(JSON.stringify(msg));
    setTimeout(function() {requestAnimFrame(sendFrameLoop)}, 250);
}

function createSocket(address, name) {
    
    socket = new WebSocket(address);
    socket.binaryType = "arraybuffer";
    
    socket.onopen = function() {
        socket.send(JSON.stringify({'type': 'NULL'}));
    }

    socket.onmessage = function(e) {
        console.log(e);
    }
 
    socket.onerror = function(e) {
        console.log("Error creating WebSocket connection to " + address);
        console.log(e);
    }
 
    socket.onclose = function(e) {
        console.log("closed");
    }
}

createSocket("ws:" + window.location.hostname + ":9000");
