'use strict';

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var SAT = require('sat');


var circles = [];
var V = SAT.Vector;
var C = SAT.Circle;

var ysize = 8;
var xsize = 14;


var grid = [];

for (var y = 0; y < ysize; y++) {
    for (var x = 0; x < xsize; x++) {
        var node = {
            x: x,
            y: y,
            radius: 20,
            fillColor: '#e34651',
            borderColor: '#e34651',
            border: 8
        };
        grid.push(node);
    }
}

//collision detection function
function collides(newCircle, circles) {

	for (var i=0; i < circles.length; i++) {

		var response = new SAT.Response();
		var collided = SAT.testCircleCircle(newCircle, circles[i], response);
		if (collided) {
			return collided;
		}

	}
	return false;
}

app.use(express.static(__dirname + '/../client'));
app.use('/node_modules', express.static(__dirname + '/../node_modules'));
app.use('/', express.static(__dirname + '/../client/index.html'));


io.on('connection', function(socket) {
    console.log("User connected.");
    socket.on('disconnect', function() {
        console.log("User disconnected.");
    });
    socket.on('board update', function() {
        socket.emit('board update', grid);
    });
});


http.listen(3000, function() {
    console.log("Listening on 0.0.0.0:3000");
});
