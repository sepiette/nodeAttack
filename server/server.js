'use strict';

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var SAT = require('sat');

var neutralColor = '#888';
var minRad = 5;

var ct = 0;

var MAX_START = 30;
var MAX_REACH = 500;
var MAX_SIZE_TO_GROW = 40;
var MAX_SIZE_TO_GROW_NEUTRAL = 15;
var MAX_SIZE_BEFORE_DECAY = 40;

var GROW_RATE = 1;
var GROW_RATE_NEUTRAL = 0.5;
var DECAY_RATE = 0.5;

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
            radius: Math.ceil(Math.random()*(10-5)+5),
            fillColor: neutralColor,
            borderColor: neutralColor,
            owner: -1,
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

//check if click in circle function
function checkInCircle(mouse){
        var n = 0;
        var hit = false;
        while(!hit && n < grid.length){

            var center = {
                x: grid[n].x + grid[n].scaleX,
                y: grid[n].y + grid[n].scaleY
            };

            if(euclidDistance(mouse, center) < grid[n].radius){
                hit = true;
                return n;
            }
            else
            {
                n++;
            }
        }     
}


// distance function for animation
function getDistance(selectedNode, sendNode){
        var distanceX = (sendNode.x + sendNode.scaleX) - (selectedNode.x + selectedNode.scaleX);
        var distanceY = (sendNode.y + sendNode.scaleY) - (selectedNode.y + selectedNode.scaleY);

        console.log("distance x:"+distanceX);
        console.log("distance y:"+distanceY);

        var distance = {
            x: distanceX,
            y: distanceY
        };

        io.emit('distance', distance);

}
//check mass function
function compareMass(index, select, socket){
    var sendNode;
    var difference;
   if(select.radius/2 >= minRad){
       //if it is not a neutral node or your own
        if (grid[index].owner != select.owner){
                if ((select.radius/2) > grid[index].radius){
                    var difference = (select.radius/2) - grid[index].radius;

                    socket.attached_player.sendNode = {
                            id: grid[index].id,
                            x: grid[index].x,
                            y: grid[index].y,
                            scaleX: grid[index].scaleX,
                            scaleY: grid[index].scaleY,
                            radius: Math.floor(difference),
                            fillColor: socket.attached_player.color,
                            borderColor: socket.attached_player.color,
                            owner: socket.attached_player.id,
                            border: 8
                        };

                    sendNode = socket.attached_player.sendNode;
                    if(grid[index].owner != -1){
                        users[grid[index].owner].userNodes.splice(users[grid[index].owner].userNodes.indexOf(sendNode.id),1);
                    }
                    
                    socket.attached_player.userNodes.push(sendNode.id);
                }
                else if(select.radius/2 < grid[index].radius){
                    socket.attached_player.sendNode = {
                            id: grid[index].id,
                            x: grid[index].x,
                            y: grid[index].y,
                            scaleX: grid[index].scaleX,
                            scaleY: grid[index].scaleY,
                            radius: Math.floor(grid[index].radius - (select.radius/2)),
                            fillColor: grid[index].fillColor,
                            borderColor: grid[index].borderColor,
                            owner: grid[index].owner,
                            border: 8
                        };
                }
                else if(select.radius/2 == grid[index].radius){
                    socket.attached_player.sendNode = {
                            id: grid[index].id,
                            x: grid[index].x,
                            y: grid[index].y,
                            scaleX: grid[index].scaleX,
                            scaleY: grid[index].scaleY,
                            radius: 1,
                            fillColor: neutralColor,
                            borderColor: neutralColor,
                            owner: -1,
                            border: 8
                        };
                    sendNode = socket.attached_player.sendNode;
                    if(grid[index].owner != -1){
                        users[grid[index].owner].userNodes.splice(users[grid[index].owner].userNodes.indexOf(sendNode.id),1);
                    }
                }
        }
            
        else{
            socket.attached_player.sendNode = {
                    id: grid[index].id,
                    x: grid[index].x,
                    y: grid[index].y,
                    scaleX: grid[index].scaleX,
                    scaleY: grid[index].scaleY,
                    radius: Math.floor(grid[index].radius + (select.radius/2)),
                    fillColor: socket.attached_player.color,
                    borderColor: socket.attached_player.color,
                    owner: socket.attached_player.id,
                    border: 8
            };
            sendNode = socket.attached_player.sendNode;
            socket.attached_player.userNodes.push(sendNode.id);
        }
    }
    return socket.attached_player.sendNode;
}
//highlight circle function
function highlightClickedCircle(index, socket){
    var newNode;

    if(typeof(socket.attached_player.selectedNode) !== "undefined"){
        //if user selects a node to capture
        if(index !== socket.attached_player.selectedNode.id && 
            (Math.abs(grid[index].scaleX - socket.attached_player.selectedNode.scaleX) <=MAX_REACH &&
            Math.abs(grid[index].scaleY - socket.attached_player.selectedNode.scaleY) <=MAX_REACH)){
            
            //compare mass of two nodes to make comparison
            newNode = compareMass(index, socket.attached_player.selectedNode, socket);
            
            if(socket.attached_player.selectedNode.radius >= minRad){
                socket.attached_player.selectedNode.radius = Math.floor(socket.attached_player.selectedNode.radius/2);
            }
            
            //get rid of border on selected node
            socket.attached_player.selectedNode.borderColor = socket.attached_player.color;
            grid[socket.attached_player.selectedNode.id] = socket.attached_player.selectedNode;

            //add new node index to list of user nodes
            if (typeof(newNode) !== "undefined"){          
                users[socket.attached_player.id] = socket.attached_player;
                grid[index] = newNode;
            }

            //get distance between nodes
            //getDistance(selectedNode, newNode);  
           
            socket.attached_player.selectedNode = undefined;
        }

        //else they de-select the original selected node
        else{

            //get rid of border on selected node
            socket.attached_player.selectedNode.borderColor = socket.attached_player.color;
            grid[socket.attached_player.selectedNode.id] = socket.attached_player.selectedNode;

            socket.attached_player.selectedNode = undefined;
        }
    }

    else{
        //if the index is in the list of user nodes, it can be selected
        if(socket.attached_player.userNodes.indexOf(index) != -1){
            if(grid[index].radius > minRad){
                socket.attached_player.selectedNode = {
                    id: index,
                    x: grid[index].x,
                    y: grid[index].y,
                    scaleX: grid[index].scaleX,
                    scaleY: grid[index].scaleY,
                    radius: grid[index].radius,
                    fillColor: socket.attached_player.color,
                    borderColor: '#000',
                    owner: socket.attached_player.id,
                    border: 8
                };
                grid[index] = socket.attached_player.selectedNode;
                io.emit('selectedNode', socket.attached_player.selectedNode);
            }
            
        }   
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

//Enter Game Function
function enterGame(player, socket){
    socket.attached_player = player;
    users.push(socket.attached_player);
    socket.attached_player.id = users.indexOf(socket.attached_player);
    
    
    console.log("Player " + player.name + " entered the game.");


    var randNum = Math.floor(Math.random()*grid.length);
    
    while(grid[randNum].fillColor != neutralColor){
        console.log('node is already taken');
        randNum = Math.floor(Math.random()*grid.length);
    }
    // TODO: Intelligently pick a random node that isn't already taken
    socket.attached_player.userNodes.push(randNum);
    grid[randNum].fillColor = socket.attached_player.color;
    grid[randNum].borderColor = socket.attached_player.color;
    grid[randNum].radius = MAX_START;
    grid[randNum].owner = socket.attached_player.id;
    
}


app.use(express.static(__dirname + '/../client'));
app.use('/node_modules', express.static(__dirname + '/../node_modules'));
app.use('/', express.static(__dirname + '/../client/index.html'));


io.on('connection', function(socket) {
    console.log("User connected.");
    socket.on('disconnect', function() {
        console.log("User disconnected.");
        if (typeof(socket.attached_player) !== 'undefined') {
            console.log("Player " + socket.attached_player.name + " disconnected.");
            users.splice(users.indexOf(socket.attached_player), 1); // Remove the player who disconnected from the array
            io.sockets.emit('player list', users);
        }
        else {
            console.log("Socket without player disconnected.");
        }
    });
    socket.on('join game', function(player) {
        //TODO: validation. Everything here trusts the client completely.

        enterGame(player, socket);

        io.sockets.emit('player list', users);
        socket.on('board update', function() {
            socket.emit('board update', grid);
        });
        socket.on('player list', function() {
            socket.emit('player list', users);
        });
        socket.on('node clicked', function(nodes) {
            console.log("Node click event fired");
            grid[nodes[0]].radius += grid[nodes[1]].radius / 2;
            grid[nodes[1]].radius /= 2;
            io.sockets.emit('board update', grid);
        });
        io.sockets.emit('board update', grid);
        io.sockets.emit('player list', users);

        socket.on('add scale', function(nodes){ 
            grid = nodes;
        });

        //check to see if click happened in node
        socket.on('click',function(mouse){
            var index = checkInCircle(mouse);
            if(typeof(index) !== 'undefined'){
                highlightClickedCircle(index, socket);
                io.sockets.emit('board update', grid);
            }
            
        });
    });
});

var grow = setInterval(function() {
    for (var i = 0; i < grid.length; i++) {
        if (grid[i].owner !=-1 && grid[i].radius < MAX_SIZE_TO_GROW ) {
            grid[i].radius += GROW_RATE;
        }
        else if(grid[i].owner == -1 && grid[i].radius < MAX_SIZE_TO_GROW_NEUTRAL){
            grid[i].radius += GROW_RATE_NEUTRAL;
        }
        else if (grid[i].radius > MAX_SIZE_BEFORE_DECAY) {
            grid[i].radius -= DECAY_RATE; // Decay
        }
    }
    io.sockets.emit('board update', grid);
}, 800);

http.listen(3000, function() {
    console.log("Listening on 0.0.0.0:3000");
});
