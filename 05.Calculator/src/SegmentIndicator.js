const encoding = {
  '0': [1, 1, 1, 1, 1, 1, 0],
  '1': [0, 1, 1, 0, 0, 0, 0],
  '2': [1, 1, 0, 1, 1, 0, 1],
  '3': [1, 1, 1, 1, 0, 0, 1],
  '4': [0, 1, 1, 0, 0, 1, 1],
  '5': [1, 0, 1, 1, 0, 1, 1],
  '6': [1, 0, 1, 1, 1, 1, 1],
  '7': [1, 1, 1, 0, 0, 1, 0],
  '8': [1, 1, 1, 1, 1, 1, 1],
  '9': [1, 1, 1, 1, 0, 1, 1],
  '-': [0, 0, 0, 0, 0, 0, 1],
  ' ': [0, 0, 0, 0, 0, 0, 0],
};

export const RawSegmentIndicator = ({bars, dot=false, comma=false}) => {
  return (
    <svg className="segment-indicator" version="1.0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 58 100" height="100%">
      <path className={bars[0] ? 'svg-visible' : 'svg-invisible'} d="M40.5,12.2l5.9-9.6L17.5,2.8c-1.4,0.1-2.3,0.7-3.2,1.4s-1.7,1.9-1.7,1.9l10.1,6L40.5,12.2z"/>
      <path className={bars[1] ? 'svg-visible' : 'svg-invisible'} d="M42,12.8l6-10.1c1.8,1.2,3,3.3,3.4,4.1c0,0,1.2,2.6,1,5l0,0l-2.7,24.5c-0.3,2.3-3.3,5.8-5.4,7l0,0L39,37.8L42,12.8z"/>
      <path className={bars[2] ? 'svg-visible' : 'svg-invisible'} d="M36.6,50.8l7.5-5.7c0,0,1.7,1.4,2.5,2.9c1,2,1,4.5,0.8,5.4l-2.9,25.1c-0.4,4.9-5.2,7.5-5.2,7.5l-5.2-10.5L36.6,50.8z"/>
      <path className={bars[3] ? 'svg-visible' : 'svg-invisible'} d="M32.6,76.2L14.5,76L3.7,79.6c0,0,2.6,6.7,8.6,6.9l25.1-0.2L32.6,76.2z"/>
      <path className={bars[4] ? 'svg-visible' : 'svg-invisible'} d="M12.9,45.6l4.1,5l-3.7,23.9l-9.6,3.2L6,52.2c0-1,0.9-2.8,2.4-4C10.2,46.8,12.9,45.6,12.9,45.6z"/>
      <path className={bars[5] ? 'svg-visible' : 'svg-invisible'} d="M11.9,7.4l9.8,5.9l-3.2,25.3l-5.8,5c0,0-1.3-0.8-2-1.4c-0.8-0.7-2.2-3.5-2-4.8L11.9,7.4z"/>
      <polygon className={bars[6] ? 'svg-visible' : 'svg-invisible'} points="14.1,44.6 20.3,39.1 37.6,38.8 42.8,44.3 35.4,49.6 18.4,49.6 "/>
      <circle className={(dot || comma) ? 'svg-visible' : 'svg-invisible'} cx="50.9" cy="86.5" r="4.1"/>
      <path className={comma ? 'svg-visible' : 'svg-invisible'} d="M44.2,97.9c0-0.2,0.8-0.3,2.8-1.9c1.3-1.1,2.1-2.5,2.5-3.6c2.4-0.1,0,0,2.4-0.1c-0.3,0.9-0.9,3-2.8,4.3C46.3,98.6,44.3,98.2,44.2,97.9z"/>
    </svg>
  );
};

export const SegmentIndicator = ({symbol=' ', dot=false, comma=false}) => {
  const bars = encoding[symbol] ?? encoding['-'];
  return (
    <RawSegmentIndicator bars={bars} dot={dot} comma={comma}/>
  );
};

/* text - string | array of symbols */
export const SegmentIndicatorLine = ({text, indicatorCount}) => {
  const symbols = []; /* [{symbol, dot, comma}, ...] */
  for (let i = 0; i < text.length; ++i) {
    const ch = text[i];
    if (ch === '.')
      symbols[symbols.length - 1].dot = true;
    else if (ch === ',')
      symbols[symbols.length - 1].comma = true;
    else
      symbols.push({ symbol: ch });
  }
  const visibleSymbols = symbols.slice(-indicatorCount);
  const offset = indicatorCount - visibleSymbols.length;
  const segments = [];

  for (let i = 0; i < offset; ++i)
    segments.push(<SegmentIndicator key={i} />);
  for (let i = 0; i < visibleSymbols.length; ++i) {
    segments.push(
      <SegmentIndicator key={offset + i} symbol={visibleSymbols[i].symbol}
                        dot={visibleSymbols[i].dot} comma={visibleSymbols[i].comma}/>
    );
  }
  return (
    <div className="segment-indicator-line">{segments}</div>
  )
};
