// Standalone verification of reading time calculation
function calculateReadingTime(body) {
  const words = body.trim().split(/\s+/).filter(word => word.length > 0);
  return Math.ceil(words.length / 200);
}

console.log('Reading Time Calculation Verification\n');

// Test case 1: Short text (3 words)
const test1 = 'one two three';
const result1 = calculateReadingTime(test1);
console.log(`Test 1 - "${test1}"`);
console.log(`Words: 3, Expected: 1, Got: ${result1}, ${result1 === 1 ? '✓' : '✗'}\n`);

// Test case 2: Exactly 200 words
const test2 = Array(200).fill('word').join(' ');
const result2 = calculateReadingTime(test2);
console.log(`Test 2 - Exactly 200 words`);
console.log(`Words: 200, Expected: 1, Got: ${result2}, ${result2 === 1 ? '✓' : '✗'}\n`);

// Test case 3: 201 words
const test3 = Array(201).fill('word').join(' ');
const result3 = calculateReadingTime(test3);
console.log(`Test 3 - 201 words`);
console.log(`Words: 201, Expected: 2, Got: ${result3}, ${result3 === 2 ? '✓' : '✗'}\n`);

// Test case 4: 600 words
const test4 = Array(600).fill('word').join(' ');
const result4 = calculateReadingTime(test4);
console.log(`Test 4 - 600 words`);
console.log(`Words: 600, Expected: 3, Got: ${result4}, ${result4 === 3 ? '✓' : '✗'}\n`);

// Test case 5: Empty string
const test5 = '';
const result5 = calculateReadingTime(test5);
console.log(`Test 5 - Empty string`);
console.log(`Words: 0, Expected: 0, Got: ${result5}, ${result5 === 0 ? '✓' : '✗'}\n`);

// Test case 6: Multiple whitespace
const test6 = 'one  two   three\n\tfour';
const result6 = calculateReadingTime(test6);
console.log(`Test 6 - Multiple whitespace characters`);
console.log(`Words: 4, Expected: 1, Got: ${result6}, ${result6 === 1 ? '✓' : '✗'}\n`);

const allPassed = result1 === 1 && result2 === 1 && result3 === 2 && result4 === 3 && result5 === 0 && result6 === 1;
console.log(allPassed ? '✓ All tests passed!' : '✗ Some tests failed');
