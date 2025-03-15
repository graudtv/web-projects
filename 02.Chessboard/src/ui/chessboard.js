import { Chess, SQUARES } from 'chess.js';
import { Chessground } from 'chessground';

export class ChessBoardUI {
  moveEventListeners = []

  constructor(elementId) {
    this.board = new Chess();
    this.cg = Chessground(document.getElementById(elementId), {
      draggable: {
        enabled: false
      },
      animation: {
        enabled: false
      },
      premovable: {
        enabled: false
      }
    });
  }

  toggleOrientation() {
    this.cg.toggleOrientation();
  }

  /* orientation:
   * - "keep" - keep previous board orientation
   * - "auto" - set orientation based on which side is to move according to FEN
   * - "black" / "white" - explictly set orientation
   */
  resetToFEN(FEN, orientation="keep") {
    const handleMove = (orig, dest) => {
      const mv = this.board.move({from: orig, to: dest, promotion: 'q'});
      this.cg.set({
        fen: this.board.fen(),
        turnColor: getColor(this.board),
        check: this.board.inCheck(),
        movable: {
          color: getColor(this.board),
          dests: getPossibleMoves(this.board)
        }
      });
      for (const listener of this.moveEventListeners)
        listener(mv);
    }

    this.board.load(FEN, {skipValidation: true});
    this.cg.cancelMove();
    this.cg.cancelPremove();

    if (orientation === "keep") {
      orientation = this.cg.state.orientation;
    } else if (orientation === "auto") {
      orientation = getColor(this.board);
    } else if (!["white", "black"].includes(orientation)) {
      throw new Error("invalid orientation specified");
    }

    this.cg.set({
      fen: FEN,
      orientation: orientation,
      lastMove: undefined,
      check: this.board.inCheck(),
      turnColor: getColor(this.board),
      movable: {
        free: false,
        dests: getPossibleMoves(this.board),
        color: getColor(this.board),
        events: {
          after: handleMove
        }
      }
    });
  }

  /* Example: boardUI.addMoveEventListener((mv) => { ... }) */
  addMoveEventListener(listener) {
    this.moveEventListeners.push(listener);
  }
}

function getColor(board) {
  return board.turn() === 'w' ? 'white' : 'black';
}

function getPossibleMoves(board) {
  const moves = new Map();
  SQUARES.forEach(s => {
    const ms = board.moves({ square: s, verbose: true });
    if (ms.length)
      moves.set(s, ms.map((m) => m.to));
  });
  return moves;
}
