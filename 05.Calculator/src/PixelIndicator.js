import encoding from './pixelEncoding.js';

/* pixels - bit string of pixels
 * ' ' => disabled pixel
 * 'x' => enabled pixel
 */
export const RawPixelIndicator = ({pixels}) => {
  const rowCount = 6;
  const columnCount = 5;
  const rectSize = 8;
  const gap = 1;
  const svgWidth = columnCount * (rectSize + gap) - gap;
  const svgHeight = rowCount * (rectSize + gap) - gap;

  const rects = [];
  for (let i = 0; i < rowCount; ++i) {
    for (let j = 0; j < columnCount; ++j) {
      const idx = i * columnCount + j;
      rects.push(
        <rect key={idx} className={(pixels[idx] === 'x') ? 'svg-visible' : 'svg-invisible'}
              x={j * (rectSize + gap)} y={i * (rectSize + gap)} width={rectSize} height={rectSize} />
      );
    }
  }

  return (
    <svg className="pixel-indicator" version="1.0" xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 ${svgWidth} ${svgHeight}`} height="100%">
      {rects}
    </svg>
  );
};

export const PixelIndicator = ({symbol = ' '}) => {
  const pixels = encoding[symbol] ?? encoding['?'];
  return (
    <RawPixelIndicator pixels={pixels} />
  );
}

/* text - either string or array of symbols */
export const PixelIndicatorLine = ({text = "", indicatorCount}) => {
  const segments = [];
  const visibleText = text.slice(-indicatorCount);
  for (let i = 0; i < indicatorCount; ++i) {
    segments.push(
      <PixelIndicator key={i} symbol={visibleText[i] ?? ' '} />
    );
  }
  return (
    <div className="pixel-indicator-line">{segments}</div>
  );
};
