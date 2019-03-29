function toDashCase(str) {
  let lastCharIsSpace = false;
  let newStr = '';
  for(const char of str) {
    if (char === ' ') {
      if (lastCharIsSpace) {
        continue;
      } else {
        newStr += '-';
      }
      lastCharIsSpace = true;
    } else {
      newStr += char;
      lastCharIsSpace = false;
    }
  }
  return newStr
}

module.exports = {
  toDashCase
};
