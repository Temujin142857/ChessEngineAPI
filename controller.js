const { spawn } = require("child_process");
const javaExecutable = "java"; // Ensure Java is in your system's PATH
const path = require('path');

// Get absolute path to the JAR
const enginePath = path.join(__dirname, 'Chess_App_Headless.jar');

let engineReady = false;
let playerIsWhite = true;
let engine;

exports.setupGame = (req, res) => {
	engine = spawn(
		javaExecutable,
		["-jar", enginePath, playerIsWhite.toString()],
		{
			stdio: ["pipe", "pipe", "pipe"],
		},
	);
	console.log("hi")
	engine.stdin.write("engine ready?\n");

	const handleStartupResponce = (data) => {
		const output = data.toString();
		console.log("Engine Output:", output);
		console.log("end")
		if (output.includes("ready") && !output.includes("signal")) {
			engineReady = true;
			console.log("recieved ready signal");
			engine.stdout.removeListener("data", handleStartupResponce);
			res.status(200).send("success");
		} else {
			console.log("hi2")
			res.status(500).json({ error: "Error starting engine" });
		}
	};
	engine.stdout.on("data", handleStartupResponce);
};

exports.handleSelection = (req, res) => {
	if (!engineReady) {
		console.log("Engine not ready.");
		return res.status(500).json({ error: "Engine not ready" });
	}

	const { coordinates } = req.body;

	if (!coordinates) {
		console.log("No moves provided.");
		return res.status(400).json({ error: "No moves provided" });
	}

	const message = `coordinates:${coordinates[0]},${coordinates[1]}\n`;

	console.log("Sending to engine:", message);
	engine.stdin.write(message);
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
			res.status(200).json({ board: boardJ });
		} else if (output.includes("selection success")) {
			const temp = output.split(";")[1];
			const highlightTarget = temp.split(":")[1];
			console.log(
				"Sending response - Highlight Target:",
				highlightTarget,
			);
			responded = true;
			res.status(200).json({ highlight: highlightTarget });
		} else if (output.includes("illegal move")) {
			console.log("Sending response - illegal move");
			responded = true;
			res.status(200).json({ result: "illegal move" });
		} else if (output.includes("error")) {
			console.log("Error in engine response.");
			responded = true;
			res.status(500).json({ error: "Error processing selection" });
		}
		if (responded) {
			engine.stdout.removeListener("data", handleEngineResponse);
			console.log("removed");
		}
	};
	engine.stdout.on("data", handleEngineResponse);
};

exports.getEngineMove = (req, res) => {
	if (!engineReady) {
		console.log("Engine not ready.");
		return res.status(500).json({ error: "Engine not ready" });
	}

	const message = `perform engine move\n`;

	engine.stdin.write(message);
	console.log("Sending to engine:", message);
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
			res.status(200).json({ board: boardJ });
		} else if (output.includes("error")) {
			console.log("Error in engine response.");
			responded = true;
			res.status(500).json({ error: "Error processing selection" });
		}
		if (responded) {
			engine.stdout.removeListener("data", handleEngineResponse);
		}
	};
	engine.stdout.on("data", handleEngineResponse);
};

exports.resetBoard = (req, res) => {
	if (!engineReady) {
		console.log("Engine not ready.");
		return res.status(500).json({ error: "Engine not ready" });
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
			res.status(200).json({ message: "success" });
		} else {
			//res.status(500).json({ error: "Error starting engine" });
		}
	};
	engine.stdout.on("data", handleStartupResponce);
};

exports.killEngine = (req, res) => {
	if (!engineReady) {
		console.log("Engine not ready.");
		return res.status(500).json({ error: "Engine not ready" });
	}
	const message = "kill\n";
	engine.stdin.write(message);
	console.log("Sending to engine:", message);

	const handleStartupResponce = (data) => {
		const output = data.toString();
		console.log("Engine Output:", output);
		if (output.includes("program terminated")) {
			engineReady = false;
			res.status(200).json({ message: "success" });
		} else {
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
