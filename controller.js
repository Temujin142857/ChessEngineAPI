const { spawn } = require("child_process");
const { read } = require("fs");
const javaExecutable = "java"; // Ensure Java is in your system's PATH
const enginePath =
	"Chess_App_Headless.jar";

let engineReady = false;
let playerIsWhite = true;
let engine;

exports.setupGame = (req, res) => {
	// Start the chess engine as a child process
	engine = spawn(
		javaExecutable,
		["-jar", enginePath, playerIsWhite.toString()],
		{
			stdio: ["pipe", "pipe", "pipe"],
		},
	);

	let ready = false;

	// Listen for output from the engine
	const handleStartupResponce = (data) => {
		const lines = data.toString().split('\n');
	for (const line of lines) {
		const trimmed = line.trim();
		console.log("Engine Output Line:", trimmed);
		if (trimmed === "ready") {
			engineReady = true;
			res.status(200).json({ message: "success" });
            ready=true;
			break;
		}
	}
	engine.stdout.removeListener("data", handleStartupResponce);
	if(!ready)res.status(500).json({message: "engine did not startup"})
	};
	engine.stdout.on("data", handleStartupResponce);

	engine.stdin.write("engine ready?\n");	
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
			res.status(200).json({ board });
		} else if (output.includes("selection success")) {
			const temp = output.split(";")[1];
			const highlightTarget = temp.split(":")[1];
			console.log(
				"Sending response - Highlight Target:",
				highlightTarget,
			);
			responded = true;
			res.status(200).json({ highlightTarget });
		} else if (output.includes("illegal move")) {
			const temp = output.split(";")[1];
			const highlightTarget = temp.split(":")[1];
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
		}
	};
	engine.stdout.on("data", handleEngineResponse);
};

exports.getEngineMove = (req, res) => {
	if (!engineReady) {
		console.log("Engine not ready.");
		return res.status(500).json({ error: "Engine not ready" });
	}

	const handleEngineResponse = (data) => {
		const lines = data.toString().split('\n');
		for (const line of lines) {
		const trimmed = line.trim();
		console.log("Engine Output Line:", trimmed);
		if (trimmed.includes("move success")) {
			const temp = trimmed.split(";")[2];
			const board = temp.split(":")[1];
			console.log("Sending response - Board:", board);
			responded = true;
			res.status(200).json({ board });
			break;
		} else if (trimmed.includes("error")) {
			console.log("Error in engine response.");
			responded = true;
			res.status(500).json({ error: "Error processing selection" });
		}
	}		
		if (responded) {
			engine.stdout.removeListener("data", handleEngineResponse);
		}
	};

	const message = "perform engine move\n";
	console.log("Sending to engine:", message);
	engine.stdout.on("data", handleEngineResponse);
	engine.stdin.write(message);

	let responded = false;

	

	
};
