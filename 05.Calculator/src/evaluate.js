const keywords = [ 'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'pow2', 'pow3'];

const reNumber = /^\d+([.]\d*)?/;
const reKeyword = new RegExp("^" + keywords.map(k => '(' + k + ')').join('|'));
const reOperator = /^[*+-\/^()]/;

export class InternalError extends Error {
  constructor(message) {
    super("Internal error: " + message);
  }
};

class Lexer {
  constructor(text) {
    this.text = text;
  }
  nextToken() {
    let match = null;
    let token = null; 
    if (!this.text.length)
      return null;
    if ((match = this.text.match(reNumber))) {
      const value = parseFloat(match[0]);
      if (isNaN(value))
        throw new InternalError(`failed to parse '${match[0]}' as float`);
      token = { value: value, isNumber: true };
    } else if ((match = this.text.match(reOperator))) {
      token = { value: match[0], isNumber: false };
    } else if ((match = this.text.match(reKeyword))) {
      token = { value: match[0], isNumber: false };
    } else {
      throw new SyntaxError(`Lexer failed at '${this.text}'`);
    }
    this.text = this.text.slice(match[0].length).trimStart();
    return token;
  }
}

// GRAMMAR
//
// expression
//      : additive_expression
// additive_expression
//      : multiplicative_expression
//      | additive_expression '+' multiplicative_expression
//      | additive_expression '-' multiplicative_expression
// multiplicative_expression
//      : func_expression
//      | multiplicative_expression '*' func_expression
//      | multiplicative_expression '/' func_expression
// func_expression
//      : 'sin' func_expression
//      | 'cos' func_expression
//      ...
//      | pow_expression
// pow_expression
//      : pow_expression POW2
//      | pow_expression POW3
//      | pow_expression '^' primary_expression
//      | primary_expression
// primary_expression
//      : '(' expression ')'
//      | NUMBER
class Evaluator {
  evaluate(text) {
    this.lexer = new Lexer(text);
    this.curTok = this.lexer.nextToken();
    const value = this.evalExpression();
    if (this.curTok)
      this.throwExpectationError('end of input');
    return value;
  }

  /* Private methods */

  throwExpectationError(expectation) {
    const unexpectedToken = this.curTok ? ("'" + this.curTok.value + "'") : 'end of input';
    throw new SyntaxError(`unexpected ${unexpectedToken}, expected ${expectation}`);
  }

  evalExpression() {
    return this.evalAdditiveExpression();
  }

  evalAdditiveExpression() {
    let value = this.evalMultiplicativeExpression();
    while (this.curTok && (this.curTok.value === '+' || this.curTok.value === '-')) {
      const isAdd = (this.curTok.value === '+');
      this.curTok = this.lexer.nextToken();
      if (isAdd)
        value += this.evalMultiplicativeExpression();
      else
        value -= this.evalMultiplicativeExpression();
    }
    return value;
  }

  evalMultiplicativeExpression() {
    let value = this.evalFuncExpression();
    while (this.curTok && (this.curTok.value === '*' || this.curTok.value === '/')) {
      const isMul = (this.curTok.value === '*');
      this.curTok = this.lexer.nextToken();
      if (isMul)
        value *= this.evalFuncExpression();
      else
        value /= this.evalFuncExpression();
    }
    return value;
  }

  evalFuncExpression() {
    if (this.curTok.value === 'sin') {
      this.curTok = this.lexer.nextToken();
      return Math.sin(this.evalFuncExpression());
    } else if (this.curTok.value === 'cos') {
      this.curTok = this.lexer.nextToken();
      return Math.cos(this.evalFuncExpression());
    } else if (this.curTok.value === 'tan') {
      this.curTok = this.lexer.nextToken();
      return Math.tan(this.evalFuncExpression());
    } else {
      return this.evalPowExpression();
    }
  }

  evalPowExpression() {
    let value = this.evalPrimaryExpression();
    while (this.curTok && ['pow2', 'pow3', '^'].includes(this.curTok.value)) {
      if (this.curTok.value === 'pow2') {
        this.curTok = this.lexer.nextToken();
        value = value * value;
      } else if (this.curTok.value === 'pow3') {
        this.curTok = this.lexer.nextToken();
        value = value * value * value;
      } else {
        this.curTok = this.lexer.nextToken();
        const exp = this.evalPrimaryExpression();
        value = Math.pow(value, exp);
      }
    }
    return value;
  }

  evalPrimaryExpression() {
    if (this.curTok && this.curTok.isNumber) {
      const value = this.curTok.value;
      this.curTok = this.lexer.nextToken();
      return value;
    }
    if (this.curTok && this.curTok.value === '(') {
      this.curTok = this.lexer.nextToken();
      const value = this.evalExpression();
      if (!(this.curTok && this.curTok.value === ')'))
        this.throwExpectationError(')');
      this.curTok = this.lexer.nextToken();
      return value;
    }
    this.throwExpectationError("expression");
  }
}

export default function evalutate(text) {
  const result = new Evaluator().evaluate(text);
  console.log(`evaluated '${text}' = ${result}`);
  return result;
}
