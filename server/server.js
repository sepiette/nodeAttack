'use strict';

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var SAT = require('sat');

var selectedNode = undefined;
var sendNode = undefined;

var ct = 0;

var circles = [];
var V = SAT.Vector;
var C = SAT.Circle;

var ysize = 8;
var xsize = 14;


var grid = [];
var users = [];
var currentUser;
var defaultPlayerMass = 10;


for (var y = 0; y < ysize; y++) {
    for (var x = 0; x < xsize; x++) {
        var node = {
            id: ct,
            x: x,
            y: y,
            mass: 7,
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

// determine mass from radius of circle
function massToRadius (mass) {
    return 4 + Math.sqrt(mass) * 6;
};

//check if click in circle function
function checkInCircle(mouse){
        var n = 0;
        var hit = false;
        while(!hit && n < grid.length){

            var center = {
                x: grid[n].x + grid[n].scaleX,
                y: grid[n].y + grid[n].scaleY
            };

            if(euclidDistance(mouse, center) < massToRadius(grid[n].mass)){
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
function getDistance(){
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

//highlight circle function
function highlightClickedCircle(index){
    var node;
  
    if(selectedNode != undefined){
        if(index != selectedNode.id){
            sendNode = {
                id: grid[index].id,
                x: grid[index].x,
                y: grid[index].y,
                scaleX: grid[index].scaleX,
                scaleY: grid[index].scaleY,
                mass: grid[index].mass+(selectedNode.mass/2),
                radius: massToRadius(grid[index].mass+(selectedNode.mass/2)),
                fillColor: currentUser.color,
                borderColor: currentUser.color,
                border: 8
            };

            selectedNode.radius = selectedNode.radius/2;
            selectedNode.mass = selectedNode.mass/2;
            
            grid[selectedNode.id] = selectedNode;
            grid[index] = sendNode;

            getDistance();

            selectedNode = undefined;
        }
    }

    else{
        selectedNode = {
            id: index,
            x: grid[index].x,
            y: grid[index].y,
            scaleX: grid[index].scaleX,
            scaleY: grid[index].scaleY,
            mass: grid[index].mass,
            radius: grid[index].radius,
            fillColor: currentUser.color,
            borderColor: currentUser.color,
            border: 8
        };
        grid[index] = selectedNode;
        currentUser.control.push(selectedNode);
        io.emit('selectedNode', selectedNode);
    }
    
}
function balanceMass() {



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

    var radius = massToRadius(defaultPlayerMass);
    //var position = newPlayerInitialPosition == 'farthest' ? util.uniformPosition(users, radius) : util.randomPosition(radius);

    // var currentUser = {
    //     id: socket.id,
    //     x: x,
    //     y: y,
    //     mass: defaultPlayerMass,
    //     radius: massToRadius(defaultPlayerMass),
    //     //hue: Math.round(Math.random() * 360),
    //     //lastHeartbeat: new Date().getTime(),
    //     control: [],
    //     target: {
    //         x: 0,
    //         y: 0
    //     }
    // };

    socket.on('disconnect', function() {
        console.log("User disconnected.");
    });
    socket.on('join game', function(player) {
        //TODO: validation. Everything here trusts the client completely.
        console.log('Player ' + player.id + ' connecting');
        
        var radius = massToRadius(defaultPlayerMass);
        //var position = c.newPlayerInitialPosition == 'farthest' ? util.uniformPosition(users, radius) : util.randomPosition(radius);

        player.mass = defaultPlayerMass;
        player.radius = massToRadius(defaultPlayerMass);
        player.control = [];

        users.push(player);
        player.id = users.indexOf(player);
        users[player.id] = player; 
        currentUser = player;

        console.log(currentUser.control);

        console.log("Player " + player.name + " entered the game.");
        var randNum = Math.floor(Math.random()*grid.length);
        grid[randNum].fillColor = player.color;
        grid[randNum].borderColor = player.color;

        io.sockets.emit('board update', grid);

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
            if(index != undefined){
                highlightClickedCircle(index);
                console.log(currentUser.control);
                socket.emit('board update', grid);
            }
            
        });
    });
});



http.listen(8000, function() {
    console.log("Listening on 0.0.0.0:8000");
});