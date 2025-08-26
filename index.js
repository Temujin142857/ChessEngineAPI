const express = require("express");
const cors = require('cors');
var app = express();
app.use(express.json());
app.use(cors());

app.use(cors({
  origin: 'http://localhost:5173'
}));

const {
	handleSelection,
	setupGame,
	getEngineMove,
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

app.listen(10000, function () {
	console.log("Started application on port %d", 10000);
});
