const { spawn } = require("child_process");
const { read } = require("fs");
const javaExecutable = "java"; // Ensure Java is in your system's PATH
const path = require('path');

// Get absolute path to the JAR
const enginePath = path.join(__dirname, 'Chess_App_Headless.jar');

let playerIsWhite = true;
let engines={};
let sockets={};
let readyStates={};
let awaitingengineMove={};

exports.setupGame = (socket) => {
	engines[socket.id] = spawn(
		javaExecutable,
		["-jar", enginePath, playerIsWhite.toString()],
		{
			stdio: ["pipe", "pipe", "pipe"],
		},
	);
	sockets[socket.id]=socket;	
	engines[socket.id].stdout.on("data", handleEngineMessage);
	readyStates[socket.id]=false;
	awaitingengineMove[socket.id]=false;
	console.log("Sending to engine:", "engine ready?@"+socket.id+"\n");
	engines[socket.id].stdin.write("engine ready?@"+socket.id+"\n");	
};


exports.handleSelection = (message, socket) => {
	if(!engineCheck(socket.id))return;	
	const  coordinates  = message.coordinates;
	if (!coordinates) {
		console.log("No moves provided: ", coordinates);
		return socket.send(JSON.stringify({type: "Error", payload: "No moves provided"}));
	}
	const engineMessage = `coordinates:${coordinates[0]},${coordinates[1]}\n`;
	console.log("Sending to engine:", engineMessage);
	engines[socket.id].stdin.write(engineMessage);
};

exports.getEngineMove = (socket) => {
	if(!engineCheck(socket.id))return;
	const engineMessage = "perform engine move\n";
	console.log("Sending to engine:", engineMessage);
	awaitingengineMove[socket.id]=true;
	engines[socket.id].stdin.write(engineMessage);
};

exports.resetBoard = (socket) => {
	if(!engineCheck(socket.id))return;
	const engineMessage = "reset\n";
	console.log("Sending to engine:", engineMessage);
	engines[socket.id].stdin.write(engineMessage);
};

exports.killEngine = (id) => {
	if(!engineCheck(id))return;
	const message = "kill\n";
	console.log("Sending to engine:", message);
	engines[id].stdin.write(message);	
}

const handleEngineMessage = (data) => {
	const lines = data.toString().split('\n');
	for (const line of lines) {
		let trimmed = line.trim();
		const id=trimmed.split('@')[1];
		trimmed=trimmed.split('@')[0];

		console.log("Engine Output Line:", trimmed, id);
		if (trimmed.includes("ready")) {
			readyStates[id]=true;
			sockets[id].send(JSON.stringify({type: "startGame", payload: "success"}));
			break;
		} 
		//responses to handle selection and get engine move
		else if (trimmed.includes("move success")) {
			const temp = trimmed.split(";")[2];
			const board = temp.split(":")[1];
			console.log("Sending response - Board:", board);
			responded = true;
			const boardJ = parseBoardToJson(board);
			if(awaitingengineMove[id]){
				awaitingengineMove[id]=false;
				sockets[id].send(JSON.stringify({type: "getEngineMove", board: boardJ}));
			} else{
				sockets[id].send(JSON.stringify({ type: "handleSelection", board: boardJ }));
			}
		} 
		else if (trimmed.includes("selection success")) {
			const temp = trimmed.split(";")[1];
			const highlightTarget = temp.split(":")[1];
			console.log(
				"Sending response - Highlight Target:",
				highlightTarget,
			);
			sockets[id].send(JSON.stringify({type: "handleSelection", highlightTarget}));
		} 		
		else if (trimmed.includes("illegal move")) {
			console.log("Sending response - illegal move");
			sockets[id].send(JSON.stringify({type: "handleSelection", result: "illegal move"}));
		} 		
		else if(trimmed.includes("Checkmate")){
			const temp = trimmed.split(" ")[1];			
			sockets[id].send(JSON.stringify({type: "checkmate", winner: temp}));
		} 
		
		//response to a successful reset
		else if (trimmed.includes("complete")) {
			engines[id].stdin.write("engine ready?\n");
		} 
		
		//responce to a successful termination
		else if (trimmed.includes("program terminated")) {
			engines[id].stdout.removeListener("data", handleEngineMessage);
			delete engines[id];
			delete sockets[id];
			delete readyStates[id];	
			delete awaitingengineMove[id];	
			console.log("memory released");
		} 
		
		else if (trimmed.includes("error")) {
			this.resetBoard()
			console.log("Error in engine response.");
			sockets[id].send(JSON.stringify({type: "Error", payload: "Engine ancountered an error"}));
		} 

		else{console.log("wtf?", trimmed);}
	}
};

function engineCheck(id){
if (!readyStates[id]) {
		console.log("Engine not ready.");
		sockets[id].send(JSON.stringify({type: "Error", payload: "Engine not ready"}));
		return false;
	}
	return true;
}


function parseBoardToJson(boardS) {
	const squares = boardS.split("/");
	let board = [[], [], [], [], [], [], [], []];
	for (let index = 0; index < squares.length; index++) {
		if (squares[index].includes(".")) {
			board[Math.floor(index / 8)].push(squares[index].split(".")[1]);
		}
	}
	return board;
}
