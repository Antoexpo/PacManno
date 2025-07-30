const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let pacman = {
  x: 50,
  y: 50,
  radius: 20,
  angle: 0.25,
  mouthOpen: true,
  dx: 2,
  dy: 0
};

function drawPacman() {
  ctx.beginPath();
  let startAngle = pacman.mouthOpen ? pacman.angle * Math.PI : 0;
  let endAngle = pacman.mouthOpen ? (2 - pacman.angle) * Math.PI : 2 * Math.PI;
  ctx.moveTo(pacman.x, pacman.y);
  ctx.arc(pacman.x, pacman.y, pacman.radius, startAngle, endAngle);
  ctx.fillStyle = "yellow";
  ctx.fill();
  ctx.closePath();
}

function update() {
  pacman.x += pacman.dx;
  pacman.y += pacman.dy;

  if (pacman.x > canvas.width) pacman.x = 0;
  if (pacman.x < 0) pacman.x = canvas.width;

  pacman.mouthOpen = !pacman.mouthOpen;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawPacman();
  update();
  requestAnimationFrame(draw);
}

document.addEventListener("keydown", (e) => {
  switch (e.key) {
    case "ArrowUp":
      pacman.dx = 0;
      pacman.dy = -2;
      break;
    case "ArrowDown":
      pacman.dx = 0;
      pacman.dy = 2;
      break;
    case "ArrowLeft":
      pacman.dx = -2;
      pacman.dy = 0;
      break;
    case "ArrowRight":
      pacman.dx = 2;
      pacman.dy = 0;
      break;
  }
});

draw();
