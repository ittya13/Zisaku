const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const ROWS = 20;
const COLUMNS = 10;
const BLOCK_SIZE = 30;
const EMPTY_BLOCK_COLOR = '#f0f0f0';

const board = Array.from({ length: ROWS }, () => Array(COLUMNS).fill(EMPTY_BLOCK_COLOR));

let currentTetromino = getRandomTetromino();
let currentRow = 0;
let currentCol = Math.floor((COLUMNS - currentTetromino[0].length) / 2);

function getRandomTetromino() {
  const tetrominos = [
    [[1, 1, 1, 1]], // I
    [[1, 1, 1], [1]], // T
    [[1, 1, 1], [0, 1]], // L
    [[1, 1, 1], [1, 0]], // J
    [[1, 1], [1, 1]], // O
    [[1, 1, 0], [0, 1, 1]], // S
    [[0, 1, 1], [1, 1, 0]] // Z
  ];
  const randomIndex = Math.floor(Math.random() * tetrominos.length);
  return tetrominos[randomIndex];
}

function drawTetromino(tetromino, row, col, color) {
  for (let i = 0; i < tetromino.length; i++) {
    for (let j = 0; j < tetromino[i].length; j++) {
      if (tetromino[i][j]) {
        drawBlock(col + j, row + i, color);
      }
    }
  }
}

function canMoveTetromino(tetromino, row, col) {
  for (let i = 0; i < tetromino.length; i++) {
    for (let j = 0; j < tetromino[i].length; j++) {
      if (tetromino[i][j]) {
        const newRow = row + i;
        const newCol = col + j;
        if (newRow < 0 || newRow >= ROWS || newCol < 0 || newCol >= COLUMNS || board[newRow][newCol] !== EMPTY_BLOCK_COLOR) {
          return false;
        }
      }
    }
  }
  return true;
}

function mergeTetromino() {
  for (let i = 0; i < currentTetromino.length; i++) {
    for (let j = 0; j < currentTetromino[i].length; j++) {
      if (currentTetromino[i][j]) {
        board[currentRow + i][currentCol + j] = 'blue';
      }
    }
  }
}

let linesClearedCount = 0;  // 追加: ラインを消去した回数

function clearLines() {
  let linesCleared = 0;
  for (let i = ROWS - 1; i >= 0; i--) {
    if (board[i].every(cell => cell !== EMPTY_BLOCK_COLOR)) {
      board.splice(i, 1);
      board.unshift(Array(COLUMNS).fill(EMPTY_BLOCK_COLOR));
      linesCleared++;
      i++;
    }
  }

  if (linesCleared > 0) {
    linesClearedCount += linesCleared;  // ラインを消去した回数を更新
    const countElement = document.getElementById('count');
    countElement.innerText = `Lines cleared: ${linesClearedCount}`;
  }

  return linesCleared;
}

    
  
    
  function clearFullLines() {
    const fullLines = [];
    for (let i = 0; i < ROWS; i++) {
      if (board[i].every(cell => cell !== EMPTY_BLOCK_COLOR)) {
        fullLines.push(i);
      }
    }
    for (const index of fullLines) {
      board.splice(index, 1);
      board.unshift(Array(COLUMNS).fill(EMPTY_BLOCK_COLOR));
    }
    return fullLines.length;
  }
  function mergeTetromino() {
    for (let i = 0; i < currentTetromino.length; i++) {
      for (let j = 0; j < currentTetromino[i].length; j++) {
        if (currentTetromino[i][j]) {
          board[currentRow + i][currentCol + j] = 'blue';
        }
      }
    }
  }
  function dropTetromino() {
    while (canMoveTetromino(currentTetromino, currentRow + 1, currentCol)) {
      currentRow++;
    }
    mergeTetromino();
    const linesCleared = clearFullLines();  // Change to clearFullLines
    if (linesCleared > 0) {
      // Handle points or any other game logic related to clearing lines
    }
    currentTetromino = getRandomTetromino();
    currentRow = 0;
    currentCol = Math.floor((COLUMNS - currentTetromino[0].length) / 2);
    if (!canMoveTetromino(currentTetromino, currentRow, currentCol)) {
      // Game over
      alert('Game over!');
      // You can reset the game here if needed
    }
  }

function drawBlock(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
  ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
}

function drawBoard() {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLUMNS; col++) {
      drawBlock(col, row, board[row][col]);
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBoard();
}

function handleKeyPress(event) {
  if (event.code === 'ArrowLeft' && canMoveTetromino(currentTetromino, currentRow, currentCol - 1)) {
    currentCol--;
  } else if (event.code === 'ArrowRight' && canMoveTetromino(currentTetromino, currentRow, currentCol + 1)) {
    currentCol++;
  } else if (event.code === 'ArrowDown' && canMoveTetromino(currentTetromino, currentRow + 1, currentCol)) {
    currentRow++;
  } else if (event.code === 'ArrowUp') {
    const rotatedTetromino = rotateTetromino(currentTetromino);
    if (canMoveTetromino(rotatedTetromino, currentRow, currentCol)) {
      currentTetromino = rotatedTetromino;
    }
  }
}

function rotateTetromino() {
    const rotatedTetromino = rotateTetrominoClockwise(currentTetromino);
    if (canMoveTetromino(rotatedTetromino, currentRow, currentCol)) {
      currentTetromino = rotatedTetromino;
      draw();
    }
  }
  
  function rotateTetrominoClockwise(tetromino) {
    const rows = tetromino.length;
    const cols = tetromino[0].length;
    const rotatedTetromino = Array.from({ length: cols }, () => Array(rows).fill(0));
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        rotatedTetromino[j][rows - 1 - i] = tetromino[i][j];
      }
    }
    return rotatedTetromino;
  }
  
  
  

document.addEventListener('keydown', handleKeyPress);

function moveTetromino(direction) {
  let newCol = currentCol;
  if (direction === 'left' && canMoveTetromino(currentTetromino, currentRow, currentCol - 1)) {
    newCol--;
  } else if (direction === 'right' && canMoveTetromino(currentTetromino, currentRow, currentCol + 1)) {
    newCol++;
  } else if (direction === 'down' && canMoveTetromino(currentTetromino, currentRow + 1, currentCol)) {
    currentRow++;
    draw();
    return;
  }

  if (canMoveTetromino(currentTetromino, currentRow, newCol)) {
    currentCol = newCol;
    draw();
  }
}

function startGame() {
    setInterval(() => {
      if (canMoveTetromino(currentTetromino, currentRow + 1, currentCol)) {
        currentRow++;
      } else {
        mergeTetromino();
        const linesCleared = clearLines(); // Get the lines cleared count
        if (linesCleared > 0) {
          // Update points or any other game logic related to clearing lines
          // For now, we'll just log the lines cleared count
          console.log(`Lines cleared: ${linesCleared}`);
        }
        currentTetromino = getRandomTetromino();
        currentRow = 0;
        currentCol = Math.floor((COLUMNS - currentTetromino[0].length) / 2);
        if (!canMoveTetromino(currentTetromino, currentRow, currentCol)) {
          // Game over
          alert('Game over!');
          // You can reset the game here if needed
        }
      }
      draw();
      drawTetromino(currentTetromino, currentRow, currentCol, 'blue'); // Draw the falling tetromino
    }, 800); // Update every 800ms (0.8 seconds) for block movement
  }
  
  
  startGame();
  
