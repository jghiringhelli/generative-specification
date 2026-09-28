module.exports = function sumArray(nums) {
  if (!nums || nums.length === 0) {
    return 0;
  }
  return nums.reduce((acc, num) => acc + num, 0);
};