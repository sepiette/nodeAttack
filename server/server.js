'use strict';

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var SAT = require('sat');


var circles = [];
var V = SAT.Vector;
var C = SAT.Circle;

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
app.use('/', express.static(__dirname + '/../client/index.html'));


http.listen(3000, function() {
    console.log("Listening on 0.0.0.0:3000");
});
