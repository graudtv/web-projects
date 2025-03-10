import { Chess } from 'chess.js'

export function movesToFEN(moveList) {
  const board = new Chess();
  for (const mv of moveList)
    board.move(mv);
  return board.fen();
}

export const initialPositionFEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
export const emptyBoardFEN = '8/8/8/8/8/8/8/8 w - - 0 1';
