import {
  Chess,
  WHITE, BLACK,
  PAWN, KNIGHT, BISHOP, ROOK, QUEEN, KING
} from 'chess.js'

export class ChessBoardUI {
  moveEventListeners = []

  constructor(elementId) {
    this.board = new Chess();
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

    if (this.selectedCell) {
      const mv = this.board.moves({square: this.selectedCell, verbose: true}).find(mv => mv.to === pos);
      console.log("possible moves", this.board.moves({square: this.selectedCell, verbose: true}));
      console.log("match?", mv);
      if (mv) {
        /* Legal move. Move piece and update UI */
        this.board.move(mv);
        this.selectedCell = null;
        this.render();
        for (const listener of this.moveEventListeners)
          listener(mv);
        return;
      }
    }
    this.deselectSelectedCell();
    const selectedPiece = this.board.get(pos);
    if (selectedPiece && selectedPiece.color === this.board.turn()) {
      /* Highlight selected square */
      this.$boardElem.children(`.cell[value="${pos}"]`).addClass('selected');
      this.selectedCell = pos;

      /* Show possible moves */
      const possibleMoves = this.board.moves({square: pos, verbose: true});
      for (const [dstRow, dstColumn] of possibleMoves.map(mv => stringToCoords(mv.to))) {
        this.$boardElem.append(
          $('<div class="possible-move"></div>').css({'grid-row': dstRow, 'grid-column': dstColumn})
        );
      }
    }
  }

  render() {
    const createPiece = (piece, row, column) => {
      if (piece) {
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
    for (let row = 1; row <= 8; ++row) {
      for (let column = 1; column <= 8; ++column) {
        createCell(row, column);
        createPiece(this.board.get(coordsToString(row, column)), row, column);
      }
    }
  }

  resetToFEN(FEN) {
    this.board.load(FEN, {skipValidation: true});
    this.selectedCell = null;
    this.render();
  }

  /* Example: boardUI.addMoveEventListener((mv) => { ... }) */
  addMoveEventListener(listener) {
    this.moveEventListeners.push(listener);
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

/* { type = KING, color: BLACK } -> 'black king' */
function getPieceClass(piece) {
  const color = (piece.color == WHITE) ? "white " : "black ";
  switch (piece.type) {
    case KING: return color + "king";
    case QUEEN: return color + "queen";
    case ROOK: return color + "rook";
    case BISHOP: return color + "bishop";
    case KNIGHT: return color + "knight";
    case PAWN: return color + "pawn";
  }
}

