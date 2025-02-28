const params = new URLSearchParams(document.location.search);
const FENUrlParam = params.get('FEN');
const FENInput = document.getElementById('fen-input');
const FENCopyButton = document.getElementById('fen-copy');
const mainBoard = document.getElementById('main-board');

const initialPositionFEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const emptyBoardFEN = '8/8/8/8/8/8/8/8 w - - 0 1';

/* enable/disable free move feature */
const freeMoveEnabled = false;

const userData = {
  board: null,
  selectedCell: null
};

function getFEN() {
  return FENInput.value || FENInput.placeholder;
}

function parseFEN(str) {
  // console.log(`parsing FEN: ${str}`)
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
  const activeColor = fields[1].toLowerCase();
  const castling = fields[2].split('');
  const enPassant = fields[3] != '-' ? fields[3] : null;
  const halfmoves = fields[4];
  const fullmoves = fields[5];

  return {
    pieces: pieces,
    activeColor: activeColor,
    castling: {
      whiteKingSide: castling.includes('K'),
      whiteQueenSide: castling.includes('Q'),
      blackKingSide: castling.includes('k'),
      blackQueenSide: castling.includes('q')
    },
    enPassant: enPassant,
    halfmoves: halfmoves,
    fullmoves: fullmoves
  }
}

function boardToFEN(board) {
  const pieces = board.pieces.map(row => {
    let str = '';
    let i = 0;
    for (cell of row) {
      if (!cell) {
        i++;
      } else if (i > 0) {
        str += i + cell;
        i = 0;
      } else {
        str += cell;
      }
    }
    if (i > 0)
      str += i;
    return str;
  }).join('/');

  let castling = '';
  castling += board.castling.whiteKingSide ? 'K' : '';
  castling += board.castling.whiteQueenSide ? 'Q' : '';
  castling += board.castling.blackKingSide ? 'k' : '';
  castling += board.castling.blackQueenSide ? 'q' : '';

  const enPassant = board.enPassant || '-';

  return [ pieces, board.activeColor, castling, enPassant, board.halfmoves, board.fullmoves ].join(' ');
}

function getPieceColor(letter) {
  return (letter.toUpperCase() === letter) ? "w" : "b";
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

/* row, column: 1, ..., 8 */
function coordsToString(row, column) {
  return 'abcdefgh'[column - 1] + (9 - row);
}

function stringToCoords(str) {
  if (str.length == 2) {
    const column = 'abcdefgh'.split('').indexOf(str[0]) + 1;
    const row = '87654321'.split('').indexOf(str[1]) + 1;
    if (row > 0 && column > 0) {
      return [ row, column ];
    }
  }
  return undefined;
}

function *getCoordsOfAllPieces(board) {
  for (let i = 0; i < 8; ++i)
    for (let j = 0; j < 8; ++j)
      if (board.pieces[i][j])
        yield [i + 1, j + 1, board.pieces[i][j]];
}

function getAllPossibleMoves(board) {
  return getCoordsOfAllPieces(board).filter(([row, column, piece]) => {
    return getPieceColor(piece) === board.activeColor;
  }).reduce((moveList, [row, column, piece]) => {
    return moveList.concat(getPossibleMovesCoords(board, [row, column]).map(([dstRow, dstColumn]) => {
      return {
        srcRow: row,
        srcColumn: column,
        srcPiece: piece,
        dstRow: dstRow,
        dstColumn: dstColumn
      }
    }));
  }, []);
  return [].concat(...allMoves);
}

function resolveMove(board, moveNotation) {
  const move = moveNotation.replace('x', '').replace('+', '');

  let moves = getAllPossibleMoves(board);
  let srcPiece = undefined;
  let srcRow = undefined;
  let srcColumn = undefined;
  let dstRow = undefined;
  let dstColumn = undefined;

  let match = null;

  if ((match = move.match(/^([a-h])([1-8])$/))) {
    /* e.g. d4 */
    srcPiece = 'P';
    dstColumn = match[1];
    dstRow = match[2];
  } else if ((match = move.match(/^([a-h])([1-8]?)([a-h])([1-8]?)$/))) {
    /* e.g. d2d4 */
    srcPiece = 'P';
    srcColumn = match[1];
    srcRow = match[2];
    dstColumn = match[3];
    dstRow = match[4];
  } else if ((match = move.match(/^([RNBKQ])([1-8a-h])?([a-h])([1-8])$/))) {
    /* Nf6, Ngf6, N1f6 */
    srcPiece = match[1];
    const specifier = match[2];
    if (specifier) {
      if ('12345678'.includes(specifier)) {
        srcRow = specifier;
      } else {
        srcColumn = specifier;
      }
    }
    dstColumn = match[3];
    dstRow = match[4];
  } else if (move.match('^[0O]-[0O]$')) {
    moves = moves.filter(mv => {
      return mv.srcPiece.toUpperCase() == 'K' && mv.dstColumn - mv.srcColumn > 1;
    });
  } else if (move.match('^[0O]-[0O]-[0O]$')) {
    moves = moves.filter(mv => {
      return mv.srcPiece.toUpperCase() == 'K' && mv.srcColumn - mv.dstColumn > 1;
    });
  } else {
    throw new Error(`invalid move ${move}`)
  }

  if (srcPiece) {
    moves = moves.filter(mv => (mv.srcPiece.toUpperCase() === srcPiece));
  }
  if (srcColumn) {
    const srcColumnIdx = 'abcdefgh'.indexOf(srcColumn) + 1;
    moves = moves.filter(mv => (mv.srcColumn === srcColumnIdx));
  }
  if (srcRow) {
    const srcRowIdx = '87654321'.indexOf(srcRow) + 1;
    moves = moves.filter(mv => (mv.srcRow === srcRowIdx));
  }
  if (dstColumn) {
    const dstColumnIdx = 'abcdefgh'.indexOf(dstColumn) + 1;
    moves = moves.filter(mv => (mv.dstColumn === dstColumnIdx));
  }
  if (dstRow) {
    const dstRowIdx = '87654321'.indexOf(dstRow) + 1;
    moves = moves.filter(mv => (mv.dstRow === dstRowIdx));
  }

  if (moves.length === 1) {
    console.log(move, "OK!");
  } else {
    console.log('illegal/ambiguous move', move);
    console.log('FEN', boardToFEN(board));
    console.log("filter", srcPiece, srcColumn, srcRow, dstColumn, dstRow);
  }
  if (moves.length === 0) {
    throw new Error(`move ${move} is not legal in current position`);
  } else if(moves.length > 1) {
    throw new Error(`move ${move} is ambiguous`);
  }
  const src = [moves[0].srcRow, moves[0].srcColumn];
  const dst = [moves[0].dstRow, moves[0].dstColumn];
  return [src, dst];
}

function movesToFEN(moves) {
  const board = parseFEN(initialPositionFEN);
  for (mv of moves) {
    const [from, to] = resolveMove(board, mv);
    movePiece(board, from, to);
  }
  return boardToFEN(board);
}

function getPossibleMovesCoords(board, pieceCoords) {
  const [row, column] = pieceCoords;
  const pieces = board.pieces;
  const getPiece = (r, c) => pieces[r - 1][c - 1];
  const piece = getPiece(row, column);

  if (!piece) {
    throw new Error(`no piece at ${piece_coords} for board ${board}`)
  }

  const pieceColor = getPieceColor(piece);
  const isEnemy = (r, c) => {
    const piece = getPiece(r, c);
    return piece ? (getPieceColor(piece) !== pieceColor) : false;
  };
  const isEmptyOrEnemy = (r, c) => {
    const piece = getPiece(r, c);
    return piece ? (getPieceColor(piece) !== pieceColor) : true;
  }
  const isValidTarget = ([r, c]) => (r > 0 && r <= 8 && r > 0 && c <= 8 && isEmptyOrEnemy(r, c));

  const isEmptyRow = (row, col_from, col_to) => {
    for (let c = col_from; c < col_to; ++c)
      if (getPiece(row, c))
        return false;
    return true;
  };

  let moves = [];
  if (piece === 'P') {
    if (!getPiece(row - 1, column)) {
      moves.push([row - 1, column]);
      if (row == 7 && !getPiece(row - 2, column)) {
        moves.push([row - 2, column]);
      }
    }
    if (isEnemy(row - 1, column - 1) || (coordsToString(row - 1, column - 1) === board.enPassant))
      moves.push([row - 1, column - 1]);
    if (isEnemy(row - 1, column + 1) || (coordsToString(row - 1, column + 1) === board.enPassant))
      moves.push([row - 1, column + 1]);
  } else if (piece === 'p') {
    if (!getPiece(row + 1, column)) {
      moves.push([row + 1, column]);
      if (row == 2 && !getPiece(row + 2, column)) {
        moves.push([row + 2, column]);
      }
    }
    if (isEnemy(row + 1, column - 1) || (coordsToString(row + 1, column - 1) === board.enPassant))
      moves.push([row + 1, column - 1]);
    if (isEnemy(row + 1, column + 1) || (coordsToString(row + 1, column + 1) === board.enPassant))
      moves.push([row + 1, column + 1]);
  } else if (piece === 'R' || piece === 'r' || piece === 'Q' || piece === 'q') {
    for (let r = row - 1; r > 0; --r) {
      if (isEmptyOrEnemy(r, column))
        moves.push([r, column]);
      if (getPiece(r, column))
        break;
    }
    for (let r = row + 1; r <= 8; ++r) {
      if (isEmptyOrEnemy(r, column))
        moves.push([r, column]);
      if (getPiece(r, column))
        break;
    }
    for (let c = column - 1; c > 0; --c) {
      if (isEmptyOrEnemy(row, c))
        moves.push([row, c]);
      if (getPiece(row, c))
        break;
    }
    for (let c = column + 1; c <= 8; ++c) {
      if (isEmptyOrEnemy(row, c))
        moves.push([row, c]);
      if (getPiece(row, c))
        break;
    }
  } else if (piece === 'K' || piece === 'k') {
    const candidates = [
      [row - 1, column - 1], [row - 1, column], [row - 1, column + 1],
      [row, column - 1], [row, column + 1],
      [row + 1, column - 1], [row + 1, column], [row + 1, column + 1]
    ];
    moves = candidates.filter(isValidTarget);
    if (piece === 'K' && board.castling.whiteKingSide && isEmptyRow(row, column + 1, 8))
      moves.push([row, column + 2]);
    if (piece === 'K' && board.castling.whiteQueenSide && isEmptyRow(row, 2, column))
      moves.push([row, column - 2]);
    if (piece === 'k' && board.castling.blackKingSide && isEmptyRow(row, column + 1, 8))
      moves.push([row, column + 2]);
    if (piece === 'k' && board.castling.blackQueenSide && isEmptyRow(row, 2, column))
      moves.push([row, column - 2]);
  } else if (piece === 'N' || piece === 'n') {
    const candidates = [
      [row + 2, column + 1],
      [row - 2, column + 1],
      [row + 1, column + 2],
      [row - 1, column + 2],
      [row + 2, column - 1],
      [row - 2, column - 1],
      [row + 1, column - 2],
      [row - 1, column - 2]
    ];
    moves = candidates.filter(isValidTarget);
  };
  if (piece === 'B' || piece === 'b' || piece === 'Q' || piece === 'q') {
    for (let i = 1; row + i <= 8 && column + i <= 8; ++i) {
      if (isEmptyOrEnemy(row + i, column + i))
        moves.push([row + i, column + i]);
      if (getPiece(row + i, column + i))
        break;
    }
    for (let i = 1; row + i <= 8 && column - i > 0; ++i) {
      if (isEmptyOrEnemy(row + i, column - i))
        moves.push([row + i, column - i]);
      if (getPiece(row + i, column - i))
        break;
    }
    for (let i = 1; row - i > 0 && column + i <= 8; ++i) {
      if (isEmptyOrEnemy(row - i, column + i))
        moves.push([row - i, column + i]);
      if (getPiece(row - i, column + i))
        break;
    }
    for (let i = 1; row - i > 0 && column - i > 0; ++i) {
      if (isEmptyOrEnemy(row - i, column - i))
        moves.push([row - i, column - i]);
      if (getPiece(row - i, column - i))
        break;
    }
  }
  return moves;
}

function getPossibleMoves(board, piece_pos) {
  return getPossibleMovesCoords(board, stringToCoords(piece_pos)).map(coords => coordsToString(coords[0], coords[1]));
}

function deselectSelectedCell() {
  $(mainBoard).children('.possible-move').remove();
  $(mainBoard).children('.selected').removeClass('selected');
  userData.selectedCell = null;
}

function movePiece(board, from, to) {
  const [from_row, from_column] = from;
  const [to_row, to_column] = to;

  const targetPiece = board.pieces[to_row - 1][to_column - 1];
  const movedPiece = board.pieces[to_row - 1][to_column - 1] = board.pieces[from_row - 1][from_column - 1];
  board.pieces[from_row - 1][from_column - 1] = null;

  const isPawnMove = (movedPiece === 'P') || (movedPiece === 'p');
  const isEnPassant = isPawnMove && (to_column !== from_column) && !targetPiece;
  const isCapture = targetPiece || isEnPassant;

  const isCastling = ('Kk'.includes(movedPiece) && Math.abs(to_column - from_column) >= 2);

  if (isEnPassant) {
    board.pieces[from_row - 1][to_column - 1] = null;
  } else if (isCastling) {
    if (to_column > from_column) {
      /* Assume regular position of rooks */
      board.pieces[to_row - 1][to_column - 1 - 1] = board.pieces[to_row - 1][7];
      board.pieces[to_row - 1][7] = null;
    } else {
      board.pieces[to_row - 1][to_column - 1 + 1] = board.pieces[to_row - 1][0];
      board.pieces[to_row - 1][0] = null;
    }
  }
  if (isPawnMove || isCapture) {
    board.halfmoves++;
  }
  if (isPawnMove && Math.abs(from_row - to_row) === 2) {
    board.enPassant = coordsToString((from_row + to_row) / 2, from_column);
  } else {
    board.enPassant = null;
  }
  if (board.activeColor === 'b') {
    board.fullmoves++;
    board.activeColor = 'w';
  } else {
    board.activeColor = 'b';
  }
}

function handleClick(row, column) {
  const pos = coordsToString(row, column)

  if (userData.selectedCell && getPossibleMoves(userData.board, userData.selectedCell).includes(pos)) {
    /* Move piece and update UI */
    movePiece(userData.board, stringToCoords(userData.selectedCell), [row, column]);
    $(FENInput).val(boardToFEN(userData.board));
    userData.selectedCell = null;
    renderBoard();
  } else {
    deselectSelectedCell();
    const selectedPiece = userData.board.pieces[row - 1][column - 1];
    if (freeMoveEnabled || (selectedPiece && userData.board.activeColor === getPieceColor(selectedPiece))) {
      /* Highlight selected square */
      $(mainBoard).children(`.cell[value="${pos}"]`).addClass('selected');
      userData.selectedCell = pos;

      /* Show possible moves */
      for ([r, c] of getPossibleMovesCoords(userData.board, stringToCoords(pos))) {
        $(mainBoard).append(`<div class="possible-move" style="grid-column: ${c}; grid-row: ${r}"> </div>`);
      }
    }
  }
}

function createCell(row, column) {
  const color = ((row + column) % 2 == 0) ? "white" : "black";
  const pos = coordsToString(row, column);
  return `<div class="${color} cell" value="${pos}" style="grid-column: ${column}; grid-row: ${row}" onclick="handleClick(${row}, ${column})"></div>`;
}

function createPiece(piece, row, column) {
  if (piece === null) {
    return '';
  }
  const pos = coordsToString(row, column);
  return `<div class="${getPieceClass(piece)}" value="${pos}" style="grid-column: ${column}; grid-row: ${row}" onclick="handleClick(${row}, ${column})"></div>`;
}

function renderBoard() {
  const board = userData.board;
  let innerHTML = '';

  for (let i = 0; i < 8; ++i) {
    for (let j = 0; j < 8; ++j) {
      innerHTML += createCell(i + 1, j + 1);
      innerHTML += createPiece(board.pieces[i][j], i + 1, j + 1);
    }
  }
  mainBoard.innerHTML = innerHTML;
}

function resetToFEN(FEN) {
  $(FENInput).val(FEN);
  userData.board = parseFEN(FEN);
  renderBoard();
}

$(document).ready(() => {
  $('#btn-starting-position').click(() => {
    resetToFEN(initialPositionFEN);
  });
  $('#btn-clear-board').click(() => {
    resetToFEN(emptyBoardFEN);
  });
  $('#btn-random-puzzle').click(() => {
    //const puzzleId = "Pvv9d";
    const puzzleId = "next";
    $.getJSON(`https://lichess.org/api/puzzle/${puzzleId}`, data => {
      console.log("puzzle data", data);
      resetToFEN(movesToFEN(data.game.pgn.split(" ")));
    });
  });
  $('#fen-copy').click(() => {
    navigator.clipboard.writeText(getFEN());
  });
  $('#fen-input').on('input', () => {
    resetToFEN(getFEN());
  });
  resetToFEN(FENUrlParam ? FENUrlParam : getFEN());
});
