const params = new URLSearchParams(document.location.search);
const FENUrlParam = params.get('FEN');
const FENInput = document.getElementById('fen-input');
const FENCopyButton = document.getElementById('fen-copy');
const piecesDiv = document.getElementById('pieces');

function getFEN() {
  return FENInput.value || FENInput.placeholder;
}

function parseFEN(str) {
  console.log(`parsing FEN: ${str}`)
  const fields = str.split(' ');

  const pieces = fields[0].split('/').map(r => {
    const row = [];
    for (const symbol of r.split('')) {
      if (symbol >= '0' && symbol <= '9') {
        for (i = 0; i < symbol - '0'; ++i) {
          row.push(null);
        }
      } else {
        row.push(symbol);
      }
    }
    return row;
  });
  const active_color = fields[1].toLowerCase();
  const castling = fields[2].split('');
  const en_passant = fields[3];
  const halfmove = fields[4];
  const fullmove = fields[5];

  return {
    pieces: pieces,
    active_color: active_color,
    castling: {
      white_queenside: castling.includes('K'),
      white_kingside: castling.includes('Q'),
      black_queenside: castling.includes('k'),
      black_kingside: castling.includes('q')
    },
    halfmove: halfmove,
    fullmove: fullmove
  }
}

/* 'k' -> 'black king', 'Q' -> 'white queen', ... */
function getPieceClass(letter) {
  const color = (letter.toUpperCase() === letter) ? "white " : "black ";
  switch (letter.toLowerCase()) {
    case 'k': return color + "king";
    case 'q': return color + "queen";
    case 'r': return color + "rook";
    case 'b': return color + "bishop";
    case 'n': return color + "knight";
    case 'p': return color + "pawn";
  }
}

function createPiece(piece, row, column) {
  if (piece === null) {
    return '';
  }
  return `<div class="${getPieceClass(piece)}" style="grid-column: ${column}; grid-row: ${row}"></div>`;
}

function resetToFEN(FEN) {
  FENInput.value = FEN;
  renderBoard();
}

function renderBoard() {
  const board = parseFEN(getFEN());
  let innerHTML = '';

  for (let i = 0; i < 8; ++i) {
    for (let j = 0; j < 8; ++j) {
      innerHTML += createPiece(board.pieces[i][j], i + 1, j + 1);
    }
  }
  piecesDiv.innerHTML = innerHTML;
}

if (FENUrlParam) {
  resetToFEN(FENUrlParam);
}


FENCopyButton.onclick = () => {
  navigator.clipboard.writeText(getFEN());
}

FENInput.addEventListener('input', renderBoard);

document.getElementById('btn-starting-position').onclick = () => {
  resetToFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
}

document.getElementById('btn-clear-board').onclick = () => {
  resetToFEN('8/8/8/8/8/8/8/8 w - - 0 1');
}

document.getElementById('btn-best-white-opening').onclick = () => {
  resetToFEN('rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR w KQkq - 0 1');
}
document.getElementById('btn-worst-white-opening').onclick = () => {
  resetToFEN('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1');
}

renderBoard();
