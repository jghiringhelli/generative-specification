module.exports = function reverseString(s) {
  if (typeof s !== 'string') {
    throw new Error('Input must be a string');
  }
  return s.split('').reverse().join('');
};