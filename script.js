const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const TILE = 20; // 28x31 grid

// Directions
const DIRS = {
  ArrowUp: {x: 0, y: -1},
  ArrowDown: {x: 0, y: 1},
  ArrowLeft: {x: -1, y: 0},
  ArrowRight: {x: 1, y: 0},
  w: {x: 0, y: -1},
  s: {x: 0, y: 1},
  a: {x: -1, y: 0},
  d: {x: 1, y: 0}
};

// Simple map generator
function createMap() {
  const map = [];
  for (let y = 0; y < 31; y++) {
    const row = [];
    for (let x = 0; x < 28; x++) {
      if (y === 0 || y === 30 || x === 0 || x === 27) row.push(0); else row.push(1);
    }
    map.push(row);
  }
  // inner walls
  for (let y = 4; y < 27; y += 6) {
    for (let x = 4; x < 23; x += 6) {
      map[y][x] = 0;
      map[y][x+1] = 0;
      map[y+1][x] = 0;
    }
  }
  // ghost door
  map[15][13] = 4;
  map[15][14] = 4;
  // big pellets
  map[1][1] = 3;
  map[1][26] = 3;
  map[29][1] = 3;
  map[29][26] = 3;
  return map;
}

const level = createMap();
let remainingPellets = level.flat().filter(v => v === 1 || v === 3).length;

const pacman = {
  x: 14 * TILE,
  y: 23 * TILE,
  dir: {x: 0, y: 0},
  next: {x: 0, y: 0},
  lives: 3,
  score: 0
};

document.getElementById('lives').textContent = `Lives: ${pacman.lives}`;


const ghosts = [
  { x: 13 * TILE, y: 14 * TILE, color: 'red', dir: {x: 1, y: 0}, start: {x: 13, y: 14}, frightened: false, dead: false },
  { x: 14 * TILE, y: 14 * TILE, color: 'pink', dir: {x: -1, y: 0}, start: {x: 14, y: 14}, frightened: false, dead: false },
  { x: 13 * TILE, y: 15 * TILE, color: 'cyan', dir: {x: 1, y: 0}, start: {x: 13, y: 15}, frightened: false, dead: false },
  { x: 14 * TILE, y: 15 * TILE, color: 'orange', dir: {x: -1, y: 0}, start: {x: 14, y: 15}, frightened: false, dead: false }
];

let powerTimer = 0;
let lastTime = 0;
let playing = true;

function tileAt(x, y) {
  const cx = Math.floor(x / TILE);
  const cy = Math.floor(y / TILE);
  return level[cy] && level[cy][cx];
}

function canMove(x, y) {
  const t = tileAt(x, y);
  return t !== 0 && t !== 4;
}

function moveEntity(entity, speed) {
  const nx = entity.x + entity.dir.x * speed;
  const ny = entity.y + entity.dir.y * speed;
  if (entity.x % TILE === 0 && entity.y % TILE === 0) {
    // choose new direction if blocked
    if (!canMove(nx + entity.dir.x * (TILE - 1), ny + entity.dir.y * (TILE - 1))) {
      entity.dir = {x: 0, y: 0};
    }
    if (entity.next && canMove(entity.x + entity.next.x * TILE, entity.y + entity.next.y * TILE)) {
      entity.dir = entity.next;
    }
  }
  if (canMove(nx, ny)) {
    entity.x = nx;
    entity.y = ny;
  }
}

function drawMap() {
  for (let y = 0; y < level.length; y++) {
    for (let x = 0; x < level[y].length; x++) {
      const val = level[y][x];
      if (val === 0) {
        ctx.fillStyle = '#0033ff';
        ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
      } else if (val === 1) {
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x * TILE + TILE / 2, y * TILE + TILE / 2, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (val === 3) {
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x * TILE + TILE / 2, y * TILE + TILE / 2, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

function drawPacman() {
  ctx.fillStyle = 'yellow';
  ctx.beginPath();
  let angle = Math.PI / 4;
  if (pacman.dir.x === 1) angle = Math.PI / 4;
  else if (pacman.dir.x === -1) angle = (5 * Math.PI) / 4;
  else if (pacman.dir.y === -1) angle = (7 * Math.PI) / 4;
  else if (pacman.dir.y === 1) angle = (3 * Math.PI) / 4;
  ctx.arc(pacman.x + TILE / 2, pacman.y + TILE / 2, TILE / 2 - 2, angle, angle + Math.PI * 1.5);
  ctx.lineTo(pacman.x + TILE / 2, pacman.y + TILE / 2);
  ctx.fill();
}

function drawGhost(g) {
  ctx.fillStyle = g.frightened ? 'blue' : g.color;
  ctx.fillRect(g.x, g.y, TILE, TILE);
}

function resetPositions() {
  pacman.x = 14 * TILE;
  pacman.y = 23 * TILE;
  pacman.dir = {x: 0, y: 0};
  pacman.next = {x: 0, y: 0};
  ghosts.forEach(g => {
    g.x = g.start.x * TILE;
    g.y = g.start.y * TILE;
    g.dir = {x: 0, y: 0};
    g.dead = false;
    g.frightened = false;
  });
}

function updateGhosts(delta) {
  ghosts.forEach(g => {
    if (g.dead) {
      // move back to start
      const dx = g.start.x * TILE - g.x;
      const dy = g.start.y * TILE - g.y;
      if (Math.abs(dx) < 2 && Math.abs(dy) < 2) {
        g.dead = false;
        g.frightened = false;
        g.x = g.start.x * TILE;
        g.y = g.start.y * TILE;
      } else {
        g.dir = { x: Math.sign(dx), y: Math.sign(dy) };
      }
    } else if (g.x % TILE === 0 && g.y % TILE === 0) {
      // choose random direction
      const options = [];
      for (const d of [DIRS.ArrowUp, DIRS.ArrowDown, DIRS.ArrowLeft, DIRS.ArrowRight]) {
        if (canMove(g.x + d.x * TILE, g.y + d.y * TILE) && !(g.dir.x === -d.x && g.dir.y === -d.y)) {
          options.push(d);
        }
      }
      if (options.length) {
        g.dir = options[Math.floor(Math.random() * options.length)];
      }
    }
    moveEntity(g, 2);
  });
}

function checkCollisions() {
  const pc = {x: pacman.x + TILE / 2, y: pacman.y + TILE / 2};
  ghosts.forEach(g => {
    if (!g.dead) {
      const gc = {x: g.x + TILE / 2, y: g.y + TILE / 2};
      if (Math.hypot(pc.x - gc.x, pc.y - gc.y) < TILE / 2) {
        if (g.frightened) {
          g.dead = true;
          pacman.score += 200;
        } else {
          pacman.lives--;
          document.getElementById('lives').textContent = `Lives: ${pacman.lives}`;
          if (pacman.lives <= 0) {
            playing = false;
            document.getElementById('message').textContent = 'Game Over';
          }
          resetPositions();
        }
      }
    }
  });
}

function eatPellets() {
  if (pacman.x % TILE === 0 && pacman.y % TILE === 0) {
    const cx = pacman.x / TILE;
    const cy = pacman.y / TILE;
    const val = level[cy][cx];
    if (val === 1 || val === 3) {
      level[cy][cx] = 2;
      remainingPellets--;
      pacman.score += val === 3 ? 50 : 10;
      document.getElementById('score').textContent = `Score: ${pacman.score}`;
      if (val === 3) {
        powerTimer = 7000;
        ghosts.forEach(g => g.frightened = true);
      }
      if (remainingPellets === 0) {
        playing = false;
        document.getElementById('message').textContent = 'You Win!';
      }
    }
  }
}

function update(time = 0) {
  const delta = time - lastTime;
  lastTime = time;
  if (!playing) return;
  if (powerTimer > 0) {
    powerTimer -= delta;
    if (powerTimer <= 0) ghosts.forEach(g => g.frightened = false);
  }
  moveEntity(pacman, 2);
  eatPellets();
  updateGhosts(delta);
  checkCollisions();
  draw();
  requestAnimationFrame(update);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawMap();
  drawPacman();
  ghosts.forEach(drawGhost);
}

window.addEventListener('keydown', (e) => {
  if (DIRS[e.key]) {
    pacman.next = DIRS[e.key];
  } else if (e.key === ' ') {
    playing = !playing;
    if (playing) update();
  }
});

// mobile controls
function handle(id, dir) {
  const btn = document.getElementById(id);
  ['touchstart', 'mousedown'].forEach(ev => btn.addEventListener(ev, (e) => {
    e.preventDefault();
    pacman.next = dir;
  }));
}
handle('up', DIRS.ArrowUp);
handle('down', DIRS.ArrowDown);
handle('left', DIRS.ArrowLeft);
handle('right', DIRS.ArrowRight);

draw();
requestAnimationFrame(update);
