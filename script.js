const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

let COLS = 10;
let ROWS = 20;
let BLOCK = 30;

function resize() {
  BLOCK = Math.floor(Math.min(window.innerWidth / COLS, (window.innerHeight-150) / ROWS));
  canvas.width = COLS * BLOCK;
  canvas.height = ROWS * BLOCK;
}
window.addEventListener('resize', resize);
resize();

const COLORS = [null, 'cyan', 'blue', 'orange', 'yellow', 'green', 'purple', 'red'];

const SHAPES = [
  [
    [0,0,0,0],
    [1,1,1,1],
    [0,0,0,0],
    [0,0,0,0]
  ],
  [
    [2,0,0],
    [2,2,2],
    [0,0,0]
  ],
  [
    [0,0,3],
    [3,3,3],
    [0,0,0]
  ],
  [
    [4,4],
    [4,4]
  ],
  [
    [0,5,5],
    [5,5,0],
    [0,0,0]
  ],
  [
    [0,6,0],
    [6,6,6],
    [0,0,0]
  ],
  [
    [7,7,0],
    [0,7,7],
    [0,0,0]
  ]
];

function rotate(matrix) {
  const N = matrix.length;
  const result = [];
  for (let y=0;y<N;y++) {
    result[y] = [];
    for (let x=0;x<N;x++) {
      result[y][x] = matrix[N-1-x][y] || 0;
    }
  }
  return result;
}

let board = [];
for (let r=0;r<ROWS;r++) {
  board[r] = Array(COLS).fill(0);
}

let current = null;
let pieceCount = 0;
let lines = 0;
let dropCounter = 0;
let dropInterval = 500;
let lastTime = 0;
let playing = true;

function spawn() {
  if (pieceCount >= 100) {
    playing = false;
    document.getElementById('message').textContent = 'Fine del gioco';
    return;
  }
  const id = Math.floor(Math.random()*SHAPES.length);
  const shape = SHAPES[id];
  current = {
    x: Math.floor((COLS - shape[0].length)/2),
    y: 0,
    shape: shape,
    id: id+1
  };
  pieceCount++;
  if (collide(board, current)) {
    playing = false;
    document.getElementById('message').textContent = 'Game Over';
  }
}

function collide(board, piece) {
  const {shape, x:ox, y:oy} = piece;
  for (let y=0;y<shape.length;y++) {
    for (let x=0;x<shape[y].length;x++) {
      if (shape[y][x]) {
        const px = ox + x;
        const py = oy + y;
        if (px < 0 || px >= COLS || py >= ROWS) return true;
        if (py >=0 && board[py][px]) return true;
      }
    }
  }
  return false;
}

function merge(board, piece) {
  piece.shape.forEach((row,y)=>{
    row.forEach((value,x)=>{
      if (value && piece.y + y >= 0) {
        board[piece.y+y][piece.x+x] = piece.id;
      }
    });
  });
}

function clearLines() {
  outer: for (let y=ROWS-1;y>=0;y--) {
    for (let x=0;x<COLS;x++) {
      if (!board[y][x]) continue outer;
    }
    const row = board.splice(y,1)[0].fill(0);
    board.unshift(row);
    lines++;
    document.getElementById('score').textContent = `Lines: ${lines}`;
    y++;
  }
}

function drawMatrix(matrix, offset, id) {
  matrix.forEach((row,y)=>{
    row.forEach((value,x)=>{
      if (value) {
        ctx.fillStyle = COLORS[id];
        ctx.fillRect((x+offset.x)*BLOCK, (y+offset.y)*BLOCK, BLOCK-1, BLOCK-1);
      }
    });
  });
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0,0,canvas.width, canvas.height);
  board.forEach((row,y)=>{
    row.forEach((value,x)=>{
      if (value) {
        ctx.fillStyle = COLORS[value];
        ctx.fillRect(x*BLOCK, y*BLOCK, BLOCK-1, BLOCK-1);
      }
    });
  });
  if (current) drawMatrix(current.shape, {x:current.x, y:current.y}, current.id);
}

function update(time=0) {
  if (!playing) return;
  const delta = time - lastTime;
  lastTime = time;
  dropCounter += delta;
  if (dropCounter > dropInterval) {
    moveDown();
  }
  draw();
  requestAnimationFrame(update);
}

function moveDown() {
  current.y++;
  if (collide(board,current)) {
    current.y--;
    merge(board,current);
    clearLines();
    spawn();
  }
  dropCounter = 0;
}

function move(dir) {
  current.x += dir;
  if (collide(board,current)) {
    current.x -= dir;
  }
}

function rotatePiece() {
  const original = current.shape;
  current.shape = rotate(current.shape);
  if (collide(board,current)) {
    current.shape = original;
  }
}

spawn();
update();

// keyboard controls
window.addEventListener('keydown', e=>{
  if (!playing) return;
  switch(e.key) {
    case 'ArrowLeft': move(-1); break;
    case 'ArrowRight': move(1); break;
    case 'ArrowDown': moveDown(); break;
    case 'ArrowUp': rotatePiece(); break;
  }
});

function handleButton(id,action) {
  const btn = document.getElementById(id);
  ['mousedown','touchstart'].forEach(ev=>{
    btn.addEventListener(ev,e=>{ e.preventDefault(); action(); });
  });
}

handleButton('left', ()=>move(-1));
handleButton('right', ()=>move(1));
handleButton('down', ()=>moveDown());
handleButton('rotate', ()=>rotatePiece());
