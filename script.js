const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const tileSize = 40;

const map = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,2,2,2,1,2,2,2,2,2,2,2,1,2,1],
  [1,2,1,2,1,2,1,1,1,1,1,2,1,2,1],
  [1,2,1,2,2,2,2,2,2,2,1,2,2,2,1],
  [1,2,1,1,1,1,1,1,1,2,1,1,1,2,1],
  [1,2,2,2,2,2,2,2,1,2,2,2,2,2,1],
  [1,1,1,1,1,1,1,2,1,1,1,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,1,1,1,1,1,1,1,1,1,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,1,2,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

const rows = map.length;
const cols = map[0].length;

canvas.width = cols * tileSize;
canvas.height = rows * tileSize;

const scoreEl = document.getElementById('score');
const messageEl = document.getElementById('message');

let pacman = { x: 1, y: 1, dir: {x:1,y:0}, angle:0.25, mouthOpen:true };
let ghost = { x: cols-2, y: rows-2, dir: {x:0,y:-1} };
let score = 0;
let pellets = 0;

for (let r=0;r<rows;r++) {
  for (let c=0;c<cols;c++) {
    if (map[r][c] === 2) pellets++;
  }
}

function drawTile(x,y) {
  if (map[y][x] === 1) {
    ctx.fillStyle = '#0033CC';
    ctx.fillRect(x*tileSize, y*tileSize, tileSize, tileSize);
  } else if (map[y][x] === 2) {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x*tileSize + tileSize/2, y*tileSize + tileSize/2, 5, 0, Math.PI*2);
    ctx.fill();
  }
}

function drawMap() {
  for (let y=0;y<rows;y++) {
    for (let x=0;x<cols;x++) {
      drawTile(x,y);
    }
  }
}

function drawPacman() {
  const px = pacman.x * tileSize + tileSize/2;
  const py = pacman.y * tileSize + tileSize/2;
  let startAngle = pacman.mouthOpen ? pacman.angle * Math.PI : 0;
  let endAngle = pacman.mouthOpen ? (2 - pacman.angle) * Math.PI : Math.PI * 2;
  startAngle += pacman.dir.x === -1 ? Math.PI :
                pacman.dir.y === -1 ? -Math.PI / 2 :
                pacman.dir.y === 1 ? Math.PI / 2 : 0;
  endAngle += pacman.dir.x === -1 ? Math.PI :
              pacman.dir.y === -1 ? -Math.PI / 2 :
              pacman.dir.y === 1 ? Math.PI / 2 : 0;
  ctx.fillStyle = 'yellow';
  ctx.beginPath();
  ctx.moveTo(px,py);
  ctx.arc(px, py, tileSize/2-2, startAngle, endAngle);
  ctx.fill();
}

function drawGhost() {
  const gx = ghost.x * tileSize + tileSize/2;
  const gy = ghost.y * tileSize + tileSize/2;
  ctx.fillStyle = 'red';
  ctx.beginPath();
  ctx.arc(gx, gy, tileSize/2-2, 0, Math.PI*2);
  ctx.fill();
}

function updateScore() {
  scoreEl.textContent = `Score: ${score}`;
}

function moveEntity(entity) {
  const nx = entity.x + entity.dir.x;
  const ny = entity.y + entity.dir.y;
  if (map[ny][nx] !== 1) {
    entity.x = nx;
    entity.y = ny;
  }
}

function moveGhost() {
  const opts = [];
  if (map[ghost.y-1][ghost.x] !== 1) opts.push({x:0,y:-1});
  if (map[ghost.y+1][ghost.x] !== 1) opts.push({x:0,y:1});
  if (map[ghost.y][ghost.x-1] !== 1) opts.push({x:-1,y:0});
  if (map[ghost.y][ghost.x+1] !== 1) opts.push({x:1,y:0});
  if (Math.random() < 0.3) ghost.dir = opts[Math.floor(Math.random()*opts.length)];
  moveEntity(ghost);
}

function eatPellet() {
  if (map[pacman.y][pacman.x] === 2) {
    map[pacman.y][pacman.x] = 0;
    score++;
    updateScore();
    if (score === pellets) {
      messageEl.textContent = 'You Win!';
      playing = false;
    }
  }
}

function checkCollision() {
  if (pacman.x === ghost.x && pacman.y === ghost.y) {
    messageEl.textContent = 'Game Over';
    playing = false;
  }
}

let playing = true;
function gameLoop() {
  if (!playing) return;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawMap();
  moveEntity(pacman);
  eatPellet();
  moveGhost();
  checkCollision();
  drawPacman();
  drawGhost();
  pacman.mouthOpen = !pacman.mouthOpen;
  requestAnimationFrame(gameLoop);
}

updateScore();
requestAnimationFrame(gameLoop);

document.addEventListener('keydown', (e) => {
  switch(e.key) {
    case 'ArrowUp': pacman.dir = {x:0,y:-1}; break;
    case 'ArrowDown': pacman.dir = {x:0,y:1}; break;
    case 'ArrowLeft': pacman.dir = {x:-1,y:0}; break;
    case 'ArrowRight': pacman.dir = {x:1,y:0}; break;
  }
});
