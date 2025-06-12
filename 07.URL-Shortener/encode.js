/* Encode a number as a string
 * All letters in the string are different if possible.
 * There is approximately factorial(letters.length) encodings with
 * different letters. This should suffice for real use cases
 */
export default function encode(id, minLength = 6) {
  const letters = "wifmahtnxcoejrybgpzkvludqs";
  let encoding = "";
  for (let i = 0; i < minLength || id > 0; ++i) {
    let letterIdx = id % letters.length;
    for (let j = 0; encoding.includes(letters[letterIdx]) && j < letters.length; ++j) {
      ++letterIdx;
      if (letterIdx == letters.length)
        letterIdx = 0;
    }
    encoding += letters[letterIdx];
    id = Math.floor(id / letters.length);
  }
  return encoding;
}
