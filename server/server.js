'use strict';

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var SAT = require('sat');

var selectedNode = undefined;
var sendNode = undefined;
var neutralColor = '#888';
var minRad = 5;

var ct = 0;

var circles = [];
var V = SAT.Vector;
var C = SAT.Circle;

var ysize = 8;
var xsize = 14;


var grid = [];
var users = [];
var currentUser;
var userNodes;

for (var y = 0; y < ysize; y++) {
    for (var x = 0; x < xsize; x++) {
        var node = {
            id: ct,
            x: x,
            y: y,
            radius: 20,
            fillColor: neutralColor,
            borderColor: neutralColor,
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
        // return hit;      
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
function compareMass(index, select){
    console.log('rad bigger: '+ ((select.radius/2) >= grid[index].radius));
    console.log('rad smaller: '+ ((select.radius/2) < grid[index].radius));
   if(select.radius > minRad){
       //if it is not a neutral node or your own
        if (grid[index].fillColor != neutralColor && grid[index].fillColor != select.fillColor){
                
                if ((select.radius/2) >= grid[index].radius/2){
                    sendNode = {
                            id: grid[index].id,
                            x: grid[index].x,
                            y: grid[index].y,
                            scaleX: grid[index].scaleX,
                            scaleY: grid[index].scaleY,
                            radius: grid[index].radius + (select.radius/2),
                            fillColor: currentUser.color,
                            borderColor: currentUser.color,
                            border: 8
                        };
                }
                else if(select.radius/2 < grid[index].radius/2){
                    sendNode = {
                            id: grid[index].id,
                            x: grid[index].x,
                            y: grid[index].y,
                            scaleX: grid[index].scaleX,
                            scaleY: grid[index].scaleY,
                            radius: grid[index].radius - (select.radius/2),
                            fillColor: grid[index].fillColor,
                            borderColor: grid[index].borderColor,
                            border: 8
                        };
                }
        }
            
        else{
            sendNode = {
                    id: grid[index].id,
                    x: grid[index].x,
                    y: grid[index].y,
                    scaleX: grid[index].scaleX,
                    scaleY: grid[index].scaleY,
                    radius: grid[index].radius + (select.radius/2),
                    fillColor: currentUser.color,
                    borderColor: currentUser.color,
                    border: 8
            };
            
        }
    }
    console.log('rad size'+ select.radius);
    return sendNode;
}
//highlight circle function
function highlightClickedCircle(index){
    var newNode;

    if(selectedNode != undefined){
        if(index != selectedNode.id){
            
            //compare mass of two nodes to make comparison
            newNode = compareMass(index, selectedNode);
            // console.log(newNode);
            
            if(selectedNode.radius > minRad){
                selectedNode.radius = selectedNode.radius/2;
            }
            
            selectedNode.borderColor = currentUser.color;

            grid[selectedNode.id] = selectedNode;

            //add new node index to list of user nodes
            if (newNode != undefined){
                userNodes.push(newNode.id);
                grid[index] = newNode;
            }

            //get distance between nodes
            //getDistance(selectedNode, newNode);

            
           
            selectedNode = undefined;
        }
    }

    else{
        //if the index is in the list of user nodes, it can be selected
        if(userNodes.indexOf(index) != -1){
            if(grid[index].radius > minRad){
                selectedNode = {
                    id: index,
                    x: grid[index].x,
                    y: grid[index].y,
                    scaleX: grid[index].scaleX,
                    scaleY: grid[index].scaleY,
                    radius: grid[index].radius,
                    fillColor: currentUser.color,
                    borderColor: '#000',
                    border: 8
                };
                grid[index] = selectedNode;
                io.emit('selectedNode', selectedNode);
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
function enterGame(player){
    users.push(player);
        player.id = users.indexOf(player);
        users[player.id] = player; 
        currentUser = player;
        userNodes = [];
        
        console.log("Player " + player.name + " entered the game.");
        
        var randNum = Math.floor(Math.random()*grid.length);
        userNodes.push(randNum);
        grid[randNum].fillColor = player.color;
        grid[randNum].borderColor = player.color;
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

        enterGame(player);

        users.push(player);
        socket.attached_player = player;
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
        socket.emit('board update', grid);
        socket.emit('player list', users);

        socket.on('add scale', function(nodes){ 
            grid = nodes;
        });

        //check to see if click happened in node
        socket.on('click',function(mouse){
            var index = checkInCircle(mouse);
            if(typeof(index) !== 'undefined'){
                highlightClickedCircle(index);
                io.sockets.emit('board update', grid);
            }
            
        });
    });
});



http.listen(3000, function() {
    console.log("Listening on 0.0.0.0:3000");
});
