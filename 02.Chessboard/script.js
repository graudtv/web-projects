const params = new URLSearchParams(document.location.search);
const FENUrlParam = params.get('FEN');
const FENInput = document.getElementById('fen-input');
const FENCopyButton = document.getElementById('fen-copy');

const initialPositionFEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const emptyBoardFEN = '8/8/8/8/8/8/8/8 w - - 0 1';

class ChessBoard {
  constructor(FEN) {
    this.FEN = FEN || emptyBoardFEN;
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
      if (srcPiece === 'K')
        this.castling.whiteQueenSide = this.castling.whiteKingSide = false;
      else
        this.castling.blackQueenSide = this.castling.blackKingSide = false;

      if (dstColumn > srcColumn) {
        /* Assume regular position of rooks */
        this.setPiece(dstRow, dstColumn - 1, this.getPiece(dstRow, 8));
        this.setPiece(dstRow, 8, null);
      } else {
        this.setPiece(dstRow, dstColumn + 1, this.getPiece(dstRow, 1));
        this.setPiece(dstRow, 1, null);
      }
    }

    /* take away castling rights if rook moves from original position */
    if (srcPiece === 'R' && srcRow === 8 && srcColumn === 1)
      this.castling.whiteQueenSide = false;
    else if (srcPiece === 'R' && srcRow === 8 && srcColumn === 8)
      this.castling.whiteKingSide = false;
    else if (srcPiece === 'r' && srcRow === 1 && srcColumn === 1)
      this.castling.blackQueenSide = false;
    else if (srcPiece === 'r' && srcRow === 1 && srcColumn === 8)
      this.castling.blackKingSide = false;

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
    const isValidTarget = ([r, c]) => (r > 0 && r <= 8 && c > 0 && c <= 8 && isEmptyOrEnemy(r, c));

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
    return this.getLegalMoves(stringToCoords(pieceCoordsStr))
      .map(({dstRow, dstColumn}) => coordsToString(dstRow, dstColumn));
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
  }

  /* List of moves which threaten to capture some piece (except for
   * en-passant) */
  getAllThreats() {
    return this.getAllPossibleMoves().filter(({dstRow, dstColumn}) => {
      return this.getPiece(dstRow, dstColumn) != null;
    });
  }

  getLegalMoves(pieceCoords) {
    return this.getPossibleMoves(pieceCoords).filter(mv => {
      const boardCopy = new ChessBoard(this.FEN);
      boardCopy.makeMove(mv);
      const king = boardCopy.getPiecesOfColor(this.activeColor).find(({piece}) => piece.toUpperCase() === 'K');
      const kingCoords = coordsToString(king.row, king.column);
      const attacks = boardCopy.getAllThreats().map(m => coordsToString(m.dstRow, m.dstColumn));
      return !attacks.includes(kingCoords);
    });
  }

  getAllLegalMoves() {
    return this.getPiecesOfColor(this.activeColor).reduce((moveList, {row, column, piece}) => {
      return moveList.concat(this.getLegalMoves([row, column]))
    }, []);
  }

  resolveMove(moveNotation) {
    const move = moveNotation.replace('x', '').replace('+', '');

    let moves = this.getAllLegalMoves();
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
    } else if ((match = move.match(/^([RNBKQ])([a-h])?([1-8])?([a-h])([1-8])$/))) {
      /* Nf6, Ngf6, N1f6 */
      srcPiece = match[1];
      srcColumn = match[2];
      srcRow = match[3];;
      dstColumn = match[4];
      dstRow = match[5];
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

function getMoveNotation(mv) {
  const {srcRow, srcColumn, srcPiece, dstRow, dstColumn, promotionTarget} = mv;
  const piece = (srcPiece.toUpperCase() !== 'P') ? srcPiece.toUpperCase() : '';
  const srcCoords = coordsToString(srcRow, srcColumn);
  const dstCoords = coordsToString(dstRow, dstColumn);
  return piece + srcCoords + dstCoords;
}

class ChessBoardUI {
  moveEventListeners = []

  constructor(elementId) {
    this.board = new ChessBoard();
    this.$boardElem = $(`#${elementId}`)
    this.selectedCell = null;
  }

  deselectSelectedCell() {
    this.$boardElem.children('.possible-move').remove();
    this.$boardElem.children('.selected').removeClass('selected');
    this.selectedCell = null;
  }

  handleClick(row, column) {
    const pos = coordsToString(row, column)

    if (this.selectedCell && this.board.getLegalMoveTargets(this.selectedCell).includes(pos)) {
      /* Legal move. Move piece and update UI */
      const srcCoords = stringToCoords(this.selectedCell)
      const mv = {
        srcRow: srcCoords[0],
        srcColumn: srcCoords[1],
        srcPiece: this.board.getPiece(srcCoords[0], srcCoords[1]),
        dstRow: row,
        dstColumn: column,
        promotionTarget: 'Q'
      };
      this.board.makeMove(mv);
      this.selectedCell = null;
      this.render();
      for (const listener of this.moveEventListeners)
        listener(mv);
    } else {
      this.deselectSelectedCell();
      const selectedPiece = this.board.getPiece(row, column);
      if (selectedPiece && this.board.activeColor === getPieceColor(selectedPiece)) {
        /* Highlight selected square */
        this.$boardElem.children(`.cell[value="${pos}"]`).addClass('selected');
        this.selectedCell = pos;

        /* Show possible moves */
        for (const {dstRow, dstColumn} of this.board.getLegalMoves([row, column])) {
          this.$boardElem.append(
            $('<div class="possible-move"></div>').css({'grid-row': dstRow, 'grid-column': dstColumn})
          );
        }
      }
    }
  }

  render() {
    const createPiece = (piece, row, column) => {
      if (piece !== null) {
        this.$boardElem.append(
          $('<div></div>').addClass(getPieceClass(piece))
                          .val(coordsToString(row, column))
                          .css({ 'grid-row': row, 'grid-column': column})
                          .click(() => { this.handleClick(row, column); })
        );
      }
    }
    const createCell = (row, column) => {
      const color = ((row + column) % 2 == 0) ? "white" : "black";
      this.$boardElem.append(
        $('<div></div>').addClass(color).addClass('cell')
                        .val(coordsToString(row, column))
                        .css({ 'grid-row': row, 'grid-column': column})
                        .click(() => { this.handleClick(row, column); })
      );
    }

    this.$boardElem.empty();
    for (let i = 0; i < 8; ++i) {
      for (let j = 0; j < 8; ++j) {
        createCell(i + 1, j + 1);
        createPiece(this.board.pieces[i][j], i + 1, j + 1);
      }
    }
  }

  resetToFEN(FEN) {
    this.board.FEN = FEN;
    this.selectedCell = null;
    this.render();
  }

  /* Example: boardUI.addMoveEventListener((mv) => { ... }) */
  addMoveEventListener(listener) {
    this.moveEventListeners.push(listener);
  }
}

class SimpleMoveTableUI {
  moves = []
  curMoveIndex = 0;
  moveEventListeners = [];

  constructor(elementId) {
    this.$tableElem = $(`#${elementId}`);
  }

  reset(moveList=[]) {
    this.moves = moveList;
    this.curMoveIndex = 0;
    this.render();
  }

  #notifyListeners() {
    for (const listener of this.moveEventListeners)
      listener(this.curMoveIndex);
  }

  render() {
    const handleClick = (moveIndex) => {
      const prevIndex = this.curMoveIndex;
      this.setCurrentMove(moveIndex);
      if (prevIndex !== this.curMoveIndex)
        this.#notifyListeners();
    };

    this.$tableElem.empty();
    for (let i = 0; i < this.moves.length; i += 2) {
      const tr = $('<tr></tr>');
      tr.append(`<th>${i / 2 + 1}</th>`);
      tr.append($(`<td>${this.moves[i]}</td>`).click(() => {handleClick(i)}));
      if (this.moves[i + 1])
        tr.append($(`<td>${this.moves[i + 1]}</td>`).click(() => {handleClick(i + 1)}));
      this.$tableElem.append(tr);
    }
    this.setCurrentMove(this.curMoveIndex);
  }

  constrainMoveIndex(moveIndex) {
    if (moveIndex < 0 || this.moves.length === 0)
      return 0;
    if (moveIndex >= this.moves.length)
      return this.moves.length - 1;
    return moveIndex;
  }

  getCurrentMoveIndex() {
    return this.curMoveIndex;
  }

  setCurrentMove(moveIndex) {
    moveIndex = this.constrainMoveIndex(moveIndex);
    this.$tableElem.find('td').removeClass('active');
    this.$tableElem.find(`tr:nth-child(${Math.floor(moveIndex / 2) + 1}) td:nth-of-type(${moveIndex % 2 + 1})`).addClass('active');
    this.curMoveIndex = moveIndex;
  }

  focusTop(moveIndex) {
    if (this.moves.length === 0)
      return;
    moveIndex = this.constrainMoveIndex(moveIndex);
    const $wrapper = this.$tableElem.parent();
    const $td = this.$tableElem.find('td').eq(moveIndex);
    const tdTop = $td.position().top;
    $wrapper.get(0).scrollTo(0, tdTop);
  }

  focusBottom(moveIndex) {
    if (this.moves.length === 0)
      return;
    moveIndex = this.constrainMoveIndex(moveIndex);
    const $wrapper = this.$tableElem.parent();
    const $td = this.$tableElem.find('td').eq(moveIndex);
    const tdBottom = $td.position().top + $td.height();
    $wrapper.get(0).scrollTo(0, tdBottom - $wrapper.height());
  }

  isFullyVisible(moveIndex) {
    if (this.moves.length === 0)
      return true;
    moveIndex = this.constrainMoveIndex(moveIndex);
    const $wrapper = this.$tableElem.parent();
    const wrapper = $wrapper.get(0);
    const $td = this.$tableElem.find('td').eq(moveIndex);
    const tdTop = $td.position().top;
    const tdBottom = $td.position().top + $td.height();
    return tdTop >= wrapper.scrollTop && tdBottom <= wrapper.scrollTop + $wrapper.height();
  }

  gotoNextMove() {
    this.setCurrentMove(this.curMoveIndex + 1);
    if (!this.isFullyVisible(this.curMoveIndex))
      this.focusBottom(this.curMoveIndex);
    this.#notifyListeners();
  }

  gotoPrevMove() {
    this.setCurrentMove(this.curMoveIndex - 1);
    if (!this.isFullyVisible(this.curMoveIndex))
      this.focusTop(this.curMoveIndex);
    this.#notifyListeners();
  }

  gotoFirstMove() {
    this.setCurrentMove(0);
    this.focusBottom(this.curMoveIndex);
    this.#notifyListeners();
  }

  gotoLastMove() {
    this.setCurrentMove(this.moves.length - 1);
    this.focusBottom(this.curMoveIndex);
    this.#notifyListeners();
  }

  pushMove(mv) {
    this.moves = this.moves.slice(0, this.curMoveIndex + 1);
    this.moves.push(mv);
    this.curMoveIndex += 1;
    this.render();
    this.focusBottom(this.curMoveIndex);
  }

  getCurrentFEN() {
    return movesToFEN(this.moves.slice(0, this.curMoveIndex + 1));
  }

  /* Example: tableUI.addMoveEventListener((moveIndex) => { ... }) */
  addMoveEventListener(listener) {
    this.moveEventListeners.push(listener);
  }
}

$(document).ready(() => {
  const mainBoard = new ChessBoardUI('main-board');
  const mainMoveTable = new SimpleMoveTableUI('main-pgn-table');

  const resetToFEN = (FEN) => {
    $(FENInput).val(FEN);
    mainBoard.resetToFEN(FEN);
    mainMoveTable.reset();
  };

  const resetToPGN = (moveList) => {
    const FEN = movesToFEN(moveList);
    $(FENInput).val(FEN);
    mainBoard.resetToFEN(FEN);
    mainMoveTable.reset(moveList);
    mainMoveTable.setCurrentMove(moveList.length - 1);
    mainMoveTable.focusBottom(moveList.length - 1);
  }

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

  mainMoveTable.addMoveEventListener(() => {
    const FEN = mainMoveTable.getCurrentFEN();
    mainBoard.resetToFEN(FEN);
    $(FENInput).val(FEN);
  });

  mainBoard.addMoveEventListener(mv => {
    mainMoveTable.pushMove(getMoveNotation(mv));
    $(FENInput).val(mainBoard.board.FEN);
  });

  document.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowRight') {
      mainMoveTable.gotoNextMove();
    } else if (e.code === 'ArrowLeft') {
      mainMoveTable.gotoPrevMove();
    } else if (e.code === 'ArrowUp') {
      mainMoveTable.gotoFirstMove();
    } else if (e.code === 'ArrowDown') {
      mainMoveTable.gotoLastMove();
    }
  });

  resetToFEN(FENUrlParam ? FENUrlParam : getFEN());
});
