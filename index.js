const express = require("express");
const cors = require('cors');
const http = require('http');

const WebSocket = require("ws");
var app = express();
app.use(cors());
app.use(express.json());
app.use(cors());

app.use(cors({
  origin: ['http://localhost:5173', 'https://tomionagano.ca']
}));

const server = http.createServer(app);
const websocketServer = new WebSocket.Server({ server });

const {
	handleSelection,
	setupGame,
	getEngineMove,
	resetBoard,
	killEngine,
} = require("./controller.js");

websocketServer.getUniqueID = function () {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }
    return s4() + s4() + '-' + s4();
};

websocketServer.on('connection', (socket) => {

  console.log('client connected.');
  socket.id = websocketServer.getUniqueID();
  // Listen for incoming WebSocket messages
  socket.on('message', (data) => {
	const message=JSON.parse(data);
	console.log("message recieved: ", message, "from: ", socket.id);

	switch (message.type){
		case "setupGame":
			setupGame(message, socket);
			break;
		case "handleSelection":
			handleSelection(message, socket);
			break;
		case "getEngineMove":
			getEngineMove(message, socket);
			break;
		case "resetBoard":
			resetBoard(socket);
			break;
		case "killEngine":
			killEngine();
			break;				
	}
  });
  // Listen for WebSocket connection close events
  socket.on('close', () => {
    killEngine(socket.id);
    console.log('Client disconnected');
  });
});


server.listen(5174, () => {
  console.log("Websocket server started on port 5174");
});