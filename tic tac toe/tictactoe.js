class TicTacToe {
    constructor() {
        this.board = Array(9).fill(null);
        this.isXNext = true;
        this.gameOver = false;
    }

    makeMove(index) {
        if (this.board[index] || this.gameOver) return false;
        this.board[index] = this.isXNext ? 'X' : 'O';
        this.isXNext = !this.isXNext;
        return true;
    }

    getWinner() {
        const lines = [
            [0, 1, 2],
            [3, 4, 5],
            [6, 7, 8],
            [0, 3, 6],
            [1, 4, 7],
            [2, 5, 8],
            [0, 4, 8],
            [2, 4, 6],
        ];
        
        for (let line of lines) {
            const [a, b, c] = line;
            if (this.board[a] && this.board[a] === this.board[b] && this.board[a] === this.board[c]) {
                return this.board[a];
            }
        }
        return null;
    }

    isBoardFull() {
        return this.board.every(cell => cell !== null);
    }

    reset() {
        this.board = Array(9).fill(null);
        this.isXNext = true;
        this.gameOver = false;
    }

    getStatus() {
        const winner = this.getWinner();
        if (winner) {
            this.gameOver = true;
            return `Player ${winner} wins!`;
        }
        if (this.isBoardFull()) {
            this.gameOver = true;
            return "It's a draw!";
        }
        return `Current player: ${this.isXNext ? 'X' : 'O'}`;
    }
}

// Game instance
const game = new TicTacToe();

const cells = document.querySelectorAll('.cell');
const statusEl = document.getElementById('status');
const resetBtn = document.getElementById('reset-btn');

function updateUI() {
    game.board.forEach((value, idx) => {
        const cell = cells[idx];
        cell.textContent = value || '';
        cell.classList.toggle('x', value === 'X');
        cell.classList.toggle('o', value === 'O');
    });
    statusEl.textContent = game.getStatus();
}

cells.forEach(cell => {
    cell.addEventListener('click', () => {
        const idx = Number(cell.dataset.index);
        if (!game.makeMove(idx)) return;
        updateUI();
    });
});

resetBtn.addEventListener('click', () => {
    game.reset();
    updateUI();
});

updateUI();