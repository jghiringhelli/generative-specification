function reverseString(s) {
  if (s == null) {
    return '';
  }

  if (typeof s !== 'string') {
    s = String(s);
  }

  return Array.from(s).reverse().join('');
}

module.exports = reverseString;
