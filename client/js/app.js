// vim: tabstop=4:softtabstop=0:noexpandtab:shiftwidth=4

var canvas = document.getElementById('grid');
var graph = canvas.getContext("2d");

//Game Variables
var playerName;
var playerNameInput = document.getElementById('playerNameInput');
var socket = io();
window.socket = socket;
var KEY_ENTER = 13;
var animLoopHandle;

function stopGame() {
	// For now, just hide everything.
	document.getElementById('startMenuWrapper').style.opacity = 0;
	document.getElementById('startMenuWrapper').style.display = "none";
	document.getElementById('gameAreaWrapper').style.opacity = 0;
	document.getElementById('gameAreaWrapper').style.display = "none";
	document.getElementById('playerlistwrapper').style.opacity = 0;
	document.getElementById('playerlistwrapper').style.display = "none";


	// Show the disconnect message.
	$('#disconnectmessage').css('display', 'block');
}

// check if nick is valid alphanumeric characters (and underscores)
function validName() {
    var regex = /^\w*$/;
    // debug('Regex Test', regex.exec(playerNameInput.value));
    return regex.exec(playerNameInput.value) !== null;
}

window.onload = function(){
	
//================= CANVAS VARS ===============//
	var width = window.innerWidth;
	var height= window.innerHeight;
	var gameWidth = 0;
	var gameHeight = 0;
	var xoffset = -gameWidth;
	var yoffset = -gameHeight;

	var scaleX = 100;
	var scaleY = 100;

	var canvasPos = {
		x: canvas.offsetLeft,
		y: canvas.offsetTop
	};

//=============== GAME VARS =======================//
	var btn = document.getElementById('startButton');
    var nameErrorText = document.querySelector('#startMenu .input-error');
	var gameStart = false;
	var nodeColors = ['#5df4b7','#7b9ae4','#d12c7b','#b4e53f','#3a0d3f','#b5b4d3','#4541ee','#58c8e0','#fc8d05'];
	
	var requestAnimationFrame =  
        window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        function(callback) {
          return setTimeout(callback,1);
        };

	var playerConfig = {
	    border: 6,
	    textColor: '#FFFFFF',
	    textBorder: '#000000',
	    textBorderSize: 3,
	    defaultSize: 30
	};

	var player = {
		id: -1,
		x: (width/2),
		y: (height/2),
		screenWidth: width,
		screenHeight: height,
		userNodes:[],
		color: nodeColors[Math.floor(Math.random()*(nodeColors.length))]
	};

	var selectedNode;
	var circle;
	var nodeDistance;
	var nodes = [];
	var units = [];
	var players =[];
	var currentPlayer;
	var leaderboard = [];
	var target = {x: player.x, y: player.y};

//====================== Event Listeners =====================//
	window.addEventListener('resize', redrawCanvas, false);
    console.log("Redrawing canvas");

	btn.onclick = function () {

        if (validName()) {
            nameErrorText.style.opacity = 0;
            connectPlayer();
        } else {
            nameErrorText.style.opacity = 1;
        }
    };

	window.onmousedown = function(e){
		var mouse = {
			x: e.pageX - canvasPos.x,
			y: e.pageY - canvasPos.y
		};
		socket.emit('click',mouse);
		//checkInCircle(mouse);
	};
//===================== CONNECT TO GAME FUNCTIONS ===============//
function startGame(){
	document.getElementById('startMenuWrapper').style.opacity = 0;
	document.getElementById('startMenuWrapper').style.display = "none";
	document.getElementById('gameAreaWrapper').style.opacity = 1;
}
	function connectPlayer(){
		
		player.id = Math.floor(Math.random()*10+1);
		playerName = playerNameInput.value.replace(/(<([^>]+)>)/ig, '');
		player.name = playerName;
		player.screenWidth = width;
		player.screenHeight = height;
		player.target = target;
		gameStart = true;
        socket.emit('join game', player);
        socket.emit('player list');
        startGame();
        
	}

//================== DRAWING FUNCTIONS ===================//
	//draw circle function
	function drawCircle(centerX, centerY, radius){
		graph.beginPath();
		graph.arc(centerX, centerY, radius, 0, 2*Math.PI, false);
		graph.stroke();
		graph.fill();
	}

	function drawCircle2(x, y, radius, color){
		graph.strokeStyle = color;
		graph.fillStyle = color;
		graph.beginPath();
		graph.arc(x*100, y*100, radius, 0, 2*Math.PI, false);
		graph.stroke();
		graph.fill();
	}

	//draw nodes function
	function drawNodes(node, scalex, scaley){
			graph.strokeStyle = node.borderColor;
			graph.fillStyle = node.fillColor;
			graph.lineWidth = node.border;
			node.scaleX = scalex;
			node.scaleY = scaley;
			drawCircle(node.x+scaleX, node.y+scaleY, node.radius, scaleX, scaleY);			
	}

	//draw grid function
	function drawGrid(){
		graph.lineWidth = 1;
		graph.strokeStyle = '#000';
		graph.globalAlpha = 0.15;
		graph.beginPath();

		for (var x = 0; x < width; x += height / 18) {
	        graph.moveTo(x, 0);
	        graph.lineTo(x, height);
	    }

	    for (var y = 0; y < height; y += height / 18) {
	        graph.moveTo(0, y);
	        graph.lineTo(width, y);
	    }

	    graph.stroke();
	    graph.globalAlpha = 1;

	}

	//draw grid nodes text
	function drawNodeText(node){
		graph.font = "14px Arial";
		graph.fillStyle = "#fff";
		graph.fillText(node.radius,(node.scaleX), (node.y+node.scaleY+5));
	}

	//draw nodes on grid
	function drawGridNodes(){
		var count = 0;
		for(n in nodes){
			drawNodes(nodes[n], scaleX,scaleY);
			// drawNodeText(nodes[n]);
			if(count == 13){
				scaleY+=100;
				scaleX = 100;
				count = 0;
			}
			else
			{
				scaleX +=100;
				count++;
			}
		}
		socket.emit('add scale', nodes);
	}

	//draw units on grid
	function drawUnitNodes(){
		units.forEach(function(unit){
			drawCircle2(unit.position.x+1, unit.position.y+1, unit.radius, unit.color);
		});
	}

	//resize canvas
	function redrawCanvas() {
				width = window.innerWidth;
				height= window.innerHeight;
				graph.canvas.width = width;
				graph.canvas.height = height;
				scaleX = 100;
				scaleY = 100;

				drawGrid();
				drawGridNodes();
				drawUnitNodes();
	}
	
	// //animation function for node splitting
	// function animate(prop, dist, duration){
	// 	var start = new Date().getTime();
	// 	var end = start + duration;
	// 	var current = circle[prop];
	// 	var goal = {};
		
	// 	if(dist[prop] < 0){
	// 		goal[prop] = circle[prop]-dist;
	// 	}
	// 	else
	// 	{
	// 		goal[prop] = dist-circle[prop];
	// 	}
	
	// 	drawNodes(circle, circle.x, circle.y);

	// 	var step = function(){
	// 		var timestamp = new Date().getTime();
	// 		console.log(dist);

	// 		//update value of property
	// 		if(dist[prop] < 0)
	// 		{
	// 			circle[prop] -=1;
	// 		}
	// 		else if(dist[prop] > 0)
	// 		{
	// 			circle[prop] +=1;
	// 		}

	// 		if(circle[prop] != goal[prop]){
	// 			requestAnimationFrame(step);
	// 		}
	// 	};

	// 	return step();
	// }
//=================== GAME LOOP ================== //	
	//draw grid for the first time
	// function animLoop(){
	// 		gameLoop();
	// }
	function gameLoop(){
		redrawCanvas();
	}



//=================== SOCKET.IO ================== //	
socket.on('disconnect', function() {
	stopGame();
});
socket.on('board update', function(grid, unitList) {
    nodes = grid;
    units = unitList;
    redrawCanvas();
});

socket.on('player list', function(users) {
    // Received player list update
    // TODO: do something with it

    players = users;
   	currentPlayer = players[players.length-1];
		$('#playerlist').empty();
		for (var i = 0; i < players.length; i++) {
			$('#playerlist').append($('<li>' + players[i].name + '</li>'));
		}
});

// socket.on('distance', function(distance){

// 	animate('x',distance,1000);
// 	animate('y',distance,1000);
// });

socket.on('selectedNode', function(node){
	selectedNode = node;
	// circle = {
	// 		x: selectedNode.x + selectedNode.scaleX,
	// 		y: selectedNode.y + selectedNode.scaleY,
	// 		scaleX: selectedNode.scaleX,
	// 		scaleY: selectedNode.scaleY,
	// 		borderColor: selectedNode.borderColor,
	// 		fillColor: selectedNode.fillColor,
	// 		radius: selectedNode.radius/2,
	// 		border: 8
	// };
	// console.log('x: '+circle.x);
	// console.log('y: '+circle.y);

});


//==================== end of window.onload	=======================//
};
