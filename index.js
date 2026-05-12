const express = require("express");
const cors = require('cors');

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



websocketServer.on('connection', (socket) => {
  // Log a message when a new client connects
  console.log('client connected.');
  // Listen for incoming WebSocket messages
  socket.on('message', (data) => {
	const message=JSON.parse(data);
	console.log("message recieved: ", message);

	switch (message.type){
		case "startGame":
			startGame(message, socket);
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
			killEngine(socket);
			break;				
	}
  });
  // Listen for WebSocket connection close events
  socket.on('close', () => {
    killEngine();
    console.log('Client disconnected');
  });
});


server.listen(5174, () => {
  console.log("Websocket server started on port 5174");
});