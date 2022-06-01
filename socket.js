// Creating a function which lstens for all events of the sockets of the webcoskte server to basically
// separate the code into a differetnt file

let readyPlayerCount = 0; // Now of connections ready to play the game
function listen(webSocketServer) {
  webSocketServer.on("request", (socket) => {
    console.log("request");
    webSocketServer.accept(socket);
  });

  webSocketServer.on("connection", (socket) => {
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
}

module.exports = { listen };
