export function decomposeFloat(number, precision = undefined) {
  const match = number.toPrecision(precision).match(/^([+-]?)([0-9.]+)(e([+-]?)(.*))?/);
  if (!match)
    throw new Error(`invalid number '${number}'`);
  const sign = match[1] === '-' ? '-' : '+';
  /* replace strips insignificant trailing zeros */
  const base = match[2].replace(/([.][1-9]*)0+$/, '$1').replace(/[.]$/, '');
  const exponentSign = match[4] === '-' ? '-' : '+';
  const exponent = match[5] ?? 0;
  const baseValue = (sign === '+') ? base : -base;
  const exponentValue = (exponentSign === '+') ? exponent : -exponent;
  return { sign, base, exponent, exponentSign, baseValue, exponentValue };
}
