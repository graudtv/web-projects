import {
  ChessBoard,
  coordsToString,
  stringToCoords,
  getPieceColor,
} from '../chess/core.js'

export class ChessBoardUI {
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

