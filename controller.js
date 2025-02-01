const { spawn } = require("child_process");

const enginePath = "path/to/your/chess/engine";
let engineReady = false;

// Start the chess engine as a child process
const engine = spawn(enginePath);

// Send UCI (Universal Chess Interface) command to initialize the engine
engine.stdin.write("uci\n");

// Listen for output from the engine
engine.stdout.on("data", (data) => {
	const output = data.toString();
	console.log("Engine Output:", output);
	if (output.includes("uciok")) {
		engineReady = true;
	}
});

exports.handleSelection = (req, res) => {
	if (!engineReady) {
		return res.status(500).json({ error: "Engine not ready" });
	}

	const { coordinates } = req.body; // Expecting coordinates that were clicked

	if (!coordinates) {
		return res.status(400).json({ error: "No moves provided" });
	}

	// Send position and request best move
	engine.stdin.write(`position startpos moves ${coordinates}\n`);

	// Wait for the engine's response
	const handleEngineResponse = (data) => {
		const output = data.toString();
		const match = output.match(/bestmove\s(\S+)/);
		if (match) {
			const bestMove = match[1];
			res.json({ bestMove });
			engine.stdout.removeListener("data", handleEngineResponse);
		}
	};

	engine.stdout.on("data", handleEngineResponse);
};
