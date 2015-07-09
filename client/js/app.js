

var canvas = document.getElementById('grid');
var graph = canvas.getContext("2d");

//Game Variables
var playerName;
var playerNameInput = document.getElementById('playerNameInput');
var socket = io();
var KEY_ENTER = 13;
var animLoopHandle;

function startGame(){
	document.getElementById('startMenuWrapper').style.opacity = 0;
	document.getElementById('gameAreaWrapper').style.opacity = 1;
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


	var selectedNode = undefined;
	var nodes = [];
	var players =[];
	var leaderboard = [];
	var target = {x: player.x, y: player.y};

//====================== Event Listeners =====================//
	window.addEventListener('resize', redrawCanvas, false);

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
	function connectPlayer(){
		
		player.id = Math.floor(Math.random()*10+1);
		playerName = playerNameInput.value.replace(/(<([^>]+)>)/ig, '');
		player.name = playerName;
		player.screenWidth = width;
		player.screenHeight = height;
		player.target = target;
		gameStart = true;

		console.log(player);
        socket.emit('join game', player);
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
	function drawNodes(node, scaleX, scaleY){
			graph.strokeStyle = node.borderColor;
			graph.fillStyle = node.fillColor;
			graph.lineWidth = node.border;
			node.scaleX = scaleX;
			node.scaleY = scaleY;
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
		console.log(nodes);
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
	
	//euclidean algorithm function
	function euclidDistance(p1, p2){
		return Math.sqrt(Math.pow(p2.x - p1.x,2) + Math.pow(p2.y-p1.y,2));
	}

	//highlight circle function
	function highlightClickedCircle(index){
		var node;
		if(selectedNode != undefined){
			if(index != selectedNode.index){
				node = {
					x: nodes[index].x,
					y: nodes[index].y,
					radius: nodes[index].radius+(selectedNode.radius/2),
					fillColor: player.color,
					borderColor: player.color,
					border: 8
				};

				selectedNode.radius = selectedNode.radius/2;
				
				nodes[selectedNode.index] = selectedNode;
				nodes[index] = node;

				var x = Math.floor(selectedNode.x);
				var y = Math.floor(selectedNode.y);

				splitNode(x,y, node);

				selectedNode = undefined;
			}
		}

		else{
			selectedNode = {
				x: nodes[index].x,
				y: nodes[index].y,
				radius: nodes[index].radius,
				fillColor: player.color,
				borderColor: player.color,
				border: 8,
				index: index
			};

			nodes[index] = selectedNode;
		}
		
		// nodes[index] = node;
		redrawCanvas();
	}
	//check to see if click in a circle function
	// function checkInCircle(mouse){
	// 	var n = 0;
	// 	var hit = false;
	// 	while(!hit && n < nodes.length){

	// 		var center = {
	// 			x: nodes[n].x + nodes[n].scaleX,
	// 			y: nodes[n].y + nodes[n].scaleY
	// 		};

	// 		if(euclidDistance(mouse, center) < nodes[n].radius){
	// 			console.log('YAY!');
	// 			highlightClickedCircle(n);
	// 			hit = true;
	// 		}
	// 		else
	// 		{
	// 			n++;
	// 		}
	// 	}		
	// }

	//animation function for node splitting
	function splitNode(x, y, original){
		oX = Math.floor(original.x);
		oY = Math.floor(original.y);

		
		console.log('split node is working ');
		
		var node = {
			x:x,
			y:y,
			radius: selectedNode.radius,
			fillColor: selectedNode.fillColor,
			borderColor: selectedNode.borderColor,
			border: selectedNode.border,
			index: selectedNode.index
		};

		drawNodes(node);
		if(x < oX && y < oY){
			x+=1;
			y+=1;
		}
		else if(x < oX && y > oY){
			x+=1;
			y-=1;
		}
		else if(x > oX && y < oY){
			x-=1;
			y+=1;
		}
		else if(x > oX && y > oY){
			x-=1;
			y-=1;
		}
		else if(x == oX && y < oY){
			y+=1;
		}
		else if(x == oX && y > oY){
			y-=1;
		}
		else if(x < oX && y == oY){
			x+=1;
		}
		else if(x > oX && y == oY){
			x-=1;
		}

		
		if(x != oX && y != oY) {
			setTimeout(splitNode(x,y,original), 2000);
		}

		// redrawCanvas();	
			
	}

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

socket.on('player list', function(players) {
    // Received player list update
    // TODO: do something with it
    // console.log(players);
});

// Call this every time a board update is needed
// socket.emit('board update');

//==================== end of window.onload	=======================//
};
