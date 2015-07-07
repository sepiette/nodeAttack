var canvas = document.getElementById('grid');
var graph = canvas.getContext("2d");

var c = $('#grid');
var nodeColors = ['#5df4b7','#7b9ae4','#d12c7b','#e34651','#b4e53f','#3a0d3f','#b5b4d3','#4541ee','#58c8e0','#fc8d05'];

window.onload = function(){
	
	//canvas measurements
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	var width = window.innerWidth;
	var height= window.innerHeight;
	var gameWidth = 0;
	var gameHeight = 0;
	var xoffset = -gameWidth;
	var yoffset = -gameHeight;

	//default node
	var nodeConfig = {
		border: 0,
		fillColor:'#f1c4ff',
		defaultSize: 10,
		borderColor: '#f1c4ff'
	};



	var nodes = [];
	var players =[];

	

	//draw circle function
	function drawCircle(centerX, centerY, radius, sides){
		var theta = 0;
		var x =0;
		var y=0;

		graph.beginPath();

		for(var i = 0; i < sides; i++){
			theta = (i/sides) * 2 * Math.PI;
			x = centerX + radius * Math.sin(theta);
			y = centerY + radius * Math.cos(theta);
			graph.lineTo(x, y);

		}
		graph.closePath();
		graph.stroke();
		graph.fill();
	}

	function drawNodes(node){
			graph.strokeStyle = node.fillColor || nodeConfig.borderColor;
			graph.fillStyle = node.fillColor || nodeConfig.fillColor;
			graph.lineWidth = nodeConfig.border;
			
			drawCircle(node.x, node.y, (node.radius || 10) , 30);
			
	}

	//draw grid
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

	drawGrid();


	var canvasPos = {
		x: canvas.offsetLeft,
		y: canvas.offsetTop
	}

	c.on('click', function(e){

		var node = {
			x: e.pageX - canvasPos.x,
			y: e.pageY - canvasPos.y,
			radius: (Math.floor(Math.random() * (50-10)+10) + 1),
			fillColor: nodeColors[Math.floor(Math.random()*nodeColors.length)]
		};
		nodes.push(node);
		drawNodes(node);
		console.log(nodes.length);
	});

//==================== end of window.onload	=======================//
};