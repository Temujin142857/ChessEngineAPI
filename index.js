const express = require("express");
var app = express();
const handleSelection = require("controller.js");

app.post("/", (req, res) => {
	handleSelection(req, res);
});

app.listen(10000, function () {
	console.log("Started application on port %d", 10000);
});
