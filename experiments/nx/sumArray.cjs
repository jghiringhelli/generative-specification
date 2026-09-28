function sumArray(nums) {
  if (!Array.isArray(nums)) {
    return 0;
  }
  return nums.reduce((sum, num) => sum + num, 0);
}

module.exports = sumArray;
