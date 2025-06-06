const params = new URLSearchParams(document.location.search);
const FENUrlParam = params.get('FEN');
const FENInput = document.getElementById('fen-input');
const FENCopyButton = document.getElementById('fen-copy');

import '../assets/layout.css'
import '../assets/components.css'
import '../assets/chessground.css'
import './ui/NavBar.js'

import { Chess } from 'chess.js'
import { movesToFEN, emptyBoardFEN, initialPositionFEN } from './chess/utils.js'
import { ChessboardUI } from './ui/ChessboardUI.js'
import { SimpleMoveTableUI } from './ui/SimpleMoveTableUI.js'
import { userSettings } from './app/userSettings.js'
import { boardThemes } from './ui/themes.js'
import { evaluate } from './mfce/mfce.js'

function getFEN() {
  return FENInput.value || FENInput.placeholder;
}

function showAlert(alertHTML, kind="success") {
  $('#alert-box').append(`
    <div class="alert alert-${kind} text-center fw-bold mb-0" role="alert">
      ${alertHTML}
    </div>
  `);
}

function clearAlerts() {
  $('#alert-box').empty();
}

$(document).ready(() => {
  const mainBoard = new ChessboardUI('main-board');
  const mainMoveTable = new SimpleMoveTableUI('main-pgn-table');

  const runEvaluation = (FEN) => {
    evaluate({FEN: FEN, depth: 5})
      .then((res) => console.log("evaluation:", res))
      .catch((err) => console.log("evaluation error:", err));
  }

  const resetToFEN = (FEN) => {
    clearAlerts();
    $(FENInput).val(FEN);
    mainBoard.resetToFEN(FEN);
    mainMoveTable.reset();
    runEvaluation(FEN);
  };

  const resetToPGN = (moveList) => {
    clearAlerts();
    const FEN = movesToFEN(moveList);
    $(FENInput).val(FEN);
    mainBoard.resetToFEN(FEN, "auto");
    const activeColor = mainBoard.board.turn() === 'w' ? 'White' : 'Black';
    showAlert(`${activeColor} to move and win!`, 'info');
    mainMoveTable.reset(moveList);
    mainMoveTable.setCurrentMove(moveList.length - 1);
    mainMoveTable.focusBottom(moveList.length - 1);
    runEvaluation(FEN);
  }

  $('#btn-starting-position').click(() => {
    resetToFEN(initialPositionFEN);
  });

  $('#btn-clear-board').click(() => {
    resetToFEN(emptyBoardFEN);
  });

  $('#btn-random-puzzle').click(function() {
    clearAlerts();
    const initialText = $(this).text();
    let isLoaded = false;

    setTimeout(() => {
      if (!isLoaded)
        $(this).html('<span class="spinner-border spinner-border-sm" aria-hidden="true"></span> Loading...');
    }, 500);

    const puzzleId = "sHTlA"; // mateIn1
    //const puzzleId = "Gy5j7";
    //const puzzleId = "Pvv9d";
    //const puzzleId = "next";
    //const puzzleId = "next?angle=mateIn1";
    $.getJSON(`https://lichess.org/api/puzzle/${puzzleId}`, data => {
      isLoaded = true;
      $(this).text(initialText);
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
    runEvaluation(FEN);
    clearAlerts();
  });

  mainBoard.addMoveEventListener(mv => {
    mainMoveTable.pushMove(mv.san);
    $(FENInput).val(mainBoard.board.fen());
    runEvaluation(mainBoard.board.fen());
    clearAlerts();
    if (mainBoard.board.isCheckmate())
      showAlert("Checkmate!", "success");
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
    } else if (e.code === 'KeyF') {
      mainBoard.toggleOrientation();
    }
  });
  resetToFEN(FENUrlParam ? FENUrlParam : getFEN());

});
