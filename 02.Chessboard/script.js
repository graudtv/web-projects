const params = new URLSearchParams(document.location.search);
const FENUrlParam = params.get('FEN');
const FENInput = document.getElementById('fen-input');
const FENCopyButton = document.getElementById('fen-copy');
const mainBoard = document.getElementById('main-board');
const mainPGNTable = document.getElementById('main-pgn-table');

const initialPositionFEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const emptyBoardFEN = '8/8/8/8/8/8/8/8 w - - 0 1';

/* enable/disable free move feature */
const freeMoveEnabled = false;

const userData = {
  board: null,
  selectedCell: null,
  pgn: null,
  pgnMoveIndex: null,
};

class ChessBoard {
  constructor(FEN) {
    this.FEN = FEN;
  }

  set FEN(str) {
    const fields = str.split(' ');

    const pieces = fields[0].split('/').map(r => {
      const row = [];
      for (const symbol of r.split('')) {
        if (symbol >= '0' && symbol <= '9') {
          for (let i = 0; i < symbol - '0'; ++i) {
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

    this.pieces = pieces;
    this.activeColor = activeColor;
    this.castling = {
        whiteKingSide: castling.includes('K'),
        whiteQueenSide: castling.includes('Q'),
        blackKingSide: castling.includes('k'),
        blackQueenSide: castling.includes('q')
    };
    this.enPassant = enPassant;
    this.halfmoves = halfmoves;
    this.fullmoves = fullmoves;
  }

  get FEN() {
    const pieces = this.pieces.map(row => {
      let str = '';
      let i = 0;
      for (const cell of row) {
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
    castling += this.castling.whiteKingSide ? 'K' : '';
    castling += this.castling.whiteQueenSide ? 'Q' : '';
    castling += this.castling.blackKingSide ? 'k' : '';
    castling += this.castling.blackQueenSide ? 'q' : '';

    const enPassant = this.enPassant || '-';
    return [ pieces, this.activeColor, castling, enPassant, this.halfmoves, this.fullmoves ].join(' ');
  }

  getPiece(row, column) {
    return this.pieces[row - 1][column - 1];
  }
  setPiece(row, column, piece) {
    this.pieces[row - 1][column - 1] = piece;
  }

  makeMove(mv) {
    const {srcRow, srcColumn, dstRow, dstColumn, promotionTarget} = mv;

    const targetPiece = this.getPiece(dstRow, dstColumn);
    const srcPiece = this.getPiece(srcRow, srcColumn);
    this.setPiece(dstRow, dstColumn, srcPiece);
    this.setPiece(srcRow, srcColumn, null);

    const isPawnMove = (srcPiece === 'P') || (srcPiece === 'p');
    const isEnPassant = isPawnMove && (dstColumn !== srcColumn) && !targetPiece;
    const isCapture = targetPiece || isEnPassant;
    const isCastling = ('Kk'.includes(srcPiece) && Math.abs(dstColumn - srcColumn) >= 2);
    const isPawnPromotion = isPawnMove && (dstRow === 1 || dstRow === 8);

    if (isEnPassant) {
      /* take enemy's pawn */
      this.setPiece(srcRow, dstColumn, null);
    } else if (isPawnPromotion) {
      this.setPiece(dstRow, dstColumn, makePiece(promotionTarget || 'Q', getPieceColor(srcPiece)));
    } else if (isCastling) {
      if (dstColumn > srcColumn) {
        /* Assume regular position of rooks */
        this.setPiece(dstRow, dstColumn - 1, this.getPiece(dstRow, 8));
        this.setPiece(dstRow, 8, null);
      } else {
        this.setPiece(dstRow, dstColumn + 1, this.getPiece(dstRow, 1));
        this.setPiece(dstRow, 1, null);
      }
    }
    if (isPawnMove || isCapture) {
      this.halfmoves++;
    }
    if (isPawnMove && Math.abs(srcRow - dstRow) === 2) {
      this.enPassant = coordsToString((srcRow + dstRow) / 2, srcColumn);
    } else {
      this.enPassant = null;
    }
    if (this.activeColor === 'b') {
      this.fullmoves++;
      this.activeColor = 'w';
    } else {
      this.activeColor = 'b';
    }
  }

  *getPieces() {
    for (let i = 0; i < 8; ++i)
      for (let j = 0; j < 8; ++j)
        if (this.pieces[i][j])
          yield { row: i + 1, column: j + 1, piece: this.pieces[i][j] };
  }

  /* Get possible moves for particular piece */
  getPossibleMoves(pieceCoords) {
    const [row, column] = pieceCoords;
    const pieces = this.pieces;
    const getPiece = (r, c) => pieces[r - 1][c - 1];
    const piece = getPiece(row, column);

    if (!piece)
      throw new Error(`no piece at ${pieceCoords} for board`, this)

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
      if (isEnemy(row - 1, column - 1) || (coordsToString(row - 1, column - 1) === this.enPassant))
        moves.push([row - 1, column - 1]);
      if (isEnemy(row - 1, column + 1) || (coordsToString(row - 1, column + 1) === this.enPassant))
        moves.push([row - 1, column + 1]);
    } else if (piece === 'p') {
      if (!getPiece(row + 1, column)) {
        moves.push([row + 1, column]);
        if (row == 2 && !getPiece(row + 2, column)) {
          moves.push([row + 2, column]);
        }
      }
      if (isEnemy(row + 1, column - 1) || (coordsToString(row + 1, column - 1) === this.enPassant))
        moves.push([row + 1, column - 1]);
      if (isEnemy(row + 1, column + 1) || (coordsToString(row + 1, column + 1) === this.enPassant))
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
      if (piece === 'K' && this.castling.whiteKingSide && isEmptyRow(row, column + 1, 8))
        moves.push([row, column + 2]);
      if (piece === 'K' && this.castling.whiteQueenSide && isEmptyRow(row, 2, column))
        moves.push([row, column - 2]);
      if (piece === 'k' && this.castling.blackKingSide && isEmptyRow(row, column + 1, 8))
        moves.push([row, column + 2]);
      if (piece === 'k' && this.castling.blackQueenSide && isEmptyRow(row, 2, column))
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

    if ((piece === 'P' && row == 2) || (piece === 'p' && row == 7)) {
      return moves.map(([dstRow, dstColumn]) => {
        return 'QRBN'.split('').map(promotion => {
          return {
            srcPiece: piece,
            srcRow: row,
            srcColumn: column,
            dstRow: dstRow,
            dstColumn: dstColumn,
            promotionTarget: promotion
          }
        });
      }).flat();
    }

    return moves.map(([dstRow, dstColumn]) => {
      return {
        srcPiece: piece,
        srcRow: row,
        srcColumn: column,
        dstRow: dstRow,
        dstColumn: dstColumn
     }
    });
  }

  getPossibleMoveTargets(pieceCoordsStr) {
    return this.getPossibleMoves(stringToCoords(pieceCoordsStr))
      .map(({dstRow, dstColumn}) => coordsToString(dstRow, dstColumn));
  }

  getLegalMoveTargets(pieceCoordsStr) {
    return [...this.getLegalMoves(stringToCoords(pieceCoordsStr))
      .map(({dstRow, dstColumn}) => coordsToString(dstRow, dstColumn))];
  }

  getPiecesOfColor(color) {
    return this.getPieces().filter(({row, column, piece}) => {
      return getPieceColor(piece) === color;
    });
  }

  getAllPossibleMoves() {
    return this.getPiecesOfColor(this.activeColor).reduce((moveList, {row, column, piece}) => {
      return moveList.concat(this.getPossibleMoves([row, column]))
    }, []);
    return [].concat(...allMoves);
  }

  /* List of moves which threaten to capture some piece (except for
   * en-passant) */
  getAllThreats() {
    return this.getAllPossibleMoves().filter(({dstRow, dstColumn}) => {
      return this.getPiece(dstRow, dstColumn) != null;
    });
  }

  *getLegalMoves(pieceCoords) {
    for (const mv of this.getPossibleMoves(pieceCoords)) {
      const boardCopy = new ChessBoard(this.FEN);
      boardCopy.makeMove(mv);
      const king = boardCopy.getPiecesOfColor(this.activeColor).find(({piece}) => piece.toUpperCase() === 'K');
      const kingCoords = coordsToString(king.row, king.column);
      console.log("considering move", mv.srcPiece, coordsToString(mv.srcRow, mv.srcColumn), "->", coordsToString(mv.dstRow, mv.dstColumn));
      console.log("active king", kingCoords);
      const attacks = boardCopy.getAllThreats().map(m => coordsToString(m.dstRow, m.dstColumn));
      console.log("attacks", attacks);
      if (!attacks.includes(kingCoords)) {
        console.log("move", mv, "IS legal");
        yield mv;
      } else {
        console.log("move", mv, "is NOT legal");
      }
    }
  }

  resolveMove(moveNotation) {
    const move = moveNotation.replace('x', '').replace('+', '');

    let moves = this.getAllPossibleMoves();
    let srcPiece = undefined;
    let srcRow = undefined;
    let srcColumn = undefined;
    let dstRow = undefined;
    let dstColumn = undefined;
    let promotionTarget = undefined;

    let match = null;

    if ((match = move.match(/^([a-h])([1-8])(=([QRNB]))?$/))) {
      /* e.g. d4 */
      srcPiece = 'P';
      dstColumn = match[1];
      dstRow = match[2];
      promotionTarget = match[4];
    } else if ((match = move.match(/^([a-h])([1-8]?)([a-h])([1-8]?)(=([QRNB]))?$/))) {
      /* e.g. d2d4 */
      srcPiece = 'P';
      srcColumn = match[1];
      srcRow = match[2];
      dstColumn = match[3];
      dstRow = match[4];
      promotionTarget = match[6];
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
      throw new Error(`invalid move notation '${move}'`)
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
    if (promotionTarget) {
      moves = moves.filter(mv => (mv.promotionTarget === promotionTarget));
    }

    if (moves.length === 1) {
      console.log(move, "OK!");
    } else {
      console.log(`illegal/ambiguous move ${move}. FEN: '${this.FEN}', candidates`, moves);
      console.log(`filter: srcPiece '${srcPiece}' srcColumn '${srcColumn}' srcRow ${srcRow} dstColumn ${dstColumn} dstRow ${dstRow} promotion ${promotionTarget}`);
    }
    if (moves.length === 0) {
      throw new Error(`move ${move} is not legal in current position`);
    } else if(moves.length > 1) {
      throw new Error(`move ${move} is ambiguous`);
    }
    return moves[0];
  }

}

function getFEN() {
  return FENInput.value || FENInput.placeholder;
}

function makePiece(letter, color) {
  return (color === 'w') ? letter.toUpperCase() : letter.toLowerCase();
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


function movesToFEN(moves) {
  const board = new ChessBoard(initialPositionFEN);
  for (mv of moves) {
    board.makeMove(board.resolveMove(mv));
  }
  return board.FEN;
}

function deselectSelectedCell() {
  $(mainBoard).children('.possible-move').remove();
  $(mainBoard).children('.selected').removeClass('selected');
  userData.selectedCell = null;
}

function handleClick(row, column) {
  const pos = coordsToString(row, column)

  if (userData.selectedCell && userData.board.getLegalMoveTargets(userData.selectedCell).includes(pos)) {
    /* Move piece and update UI */
    coords = stringToCoords(userData.selectedCell)
    userData.board.makeMove({
      srcRow: coords[0],
      srcColumn: coords[1],
      dstRow: row,
      dstColumn: column,
      promotionTarget: 'Q'
    });
    $(FENInput).val(userData.board.FEN);
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
      for ({dstRow, dstColumn} of userData.board.getLegalMoves(stringToCoords(pos))) {
        $(mainBoard).append(`<div class="possible-move" style="grid-column: ${dstColumn}; grid-row: ${dstRow}"> </div>`);
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

function setFEN(FEN) {
  $(FENInput).val(FEN);
  userData.board = new ChessBoard(FEN);
  renderBoard();
}

function resetToFEN(FEN) {
  setFEN(FEN);
  userData.pgn = null;
  userData.pgnMoveIndex = null;
  resetPGNTable([]);
}

function resetToPGN(pgn) {
  resetToFEN(movesToFEN(pgn));
  resetPGNTable(pgn);
  userData.pgn = pgn;
  userData.pgnMoveIndex = pgn.length - 1;
  setActiveMoveInPGNTable();
}

function jumpToMove(moveIdx) {
  userData.pgnMoveIndex = moveIdx;
  setActiveMoveInPGNTable();
  setFEN(movesToFEN(userData.pgn.slice(0, moveIdx + 1)));
}

function resetPGNTable(moves) {
  let html = '';
  for (let i = 0; i < moves.length; i += 2) {
    const fullmove = i / 2 + 1;
    const whiteMove = moves[i];
    const blackData = moves[i + 1] ? `<td onclick="jumpToMove(${i + 1})">${moves[i + 1]}</td>` : '';
    html += `
      <tr>
        <th>${fullmove}</th>
        <td onclick="jumpToMove(${i})">${whiteMove}</td>
        ${blackData}
      </tr>
    `;
  }
  $(mainPGNTable).html(html)
}

function setActiveMoveInPGNTable() {
  const idx = userData.pgnMoveIndex;
  $(mainPGNTable).find('td').removeClass('active');
  $(mainPGNTable).find(`tr:nth-child(${Math.floor(idx / 2) + 1}) td:nth-of-type(${idx % 2 + 1})`).addClass('active');
  wrapper = $(mainPGNTable).parent().get(0);
  const ratio = Math.floor(idx / 2) / Math.floor(userData.pgn.length / 2);
  wrapper.scrollTo(0, wrapper.scrollHeight * ratio);
  //wrapper.scrollTo(0, Math.floor(wrapper.scrollHeight * (idx / userData.pgn.length)));
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
      const moves = data.game.pgn.split(" ");
      resetToPGN(moves);
    });
  });
  $('#fen-copy').click(() => {
    navigator.clipboard.writeText(getFEN());
  });
  $('#fen-input').on('input', () => {
    resetToFEN(getFEN());
  });
  resetToFEN(FENUrlParam ? FENUrlParam : getFEN());
  document.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowRight' && userData.pgnMoveIndex !== null && userData.pgnMoveIndex + 1 < userData.pgn.length)
      jumpToMove(userData.pgnMoveIndex + 1);
    else if (e.code === 'ArrowLeft' && userData.pgnMoveIndex !== null && userData.pgnMoveIndex > 0)
      jumpToMove(userData.pgnMoveIndex - 1);
  })
});
