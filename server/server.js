'use strict';

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var SAT = require('sat');

var selectedNode = undefined;
var ct = 0;

var circles = [];
var V = SAT.Vector;
var C = SAT.Circle;

var ysize = 8;
var xsize = 14;


var grid = [];
var users = [];


for (var y = 0; y < ysize; y++) {
    for (var x = 0; x < xsize; x++) {
        var node = {
            id: ct,
            x: x,
            y: y,
            radius: 20,
            fillColor: '#e34651',
            borderColor: '#e34651',
            border: 8
        };
        grid.push(node);
        ct++;
    }
}

//euclidean algorithm function
function euclidDistance(p1, p2){
    return Math.sqrt(Math.pow(p2.x - p1.x,2) + Math.pow(p2.y-p1.y,2));
}


function checkInCircle(mouse){
        var n = 0;
        var hit = false;
        while(!hit && n < grid.length){

            var center = {
                x: grid[n].x + grid[n].scaleX,
                y: grid[n].y + grid[n].scaleY
            };

            if(euclidDistance(mouse, center) < grid[n].radius){
                console.log('YAY!');
                hit = true;
                return n;
            }
            else
            {
                n++;
            }
        } 
        // return hit;      
}

//highlight circle function
function highlightClickedCircle(index){
    var node;
    if(selectedNode != undefined){
        if(index != selectedNode.id){
            node = {
                id: grid[index].id,
                x: grid[index].x,
                y: grid[index].y,
                scaleX: grid[index].scaleX,
                scaleY: grid[index].scaleY,
                radius: grid[index].radius+(selectedNode.radius/2),
                fillColor: '#7b9ae4',
                borderColor: '#7b9ae4',
                border: 8
            };

            selectedNode.radius = selectedNode.radius/2;
            
            grid[selectedNode.id] = selectedNode;
            grid[index] = node;

            selectedNode = undefined;
        }
    }

    else{
        selectedNode = {
            x: grid[index].x,
            y: grid[index].y,
            radius: grid[index].radius,
            fillColor: '#7b9ae4',
            borderColor: '#7b9ae4',
            border: 8,
            id: index
        };

        grid[index] = selectedNode;
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

    socket.on('join game', function(player) {
        //TODO: validation. Everything here trusts the client completely.
        users.push(player);
        console.log("Player " + player.name + " entered the game.");
        socket.on('board update', function() {
            socket.emit('board update', grid);
        });
        socket.on('player list', function() {
            socket.emit('player list', users);
        });
        socket.emit('board update', grid);
        socket.emit('player list', users);

        socket.on('add scale', function(nodes){ 
            grid = nodes;
            //socket.emit('board update', grid);
        });

        //check to see if click happened in node
        socket.on('click',function(mouse){
            var index = checkInCircle(mouse);
            if(index != undefined){
                highlightClickedCircle(index);
                socket.emit('board update', grid);
            }
            
        });
    });
});



http.listen(3000, function() {
    console.log("Listening on 0.0.0.0:3000");
});
