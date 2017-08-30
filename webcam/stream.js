var socket;
var vidReady = false;
var vid 

window.onload = function(){
	console.log("window loaded");

	vid = document.getElementById('videoel');

	navigator.getUserMedia = navigator.getUserMedia 
						|| navigator.webkitGetUserMedia 
						|| (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) ? function(c, os, oe) { navigator.mediaDevices.getUserMedia(c).then(os,oe);} : null 
						|| navigator.msGetUserMedia;




	if (navigator.getUserMedia) {
	    navigator.getUserMedia({video : true}, umSuccess, function() {
	             alert("Error fetching video from webcam");
	    });
	}
}	

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
	console.log("in send frame loop!");

    if (socket == null || socket.readyState != socket.OPEN || !vidReady) {
    	console.log("returning!");
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
        'dataURL': dataURL,
    };

    socket.send(JSON.stringify(msg));
    setTimeout(function() {
    	requestAnimFrame(sendFrameLoop)
    }, 250);
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

createSocket("ws:" + window.location.hostname + ":9123");
