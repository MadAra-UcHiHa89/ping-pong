const http = require("http");
// const app = require("./api");
const cors = require("cors");
const path = require("path");
const morgan = require("morgan");
const express = require("express");
const app = express();
const server = http.createServer(app);
const io = require("socket.io");
// const { listen: listenForWebSocketServerEvents } = require("./socket");

app.use(morgan("dev"));
app.use(express.static(path.join(__dirname, "public")));

// app.use("/", express.static("public"));

module.exports = app;

const webSocketServer = io(server, {
  cors: {
    origin: "*",
    credentials: true,
  },
}); // Created a websocket server using socket.io by passing the http server as an argument
// Now this server can be used to create a websocket connection with the client

webSocketServer.on("request", (socket) => {
  console.log("request");
  webSocketServer.accept(socket);
});

webSocketServer.on("connection", (socket) => {
  let readyPlayerCount = 0;

  console.log("Client Connected to the webSocketServer");
  // Socket is the connection object for the connection between that particular client and the server
  console.log("Socket id: ", socket.id);

  socket.on("ready", () => {
    console.log("Player Ready (emitted by the client )");
    readyPlayerCount++; // Once player count is 2 we can start the game & server will emit the start GAME EVENT
    console.log(`readyPlayerCount: ${readyPlayerCount}`);
    console.log(`Player id: ${socket.id}`);
    if (readyPlayerCount == 2) {
      // Broadcast to all the clients that the game has started
      webSocketServer.emit("startGame", socket.id);
      // Secind argument is the id of the referee of the game i.e here it will always be the second player
      // i.e which client wil be the referee of the game
    }
  });
  socket.on("disconnect", (reason) => {
    console.log(`Player disconnected: ${socket.id}: ${reason}`);
    readyPlayerCount--;
  });
  // Ready event emitted by the client in the socket connection

  socket.on("paddleMove", (data) => {
    socket.broadcast.emit("paddleMove", data);
    // console.log("Player pos: ", data.xPosition);
  });

  socket.on("ballMove", (ballPositionData) => {
    socket.broadcast.emit("ballMove", ballPositionData);
    // console.log(
    //   `Ball Position at server: ${ballPositionData.ballX}, ${ballPositionData.ballY}`
    // );
  });
});

server.listen(8080, () => {
  console.log(`Server is listening on port 8080`);
});

// listenForWebSocketServerEvents(webSocketServer);
// Now we can listen for all the events of the webSocketServer
