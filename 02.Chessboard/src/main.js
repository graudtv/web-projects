const params = new URLSearchParams(document.location.search);
const FENUrlParam = params.get('FEN');
const FENInput = document.getElementById('fen-input');
const FENCopyButton = document.getElementById('fen-copy');

import {
  getMoveNotation,
  movesToFEN,
  emptyBoardFEN,
  initialPositionFEN
} from './chess/core.js'
import { ChessBoardUI } from './ui/chessboard.js';
import { SimpleMoveTableUI } from './ui/simplemovetable.js';

function getFEN() {
  return FENInput.value || FENInput.placeholder;
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
