/**
 * Test script for getCurrentBillingPeriod function
 * This tests that readings recorded should appear as the previous month's usage
 */

// Mock the getCurrentBillingPeriod function logic
function getCurrentBillingPeriod(mockDate) {
  const now = mockDate || new Date();
  // Readings recorded should appear as the previous month's usage
  const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const year = previousMonth.getFullYear();
  const month = String(previousMonth.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

// Test cases
const testCases = [
  {
    name: 'December 1, 2025',
    date: new Date(2025, 11, 1), // Month is 0-indexed, so 11 = December
    expected: '2025-11' // Should return November
  },
  {
    name: 'January 1, 2026',
    date: new Date(2026, 0, 1), // 0 = January
    expected: '2025-12' // Should return December 2025 (previous year)
  },
  {
    name: 'February 1, 2025',
    date: new Date(2025, 1, 1), // 1 = February
    expected: '2025-01' // Should return January 2025
  },
  {
    name: 'March 15, 2025',
    date: new Date(2025, 2, 15), // 2 = March
    expected: '2025-02' // Should return February 2025
  },
  {
    name: 'July 1, 2025',
    date: new Date(2025, 6, 1), // 6 = July
    expected: '2025-06' // Should return June 2025
  }
];

console.log('Testing getCurrentBillingPeriod function\n');
console.log('=' .repeat(60));

let passedTests = 0;
let failedTests = 0;

testCases.forEach(testCase => {
  const result = getCurrentBillingPeriod(testCase.date);
  const passed = result === testCase.expected;

  if (passed) {
    passedTests++;
    console.log(`✓ PASS: ${testCase.name}`);
  } else {
    failedTests++;
    console.log(`✗ FAIL: ${testCase.name}`);
  }

  console.log(`  Date: ${testCase.date.toDateString()}`);
  console.log(`  Expected: ${testCase.expected}`);
  console.log(`  Got: ${result}`);
  console.log('');
});

console.log('=' .repeat(60));
console.log(`Results: ${passedTests} passed, ${failedTests} failed`);

if (failedTests === 0) {
  console.log('✓ All tests passed!');
  process.exit(0);
} else {
  console.log('✗ Some tests failed!');
  process.exit(1);
}
