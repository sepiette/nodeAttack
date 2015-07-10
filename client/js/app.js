

var canvas = document.getElementById('grid');
var graph = canvas.getContext("2d");

//Game Variables
var playerName;
var playerNameInput = document.getElementById('playerNameInput');
var socket = io();
window.socket = socket;
var KEY_ENTER = 13;
var animLoopHandle;


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
		color: nodeColors[Math.floor(Math.random()*(nodeColors.length))]
	};

	var selectedNode;
	var circle;
	var nodeDistance;
	var nodes = [];
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
	function drawCircle(centerX, centerY, radius,scaleX,scaleY){
		var theta = 0;
		
		var x =0;
		var y=0;
		nVerts = 30;

		graph.beginPath();

		for(var i = 0; i < nVerts; i++){
			theta = (i/nVerts) * 2 * Math.PI;
			x = scaleX+centerX + radius * Math.sin(theta);
			y = scaleY+centerY + radius * Math.cos(theta);
			graph.lineTo(x,y);
		}

		graph.closePath();
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
			drawCircle(node.x, node.y, node.radius, scaleX, scaleY);			
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
	//draw nodes on grid
	function drawGridNodes(){
		var count = 0;
		for(n in nodes){
			drawNodes(nodes[n], scaleX,scaleY);
			
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

socket.on('board update', function(grid) {

    // console.log(nodes);
    // console.log(grid);
    nodes = grid;
    redrawCanvas();
});

socket.on('player list', function(users) {
    // Received player list update
    // TODO: do something with it
    players = users;
   	currentPlayer = players[players.length-1];

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
