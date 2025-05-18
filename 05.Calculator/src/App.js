import './App.css';
import { useState, useEffect, useRef } from 'react';
import { decomposeFloat } from './utils.js';
import { SegmentIndicator, SegmentIndicatorLine } from './SegmentIndicator.js';
import { PixelIndicator, PixelIndicatorLine } from './PixelIndicator.js';
import evaluate from './evaluate.js';

const PIXEL_INDICATOR_COUNT = 10;
const SEGMENT_INDICATOR_COUNT = 9;

const Button = ({text, altText = '', danger, onPress}) => {
  const buttonCls = danger ? 'button danger' : 'button';
  return (
    <div className="button-with-alt-text">
      <span>{altText}</span>
      <button className={buttonCls} onMouseDown={onPress}>{text}</button>
    </div>
  );
}

const Controls = ({onPress}) => {
  const action = (button) => {
    return () => { onPress(button); }
  }

  return (
    <div className="controls">
      <div className="button-row">
        <Button text="SHIFT" onPress={action('shift')} />
        <Button text="<" onPress={action('leftArrow')} />
        <Button text=">" onPress={action('rightArrow')} />
        <Button text="ON" onPress={action('ON')} />
      </div>
      <div className="button-row">
        <Button text="√"   onPress={action('sqrt2')} />
        <Button text="x²"  onPress={action('pow2')} />
        <Button text="x³"  onPress={action('pow3')} altText="∛" />
        <Button text="^"   onPress={action('pow')} altText={<><sup>x</sup>√</>} />
        <Button text="log" onPress={action('log')} altText={<>10<sup>x</sup></>}/>
        <Button text="ln"  onPress={action('ln')} altText={<>e<sup>x</sup></>} />
      </div>
      <div className="button-row">
        <Button text="("   onPress={action('(')} />
        <Button text=")"   onPress={action(')')} />
        <Button text="hyp" onPress={action('hyp')} />
        <Button text="sin" onPress={action('sin')} altText={<>sin<sup>-1</sup></>} />
        <Button text="cos" onPress={action('cos')} altText={<>cos<sup>-1</sup></>}/>
        <Button text="tan" onPress={action('tan')} altText={<>tan<sup>-1</sup></>}/>
      </div>
      <div className="button-row">
        <Button text="7"   onPress={action('7')} />
        <Button text="8"   onPress={action('8')} />
        <Button text="9"   onPress={action('9')} />
        <Button text="DEL" onPress={action('DEL')} altText="INS" danger />
        <Button text="AC"  onPress={action('AC')} altText="OFF" danger />
      </div>
      <div className="button-row">
        <Button text="4" onPress={action('4')} />
        <Button text="5" onPress={action('5')} />
        <Button text="6" onPress={action('6')} />
        <Button text="×" onPress={action('*')} />
        <Button text="÷" onPress={action('/')} />
      </div>
      <div className="button-row">
        <Button text="1" onPress={action('1')} />
        <Button text="2" onPress={action('2')} />
        <Button text="3" onPress={action('3')} />
        <Button text="+" onPress={action('+')} />
        <Button text="-" onPress={action('-')} />
      </div>
      <div className="button-row">
        <Button text="0"   onPress={action('0')} />
        <Button text="."   onPress={action('.')} />
        <Button text="EXP" onPress={action('EXP')} altText="π"/>
        <Button text="Ans" onPress={action('Ans')} />
        <Button text="="   onPress={action('=')} />
      </div>
    </div>
  );
};

const StatusBar = ({shiftEnabled = false, hypEnabled = false}) => {
  return (
    <div className="status-bar">
      <span className={shiftEnabled ? 'shift-indicator visible' : 'shift-indicator'}>S</span>
      <span className={hypEnabled ? 'hyp-indicator visible' : 'hyp-indicator'}>hyp</span>
    </div>
  );
};

const Screen = ({mode = 'enabled', input = '', resultText = '', exponentValue = null,
                 indicators = {}, cursorVisible = false, cursorPosition = 0,
                 pixelIndicatorCount = PIXEL_INDICATOR_COUNT,
                 segmentIndicatorCount = SEGMENT_INDICATOR_COUNT
}) => {
  const inputText = input.reduce((text, item) => text + item, '');
  const cursorIdx = input.slice(0, cursorPosition).reduce((len, item) => len + item.length, 0);

  let lbegin = cursorIdx - pixelIndicatorCount + 1;
  if (lbegin < 0)
    lbegin = 0;
  const lend = cursorIdx;
  const lsize = lend - lbegin;
  const rbegin = cursorIdx + 1;
  const rsize = pixelIndicatorCount - lsize - 1;
  const rend = rbegin + rsize;
  const mid = cursorVisible ? '_' :
              (cursorIdx < inputText.length) ? inputText[cursorIdx] : ' ';
  const visibleInput = inputText.slice(lbegin, lend) + mid + inputText.slice(rbegin, rend);

  const leftArrowEnabled = (lbegin > 0);
  const rightArrowEnabled = (rend <= inputText.length);

  const leftArrowColor = leftArrowEnabled ? 'var(--pixel-visible)' : 'var(--pixel-invisible)';
  const rightArrowColor = rightArrowEnabled ? 'var(--pixel-visible)' : 'var(--pixel-invisible)';

  return (
    <div className="screen-container">
      <div className="screen">
        <div className={mode === 'disabled' ? 'hidden' : ''}>
          <StatusBar shiftEnabled={indicators.shift} hypEnabled={indicators.hyp} />
          <div className="input-bar">
            <div className="left-arrow-indicator">
              <box-icon name='left-arrow-alt' type='solid' color={leftArrowColor}></box-icon>
            </div>
            <PixelIndicatorLine text={mode === 'error' ? resultText : visibleInput} indicatorCount={pixelIndicatorCount} />
            <div className="right-arrow-indicator">
              <box-icon name='right-arrow-alt' type='solid' color={rightArrowColor}></box-icon>
            </div>
          </div>
          <div className="result-bar">
            <SegmentIndicatorLine text={mode !== 'error' ? resultText : ''} indicatorCount={segmentIndicatorCount} />
            <div className={exponentValue ? "exponent-indicator visible" : "exponent-indicator"}>×10</div>
            <div className="exponent-value">
              <SegmentIndicatorLine text={exponentValue ? exponentValue.toString() : ''} indicatorCount={2} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const Calculator = () => {
  /* modes:
   * 'disabled': calculator is powered off
   * 'enabled': normal operation mode
   * 'error': Math/Syntax/Other error. Most controls on calculator are
   *          disabled, error message is displayed on the screen
   */
  const [mode, setMode] = useState('enabled');
  const [input, setInput] = useState([]);
  const [shiftEnabled, setShiftEnabled] = useState(false);
  const [hypEnabled, setHypEnabled] = useState(false);
  const [resultText, setResultText] = useState('0.');
  const [exponentValue, setExponentValue] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [cursorVisible, setCursorVisible] = useState(true);
  const cursorIntervalRef = useRef(null);

  const CURSOR_BLINK_DURATION = 500; // ms

  useEffect(() => {
    startCursorBlinking();
    return stopCursorBlinking;
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  });

  const stopCursorBlinking = () => {
    if (cursorIntervalRef.current)
      clearInterval(cursorIntervalRef.current);
  }

  const startCursorBlinking = () => {
    stopCursorBlinking();
    let isVisible = true; // cursorVisible doesn't reflect latest state, separate variable required
    cursorIntervalRef.current = setInterval(() => {
      isVisible = !isVisible;
      setCursorVisible(isVisible);
    }, CURSOR_BLINK_DURATION);
    setCursorVisible(true);
  };

  const reset = () => {
    setMode('enabled');
    setInput([]);
    setShiftEnabled(false);
    setHypEnabled(false);
    setResultText('0.');
    setExponentValue(0);
    setCursorPosition(0);
    startCursorBlinking();
  }

  const setResult = (value) => {
    const { baseValue, exponentValue } = decomposeFloat(value, SEGMENT_INDICATOR_COUNT - 1);
    setResultText(baseValue.includes('.') ? baseValue : (baseValue + '.'));
    setExponentValue(exponentValue);
    // TODO: check if exponent > 99
  }

  const calculateResult = () => {
    try {
      const res = evaluate(input.reduce((text, item) => text + item, ''));
      setResult(res);
    } catch (e) {
      if (e instanceof SyntaxError) {
        console.log("syntax error:", e.message);
        setResultText('Syntax ERR');
      } else {
        console.log("error: ", e.message);
        setResultText('Intrnl ERR');
      }
      setMode('error');
    }
  }

  const handleKeyPress = (e) => {
    const key = e.code;
    const keyMap = {
      Digit0: '0',
      Digit1: '1',
      Digit2: '2',
      Digit3: '3',
      Digit4: '4',
      Digit5: '5',
      Digit6: '6',
      Digit7: '7',
      Digit8: '8',
      Digit9: '9',
      Backspace: 'DEL',
      ArrowLeft: 'leftArrow',
      ArrowRight: 'rightArrow',
    };
    const button = keyMap[key];
    if (button !== undefined)
      handleButtonPress(button);
  };

  const inputItem = (item) => {
    const copy = [...input];
    copy.splice(cursorPosition, 1, item);
    setInput(copy);
    setCursorPosition(cursorPosition + 1);
  };

  const handleButtonPress = (button) => {
    if ('0123456789+-/*.()'.split('').includes(button)) {
      inputItem(button);
    } else if (button === 'DEL') {
      if (input.length > 0) {
        const newInput = input.slice(0, -1);
        const newCursorPosition = newInput.reduce((len, item) => len + item.length, 0);
        setInput(newInput);
        setCursorPosition(newCursorPosition);
      }
    } else if (button === 'shift') {
      setShiftEnabled(!shiftEnabled);
    } else if (button === 'hyp') {
      setHypEnabled(!hypEnabled);
    } else if (button === 'AC') {
      if (shiftEnabled) {
        setMode('disabled');
      } else {
        if (mode === 'error') {
          setMode('enabled');
          setResultText('0.');
        }
        setInput([]);
        setCursorPosition(0);
        startCursorBlinking();
      }
    } else if (button === 'ON') {
      reset();
    } else if (button === '=') {
      calculateResult();
      stopCursorBlinking();
    } else if (['sin', 'cos', 'tan'].includes(button)) {
      const item = hypEnabled ? (button + 'h ') : (button + ' ');
      inputItem(item);
    } else if (['ln', 'log'].includes(button)) {
      inputItem(button + ' ');
    } else if (button === 'leftArrow') {
      if (cursorPosition > 0)
        setCursorPosition(cursorPosition - 1);
    } else if (button === 'rightArrow') {
      if (cursorPosition < input.length)
        setCursorPosition(cursorPosition + 1);
    } else {
      console.error(`unhandled button '${button}'`);
    }
    if (button !== 'hyp' && button !== 'shift') {
      setHypEnabled(false);
      setShiftEnabled(false);
    }
    if (button != '=')
      startCursorBlinking();
  };

  const indicators = {
    shift: shiftEnabled,
    hyp: hypEnabled,
  };

  return (
    <div className="calculator">
      <div className="label">
        <span className="vendor">CASSIO</span>
        <span className="model">fx-228 PLUS</span>
      </div>
      <Screen mode={mode}
              input={input}
              resultText={resultText}
              indicators={indicators}
              exponentValue={exponentValue}
              cursorPosition={cursorPosition}
              cursorVisible={cursorVisible}/>
      <Controls onPress={handleButtonPress} />
    </div>
  );
};

const App = () => {
  return (
    <div className="container">
      <Calculator />
    </div>
  );
};

export default App;
