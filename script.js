class Minesweeper {
    constructor(rows = 16, cols = 16, mines = 40) {
        this.rows = rows;
        this.cols = cols;
        this.mines = mines;
        this.board = [];
        this.gameOver = false;
        this.revealed = 0;
        this.firstClick = true;
        this.timer = 0;
        this.timerInterval = null;
        this.mineCount = mines;
        
        this.init();
        this.setupEventListeners();
    }

    init() {
        this.board = Array(this.rows).fill().map(() => 
            Array(this.cols).fill().map(() => ({
                isMine: false,
                revealed: false,
                flagged: false,
                neighborMines: 0
            }))
        );
        
        this.updateMineCount();
        this.updateTimer();
        this.updateSmiley('😊');
        
        const boardElement = document.getElementById('board');
        boardElement.innerHTML = '';
        
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell hidden';
                cell.dataset.row = i;
                cell.dataset.col = j;
                boardElement.appendChild(cell);
            }
        }
    }

    setupEventListeners() {
        const board = document.getElementById('board');
        board.addEventListener('click', (e) => this.handleClick(e));
        board.addEventListener('contextmenu', (e) => this.handleRightClick(e));
        
        document.getElementById('new-game').addEventListener('click', () => {
            this.stopTimer();
            this.init();
            this.gameOver = false;
            this.firstClick = true;
            this.revealed = 0;
        });
    }

    placeMines(firstRow, firstCol) {
        let minesPlaced = 0;
        while (minesPlaced < this.mines) {
            const row = Math.floor(Math.random() * this.rows);
            const col = Math.floor(Math.random() * this.cols);
            
            if (!this.board[row][col].isMine && 
                (Math.abs(row - firstRow) > 1 || Math.abs(col - firstCol) > 1)) {
                this.board[row][col].isMine = true;
                minesPlaced++;
            }
        }
        
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                if (!this.board[i][j].isMine) {
                    this.board[i][j].neighborMines = this.countNeighborMines(i, j);
                }
            }
        }
    }

    countNeighborMines(row, col) {
        let count = 0;
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const newRow = row + i;
                const newCol = col + j;
                if (newRow >= 0 && newRow < this.rows && 
                    newCol >= 0 && newCol < this.cols && 
                    this.board[newRow][newCol].isMine) {
                    count++;
                }
            }
        }
        return count;
    }

    handleClick(e) {
        if (this.gameOver) return;
        
        const cell = e.target;
        if (!cell.classList.contains('cell')) return;
        
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        
        if (this.firstClick) {
            this.firstClick = false;
            this.placeMines(row, col);
            this.startTimer();
        }
        
        if (this.board[row][col].flagged) return;
        
        this.revealCell(row, col);
    }

    handleRightClick(e) {
        e.preventDefault();
        if (this.gameOver) return;
        
        const cell = e.target;
        if (!cell.classList.contains('cell')) return;
        
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        
        if (this.board[row][col].revealed) return;
        
        this.toggleFlag(row, col);
    }

    revealCell(row, col) {
        const cell = this.board[row][col];
        if (cell.revealed || cell.flagged) return;
        
        cell.revealed = true;
        this.revealed++;
        
        const element = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        element.classList.remove('hidden');
        element.classList.add('revealed');
        
        if (cell.isMine) {
            this.gameOver = true;
            element.innerHTML = '💣';
            this.revealAllMines();
            this.updateSmiley('😵');
            this.stopTimer();
            return;
        }
        
        if (cell.neighborMines > 0) {
            element.innerHTML = cell.neighborMines;
            element.classList.add(`number-${cell.neighborMines}`);
            this.checkForLoop(row, col);
        } else {
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    const newRow = row + i;
                    const newCol = col + j;
                    if (newRow >= 0 && newRow < this.rows && 
                        newCol >= 0 && newCol < this.cols) {
                        this.revealCell(newRow, newCol);
                    }
                }
            }
        }
        
        this.checkWin();
    }

    checkForLoop(row, col) {
        const visited = Array(this.rows).fill().map(() => Array(this.cols).fill(false));
        const loop = this.findLoop(row, col, visited);
        
        if (loop && loop.length > 0) {
            loop.forEach(([r, c]) => {
                const element = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
                if (element) {
                    element.classList.add('loop');
                }
            });
        }
    }

    findLoop(startRow, startCol, visited) {
        const stack = [[startRow, startCol]];
        const path = [];
        
        while (stack.length > 0) {
            const [row, col] = stack.pop();
            
            if (visited[row][col]) {
                if (path.length >= 4) {
                    return path;
                }
                continue;
            }
            
            visited[row][col] = true;
            path.push([row, col]);
            
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    if (i === 0 && j === 0) continue;
                    
                    const newRow = row + i;
                    const newCol = col + j;
                    
                    if (newRow >= 0 && newRow < this.rows && 
                        newCol >= 0 && newCol < this.cols &&
                        this.board[newRow][newCol].revealed &&
                        this.board[newRow][newCol].neighborMines > 0) {
                        stack.push([newRow, newCol]);
                    }
                }
            }
        }
        
        return null;
    }

    toggleFlag(row, col) {
        const cell = this.board[row][col];
        const element = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        
        if (!cell.flagged) {
            if (this.mineCount > 0) {
                cell.flagged = true;
                element.innerHTML = '🚩';
                this.mineCount--;
            }
        } else {
            cell.flagged = false;
            element.innerHTML = '';
            this.mineCount++;
        }
        
        this.updateMineCount();
    }

    revealAllMines() {
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                if (this.board[i][j].isMine) {
                    const element = document.querySelector(`[data-row="${i}"][data-col="${j}"]`);
                    element.classList.remove('hidden');
                    element.classList.add('revealed');
                    element.innerHTML = '💣';
                }
            }
        }
    }

    checkWin() {
        if (this.revealed === this.rows * this.cols - this.mines) {
            this.gameOver = true;
            this.updateSmiley('😎');
            this.stopTimer();
        }
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timer++;
            this.updateTimer();
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateTimer() {
        document.getElementById('timer').textContent = this.timer.toString().padStart(3, '0');
    }

    updateMineCount() {
        document.getElementById('mine-count').textContent = this.mineCount.toString().padStart(3, '0');
    }

    updateSmiley(emoji) {
        document.getElementById('new-game').innerHTML = emoji;
    }
}

window.addEventListener('load', () => {
    new Minesweeper();
});
