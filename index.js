const express = require("express");
const cors = require('cors');
var app = express();
app.use(cors());
app.use(express.json());
app.use(cors());

app.use(cors({
  origin: ['http://localhost:5173', 'https://tomionagano.ca']
}));

const {
	handleSelection,
	setupGame,
	getEngineMove,
	resetBoard,
	killEngine,
} = require("./controller.js");

app.post("/handleSelection", (req, res) => {
	console.log("handle request recieved");
	handleSelection(req, res);
});

app.get("/startGame", (req, res) => {
	console.log("start game request recieved");
	setupGame(req, res);
});

app.get("/getEngineMove", (req, res) => {
	console.log("get engine move request recieved");
	getEngineMove(req, res);
});

app.get("/resetBoard", (req, res) => {
	resetBoard(req, res);
});

app.get("/killEngine", (req, res) => {
	killEngine(req, res);
});

app.listen(5174, function () {
	console.log("Started application on port %d", 5174);
});
