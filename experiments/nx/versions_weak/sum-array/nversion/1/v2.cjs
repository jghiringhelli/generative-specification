module.exports = function sumArray(nums) {
  if (!Array.isArray(nums)) {
    throw new Error('Input must be an array');
  }
  if (nums.length === 0) {
    return 0;
  }
  return nums.reduce((acc, num) => {
    if (typeof num !== 'number' || !Number.isInteger(num)) {
      throw new Error('All elements in the array must be integers');
    }
    return acc + num;
  }, 0);
};