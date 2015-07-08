

var canvas = document.getElementById('grid');
var graph = canvas.getContext("2d");

//Game Variables
var playerName;
var playerNameInput = document.getElementById('playerNameInput');
var socket;
var KEY_ENTER = 13;
var animLoopHandle;
var spin = -Math.PI;
var enemySpin = -Math.PI;
var nodeColors = ['#5df4b7','#7b9ae4','#d12c7b','#e34651','#b4e53f','#3a0d3f','#b5b4d3','#4541ee','#58c8e0','#fc8d05'];


function startGame(){
	playerName = playerNameInput.value.replace(/(<([^>]+)>)/ig, '');
	document.getElementById('startMenuWrapper').style.opacity = 0;
	document.getElementById('gameAreaWrapper').style.opacity = 1;
}
// check if nick is valid alphanumeric characters (and underscores)
function validNick() {
    var regex = /^\w*$/;
    // debug('Regex Test', regex.exec(playerNameInput.value));
    return regex.exec(playerNameInput.value) !== null;
}
window.onload = function(){
	
	//start button to start game
	var btn = document.getElementById('startButton'),
        nickErrorText = document.querySelector('#startMenu .input-error');

    btn.onclick = function () {

        // check if the nick is valid
        if (validNick()) {
            nickErrorText.style.opacity = 0;
            startGame();
        } else {
            nickErrorText.style.opacity = 1;
        }
    };


	//canvas measurements
	var width = 1000;
	var height= 1000;
	var gameWidth = 0;
	var gameHeight = 0;
	var xoffset = -gameWidth;
	var yoffset = -gameHeight;

	var nodes = [];
	var players =[];

	//event listeners
	window.addEventListener('resize', resizeCanvas, false);


	//draw circle function
	function drawCircle(centerX, centerY, radius){
		var theta = 0;
		var x =0;
		var y=0;
		nVerts = 30;

		graph.beginPath();

		for(var i = 0; i < nVerts; i++){
			theta = (i/nVerts) * 2 * Math.PI;
			x = centerX + radius * Math.sin(theta);
			y = centerY + radius * Math.cos(theta);
			graph.lineTo(x, y);

		}
		graph.closePath();
		graph.stroke();
		graph.fill();
	}

	//draw nodes function
	function drawNodes(node){
			graph.strokeStyle = node.fillColor ;
			graph.fillStyle = node.fillColor;
			graph.lineWidth = 0;
			drawCircle(node.x, node.y, (node.radius));			
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
		if(nodes.length ==0)
		{
			for(var w = 4*(height/ 18); w < width; w+=height/ 9){
				for(var h=4*(height/ 18); h < height; h+= height / 9){
					var node = {
						x: w,
						y: h,
						radius: 20,
						fillColor: '#e34651'
						// fillColor: nodeColors[Math.floor(Math.random()*nodeColors.length)]
					};
					nodes.push(node);
					drawNodes(node);
				}
			}
		}
		else
		{
			for(n in nodes){
				drawNodes(nodes[n]);
			}
		}
		
	}
	//resize canvas
	function resizeCanvas() {
				graph.canvas.width = window.innerWidth;
				graph.canvas.height = window.innerHeight;
				// canvas.style.width = canvas.width + 'px';
				// canvas.style.height = canvas.height + 'px';
				drawGrid();
				drawGridNodes();
	}
	
	//euclidean algorithm function
	function euclidDistance(p1, p2){
		return Math.sqrt(Math.pow(p2.x - p1.x,2) + Math.pow(p2.y-p1.y,2));
	}

	//highlight circle function
	function highlightClickedCircle(index){
		var node = {
				x: nodes[index].x,
				y: nodes[index].y,
				radius: nodes[index].radius,
				fillColor: '#5df4b7'
		};
		drawNodes(node);
		nodes[index] = node;
	}

	//draw grid for the first time
	resizeCanvas();


	

	var canvasPos = {
		x: canvas.offsetLeft,
		y: canvas.offsetTop
	};

	window.onmousedown = function(e){
		var mouse = {
			x: e.pageX - canvasPos.x,
			y: e.pageY - canvasPos.y
		};
		
		var n = 0;
		var hit = false;
		while(!hit && n < nodes.length){

			var center = {
				x: nodes[n].x,
				y: nodes[n].y
			};

			if(euclidDistance(mouse, center) < nodes[n].radius){
				console.log('YAY!');
				highlightClickedCircle(n);
				hit = true;
			}
			else
			{
				n++;
			}
		}
		
		// console.log(nodes.length);
	};


//==================== end of window.onload	=======================//
};
