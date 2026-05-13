const { spawn } = require("child_process");
const { read } = require("fs");
const javaExecutable = "java"; // Ensure Java is in your system's PATH
const path = require('path');

// Get absolute path to the JAR
const enginePath = path.join(__dirname, 'Chess_App_Headless.jar');

let engineReady = false;
let playerIsWhite = true;
let engine;

exports.setupGame = (message, socket) => {
	engine = spawn(
		javaExecutable,
		["-jar", enginePath, playerIsWhite.toString()],
		{
			stdio: ["pipe", "pipe", "pipe"],
		},
	);

	let ready = false;

	const handleStartupResponce = (data) => {
		const lines = data.toString().split('\n');
		for (const line of lines) {
			const trimmed = line.trim();
			console.log("Engine Output Line:", trimmed);
			if (trimmed === "ready") {
				engineReady = true;
				socket.send(JSON.stringify({type: "startGame", payload: "success"}));
				ready=true;
				break;
			}
		}
		engine.stdout.removeListener("data", handleStartupResponce);
		if(!ready)socket.send(JSON.stringify({type: "startGame", payload: "engine did not startup"}));
	};
	engine.stdout.on("data", handleStartupResponce);
	engine.stdin.write("engine ready?\n");	
};

exports.handleSelection = (message, socket) => {
	if (!engineReady) {
		console.log("Engine not ready.");
		socket.send(JSON.stringify({type: "Error", payload: "Engine not ready"}));
		return;
	}
	console.log(message)

	const  coordinates  = message.coordinates;

	if (!coordinates) {
		console.log("No moves provided: ", coordinates);
		return socket.send(JSON.stringify({type: "Error", payload: "No moves provided"}));
	}

	const engineMessage = `coordinates:${coordinates[0]},${coordinates[1]}\n`;

	console.log("Sending to engine:", engineMessage);
	engine.stdin.write(engineMessage);
	let responded = false;

	const handleEngineResponse = (data) => {
		const output = data.toString().trim();
		console.log("Engine Output:", output);

		if (output.includes("move success")) {
			const temp = output.split(";")[2];
			const board = temp.split(":")[1];
			console.log("Sending response - Board:", board);
			responded = true;
			const boardJ = parseBoardToJson(board);
			socket.send(JSON.stringify({ type: "handleSelection", board: boardJ }));
		} else if (output.includes("selection success")) {
			const temp = output.split(";")[1];
			const highlightTarget = temp.split(":")[1];
			console.log(
				"Sending response - Highlight Target:",
				highlightTarget,
			);
			responded = true;
			socket.send(JSON.stringify({type: "handleSelection", highlightTarget}));
		} else if (output.includes("illegal move")) {
			console.log("Sending response - illegal move");
			responded = true;
			socket.send(JSON.stringify({type: "handleSelection", result: "illegal move"}));
		} else if (output.includes("error")) {
			console.log("Error in engine response.");
			responded = true;
			socket.send(JSON.stringify({type: "Error", payload: "Error processing selection"}));
		}
		if (responded) {
			engine.stdout.removeListener("data", handleEngineResponse);
			console.log("removed");
		}
	};
	engine.stdout.on("data", handleEngineResponse);
};

exports.getEngineMove = (message, socket) => {
	if (!engineReady) {
		console.log("Engine not ready.");
		socket.send(JSON.stringify({type: "Error", payload: "Engine not ready"}));
		return;
	}

    let responded=false;

	const handleEngineResponse = (data) => {
		const lines = data.toString().split('\n');
		for (const line of lines) {
		const trimmed = line.trim();
		console.log("Engine Output Line:", trimmed);
		if (trimmed.includes("move success")) {
			const temp = trimmed.split(";")[2];
			const board = temp.split(":")[1];
			responded = true;
			const boardJ = parseBoardToJson(board);
			socket.send(JSON.stringify({type: "getEngineMove", board: boardJ}));
			break;
		} else if (trimmed.includes("error")) {
			console.log("Error in engine response.");
			responded = true;
			socket.send(JSON.stringify({type: "Error", payload: "Error processing selection"}));
		}
	}		
		if (responded) {
			console.log('removing listner')
			engine.stdout.removeListener("data", handleEngineResponse);
		}
	};

	const engineMessage = "perform engine move\n";
	console.log("Sending to engine:", engineMessage);
	engine.stdout.on("data", handleEngineResponse);
	engine.stdin.write(engineMessage);
};

exports.resetBoard = (socket) => {
	if (!engineReady) {
		console.log("Engine not ready.");
		socket.send(JSON.stringify({type: "Error", payload: "Engine not ready"}));
	}

	const message = "reset\n";
	engine.stdin.write(message);
	console.log("Sending to engine:", message);

	const handleStartupResponce = (data) => {
		const output = data.toString();
		console.log("Engine Output:", output);
		if (output.includes("complete")) {
			engine.stdin.write("engine ready?\n");
		} else if (output.includes("ready")) {
			engineReady = true;
			engine.stdout.removeListener("data", handleStartupResponce);
			socket.send(JSON.stringify({type: "resetBoard", payload: "success"}));
		} else {
			//res.status(500).json({ error: "Error starting engine" });
		}
	};
	engine.stdout.on("data", handleStartupResponce);
};

exports.killEngine = () => {
	if (!engineReady) {
		console.log("Engine not ready.");		
		return;
	}
	const message = "kill\n";
	engine.stdin.write(message);
	console.log("Sending to engine:", message);

	const handleStartupResponce = (data) => {
		const output = data.toString();
		console.log("Engine Output:", output);
		if (output.includes("program terminated")) {
			engineReady = false;			
			//res.status(500).json({ error: "Error starting engine" });
		}
	};
	engine.stdout.on("data", handleStartupResponce);
};

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
