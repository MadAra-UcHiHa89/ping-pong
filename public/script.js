// Canvas Related
const canvas = document.createElement("canvas");
const context = canvas.getContext("2d");
const socket = io("http://localhost:8080");
let isReferee = false;
let paddleIndex = 0;

let width = 500;
let height = 700;

// Paddle
let paddleHeight = 10;
let paddleWidth = 50;
let paddleDiff = 25;
let paddleX = [225, 225];
let trajectoryX = [0, 0];
let playerMoved = false;

// Ball
let ballX = 250;
let ballY = 350;
let ballRadius = 5;
let ballDirection = 1;

// Speed
let speedY = 2;
let speedX = 0;

// Score for Both Players
let score = [0, 0];

// Create Canvas Element
function createCanvas() {
  canvas.id = "canvas";
  canvas.width = width;
  canvas.height = height;
  document.body.appendChild(canvas);
  renderCanvas();
}

// Wait for Opponents
function renderIntro() {
  // Canvas Background
  context.fillStyle = "black";
  context.fillRect(0, 0, width, height);

  // Intro Text
  context.fillStyle = "white";
  context.font = "32px Courier New";
  context.fillText("Waiting for opponent...", 20, canvas.height / 2 - 30);
}

// Render Everything on Canvas
function renderCanvas() {
  // Canvas Background
  context.fillStyle = "black";
  context.fillRect(0, 0, width, height);

  // Paddle Color
  context.fillStyle = "white";

  // Bottom Paddle
  context.fillRect(paddleX[0], height - 20, paddleWidth, paddleHeight);

  // Top Paddle
  context.fillRect(paddleX[1], 10, paddleWidth, paddleHeight);

  // Dashed Center Line
  context.beginPath();
  context.setLineDash([4]);
  context.moveTo(0, 350);
  context.lineTo(500, 350);
  context.strokeStyle = "grey";
  context.stroke();

  // Ball
  context.beginPath();
  context.arc(ballX, ballY, ballRadius, 2 * Math.PI, false);
  context.fillStyle = "white";
  context.fill();

  // Score
  context.font = "32px Courier New";
  context.fillText(score[0], 20, canvas.height / 2 + 50);
  context.fillText(score[1], 20, canvas.height / 2 - 30);
}

// Reset Ball to Center
function ballReset() {
  ballX = width / 2;
  ballY = height / 2;
  speedY = 3;
  socket.emit("ballMove", {
    ballX,
    ballY,
    score,
  });
}

// Adjust Ball Movement
function ballMove() {
  // Vertical Speed
  ballY += speedY * ballDirection;
  // Horizontal Speed
  if (playerMoved) {
    ballX += speedX;
  }

  socket.emit("ballMove", {
    ballX,
    ballY,
    score,
  });
}

// Determine What Ball Bounces Off, Score Points, Reset Ball
function ballBoundaries() {
  // Bounce off Left Wall
  if (ballX < 0 && speedX < 0) {
    speedX = -speedX;
  }
  // Bounce off Right Wall
  if (ballX > width && speedX > 0) {
    speedX = -speedX;
  }
  // Bounce off player paddle (bottom)
  if (ballY > height - paddleDiff) {
    if (ballX >= paddleX[0] && ballX <= paddleX[0] + paddleWidth) {
      // Add Speed on Hit
      if (playerMoved) {
        speedY += 1;
        // Max Speed
        if (speedY > 5) {
          speedY = 5;
        }
      }
      ballDirection = -ballDirection;
      trajectoryX[0] = ballX - (paddleX[0] + paddleDiff);
      speedX = trajectoryX[0] * 0.3;
    } else {
      // Reset Ball, add to Computer Score
      ballReset();
      score[1]++;
    }
  }
  // Bounce off computer paddle (top)
  if (ballY < paddleDiff) {
    if (ballX >= paddleX[1] && ballX <= paddleX[1] + paddleWidth) {
      // Add Speed on Hit
      if (playerMoved) {
        speedY += 1;
        // Max Speed
        if (speedY > 5) {
          speedY = 5;
        }
      }
      ballDirection = -ballDirection;
      trajectoryX[1] = ballX - (paddleX[1] + paddleDiff);
      speedX = trajectoryX[1] * 0.3;
    } else {
      ballReset();
      score[0]++;
    }
  }
}

// Called Every Frame
function animate() {
  if (isReferee) {
    ballMove();
    ballBoundaries();
  }
  // Only if the player is  the referee move the ball and hence update the ball position and reset ball else do not
  renderCanvas();
  window.requestAnimationFrame(animate);
}

// Load Game, Reset Everything
function loadGame() {
  createCanvas();
  renderIntro();
  socket.emit("ready");
}

function startGame() {
  paddleIndex = isReferee ? 0 : 1; // The referee will control the lower paddle
  window.requestAnimationFrame(animate);
  canvas.addEventListener("mousemove", (e) => {
    playerMoved = true;
    paddleX[paddleIndex] = e.offsetX;
    if (paddleX[paddleIndex] < 0) {
      paddleX[paddleIndex] = 0;
    }
    if (paddleX[paddleIndex] > width - paddleWidth) {
      paddleX[paddleIndex] = width - paddleWidth;
    }
    socket.emit("paddleMove", {
      xPosition: paddleX[paddleIndex],
    });
    // Hide Cursor
    canvas.style.cursor = "none";
  });
}

// On Load
loadGame();

socket.on("connect", () => {
  console.log(`Connected to ${socket.id}`);
});

socket.on("startGame", (refereeId) => {
  console.log("Can start game");
  if (socket.id == refereeId) {
    isReferee = true;
    console.log("player is referee id: " + refereeId);
    startGame();
  } else {
    startGame();
  }
});

socket.on("paddleMove", (data) => {
  // Update the opposition player's position since the event is only recived when we have sent the event to update the position , so if
  // if we receive the paddleMove event  => then we can update the position of the opposition player
  const oppositionIndex = 1 - paddleIndex; // since if its 1 -> 1-1 ==0 and if its 0 -> 1-0 ==1 thus reversing it
  paddleX[oppositionIndex] = data.xPosition;
});

socket.on("ballMove", (ballPositionData) => {
  ballX = ballPositionData.ballX;
  ballY = ballPositionData.ballY;
  score = ballPositionData.score;
  console.log(`Ball Position: ${ballX}, ${ballY}`);
});
// Event emitted only by the referee & since the server uses the socket.broadcast.emit() => the referee player
// wouldnt receive this event so no need for checking if the player is the referee or not

// webSocketServer is the web socket server
// While socket is the socket connection betweeen the client and the web socket server
