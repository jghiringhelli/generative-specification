module.exports = function sumArray(nums) {
  return nums.reduce((acc, num) => acc + num, 0);
};