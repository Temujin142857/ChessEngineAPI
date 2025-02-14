const express = require("express");
var app = express();
app.use(express.json());

const {
	handleSelection,
	setupGame,
	getEngineMove,
	resetBoard,
	killEngine,
} = require("./controller.js");

app.post("/handleSelection", (req, res) => {
	handleSelection(req, res);
});

app.get("/startGame", (req, res) => {
	setupGame(req, res);
});

app.get("/getEngineMove", (req, res) => {
	getEngineMove(req, res);
});

app.get("/resetBoard", (req, res) => {
	resetBoard(req, res);
});

app.get("/killEngine", (req, res) => {
	killEngine(req, res);
});

app.listen(10000, function () {
	console.log("Started application on port %d", 10000);
});
