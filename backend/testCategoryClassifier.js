/**
 * Test script for AI Category Classifier
 * Tests the improved priority-based classification system
 */

const categoryClassifier = require('./utils/aiCategoryClassifier');

console.log('=== AI Category Classifier Test ===\n');

// Test cases
const testCases = [
  {
    title: 'iPhone 13 Pro 128GB',
    description: 'Brand new, sealed, unlocked',
    expectedCategory: 'Electronics'
  },
  {
    title: 'iPhone 13 Car Mount Holder',
    description: 'Universal phone holder for car dashboard',
    expectedCategory: 'Electronics' // iPhone is strong keyword, should override "car"
  },
  {
    title: '2023 Toyota Prius Hybrid',
    description: 'Low mileage, excellent condition',
    expectedCategory: 'Automotive'
  },
  {
    title: 'Car Phone Charger for iPhone',
    description: 'Fast charging cable for vehicles',
    expectedCategory: 'Electronics' // iPhone is stronger than car accessories
  },
  {
    title: 'Samsung Galaxy S23',
    description: 'Android smartphone',
    expectedCategory: 'Electronics'
  },
  {
    title: 'Nike Air Max Shoes',
    description: 'Athletic sneakers, size 10',
    expectedCategory: 'Fashion'
  },
  {
    title: 'MacBook Pro 14 inch',
    description: 'M2 chip, 16GB RAM',
    expectedCategory: 'Electronics'
  },
  {
    title: 'Honda Civic 2022',
    description: 'Low mileage, clean title',
    expectedCategory: 'Automotive'
  },
  {
    title: 'PlayStation 5 Console',
    description: 'Gaming console with controller',
    expectedCategory: 'Electronics'
  },
  {
    title: 'Leather Jacket',
    description: 'Vintage style, size M',
    expectedCategory: 'Fashion'
  }
];

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}: "${testCase.title}"`);

  const result = categoryClassifier.classify(testCase.title, testCase.description);

  const isCorrect = result.category === testCase.expectedCategory;

  if (isCorrect) {
    console.log(`✅ PASS - Classified as: ${result.category} (${Math.round(result.confidence)}% confidence)`);
    passed++;
  } else {
    console.log(`❌ FAIL - Expected: ${testCase.expectedCategory}, Got: ${result.category} (${Math.round(result.confidence)}% confidence)`);
    console.log(`   Matched keywords: ${result.matchedKeywords.join(', ')}`);
    failed++;
  }

  // Show top 3 suggestions
  console.log(`   Top suggestions:`);
  result.suggestions.forEach((s, i) => {
    console.log(`   ${i + 1}. ${s.category} (${Math.round(s.confidence)}%)`);
  });

  console.log('');
});

console.log('=== Test Summary ===');
console.log(`Total: ${testCases.length}`);
console.log(`Passed: ${passed} ✅`);
console.log(`Failed: ${failed} ❌`);
console.log(`Success Rate: ${Math.round((passed / testCases.length) * 100)}%`);
