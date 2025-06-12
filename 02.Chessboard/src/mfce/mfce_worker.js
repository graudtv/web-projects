/* Communication protocol:
 * - Client sends a request
 * - Worker sends a response
 * - Client should terminate the worker
 * 
 * Request: {
 *   FEN: String,
 *   depth?: Number,
 * Response (success): {
 *   status: 'ok',
 *   data: {
 *     line: [ <move: String>, ...]
 *     evaluation: String
 *   }
 * }
 * Response (failure): {
 *   status: 'error',
 *   message: String
 * }
 */

import { Chess } from 'chess.js'

let lineCount = 0;

onmessage = (e) => {
  const options = e.data;
  options.depth = (options.depth !== undefined) ? options.depth : 14;
  options.lines = (options.lines !== undefined) ? options.lines : 1;
  const reject = (err) => { postMessage({status: 'error', message: err}); };
  if (!options.FEN)
    reject("'FEN' argument required");
  if (options.depth < 0)
    reject("invalid 'depth' value");

  const board = new Chess(options.FEN);
  const startTime = Date.now();

  const notificationInterval = 100; // ms
  const notifications = setInterval(() => {
    console.log(`evaluated ${Math.floor(lineCount / 1000)}k lines`);
  }, notificationInterval);

  setTimeout(() => {console.log("hello")}, 0);
  Promise.resolve().then(() => {console.log("wtf")});

  asyncEval(board, options.depth).then(function handleEval({line, evaluation}) {
    //clearInterval(notifications);
    postMessage({status: 'ok', data: {
      line: line.reverse(),
      evaluation: prettifyEval(evaluation)
    }});
    console.log("Evaluated", lineCount, "lines in", Date.now() - startTime, "ms");
  });
  console.log("???");
}

const CHECKMATE = 1000000;
const MAX_EVAL = CHECKMATE - 1000;

function prettifyEval(ev) {
  if (ev === CHECKMATE || ev === -CHECKMATE)
    return '-';
  if (ev > MAX_EVAL)
    return `M${(CHECKMATE - ev + 1) / 2}`;
  if (ev < -MAX_EVAL)
    return `-M${(CHECKMATE + ev + 1) / 2}`;
  return ev;
}

function asyncEvalChild(board, mv, depth, trace) {
  board.move(mv);
  trace.push(mv);
  // FIXME
  //return asyncEval(board, depth - 1, trace).then(childEval => {
  return asyncEval(board, depth - 1, trace).then(function propagateChildEval(childEval) {
    board.undo();
    trace.pop();
    childEval.line.push(mv);
    if (childEval.evaluation > MAX_EVAL)
      --childEval.evaluation;
    else if (childEval.evaluation < -MAX_EVAL)
      ++childEval.evaluation;
    //console.log("eval", trace, "as", childEval.evaluation, "continuation", childEval.line);
    return childEval;
  });
}

function makeLineEval(line, evaluation) {
  return { line: line, evaluation: evaluation };
}

function incLineCount() {
  ++lineCount;
  if (++lineCount % 10000 === 0)
    console.log(`${Math.floor(lineCount / 1000)}k`);
}

function syncEval(board, depth, trace) {
  const isWhiteTurn = board.turn() === 'w';

  if (board.isCheckmate()) {
    incLineCount();
    return isWhiteTurn ? makeLineEval([], -CHECKMATE) : makeLineEval([], CHECKMATE);
  }
  if (board.isDraw()) {
    incLineCount();
    return makeLineEval([], 0);
  }
  if (depth === 0) {
    incLineCount();
    return makeLineEval([], 0);
  }
  const moves = board.moves();
  if (moves.length > 0) {
    return makeLineEval([], 0);
    const chooseBestWhiteLine = (prev, cur) => ((cur.evaluation > prev.evaluation) ? cur : prev);
    const chooseBestBlackLine = (prev, cur) => ((cur.evaluation < prev.evaluation) ? cur : prev);
    const chooseBestLine = isWhiteTurn ? chooseBestWhiteLine : chooseBestBlackLine;
    const bestLine = isWhiteTurn ? makeLineEval([], -CHECKMATE) : makeLineEval([], CHECKMATE);
    return moves.reduce((best, mv) => {
      board.move(mv);
      trace.push(mv);
      const childEval = syncEval(board, depth - 1, trace);
      childEval.line.push(mv);
      if (childEval.evaluation > MAX_EVAL)
        --childEval.evaluation;
      else if (childEval.evaluation < -MAX_EVAL)
        ++childEval.evaluation;
      board.undo();
      trace.pop();
      return chooseBestLine(best, childEval);
    }, bestLine);
  }
  incLineCount();
  throw new Error("unreachable"); 
}

let evalId = 0;

function logTime(start) {
  const now = Date.now();
  if (now - start > 5)
    console.log("end eval in ", now - start, "ms");
}

async function asyncEval(board, depth, trace = []) {
  const start = Date.now();
  //const id = evalId++;
  //console.log("start eval", id, "--", trace);
  let result;
  const taskDepth = 0;
  if (depth <= taskDepth) {
    const ev = syncEval(board, depth, trace);
    /*console.log(`evaluated[sync] ${trace} as ${ev.evaluation} continuation ${ev.line} from ${board.moves()}`);*/
    //console.log("end eval", id, "depth reached");
    logTime(start);
    return ev;
  }

  const moves = board.moves();
  const isWhiteTurn = board.turn() === 'w';
  let bestLine = isWhiteTurn ? makeLineEval([], -CHECKMATE) : makeLineEval([], CHECKMATE);

  function chooseBestLine(prev, cur) { // FIXME
    const bestLine = isWhiteTurn ? ((cur.evaluation > prev.evaluation) ? cur : prev)
                                 : ((cur.evaluation < prev.evaluation) ? cur : prev);
    /*
    console.log("reduce", trace, isWhiteTurn, prev.line, "=", prev.evaluation,
      "and", cur.line, "=", cur.evaluation,
      "->", bestLine.line, "=", bestLine.evaluation);
      */
    return bestLine;
  }

  if (moves.length > 0) {
    let promise = asyncEvalChild(board, moves[0], depth, trace);
    for (let i = 1; i < moves.length; ++i) {

      promise = promise.then(function handleChildEval(childEval) {
        bestLine = chooseBestLine(bestLine, childEval);
        return asyncEvalChild(board, moves[i], depth, trace);
      });
      /*FIXME
      promise = promise.then(childEval => {
        bestLine = chooseBestLine(bestLine, childEval);
        return asyncEvalChild(board, moves[i], depth, trace);
      });
      */
    }
    //console.log("end eval", id, "async recursion");
    logTime(start);
    return promise.then(function handleLastChildEval(childEval) {
      bestLine = chooseBestLine(bestLine, childEval);
      //console.log(`evaluated ${trace} as ${bestLine.evaluation} continuation ${bestLine.line} from ${board.moves()}`);
      return bestLine;
    });
    /*FIXME
    return promise.then(childEval => {
      bestLine = chooseBestLine(bestLine, childEval);
      //console.log(`evaluated ${trace} as ${bestLine.evaluation} continuation ${bestLine.line} from ${board.moves()}`);
      return bestLine;
    });
    */
  }
  incLineCount();
  //console.log("end eval", id);
  logTime(start);
  if (board.isCheckmate())
    return isWhiteTurn ? makeLineEval([], -CHECKMATE) : makeLineEval([], CHECKMATE);
  if (board.isDraw())
    return makeLineEval([], 0);
  throw new Error("unreachable"); 
}

