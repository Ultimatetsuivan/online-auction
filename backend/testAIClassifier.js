const categoryClassifier = require('./utils/aiCategoryClassifier');

// Test cases
const tests = [
  { title: 'Toyota Prius 2020', description: 'Clean car, low mileage' },
  { title: '2021 Honda Civic', description: 'Sedan, automatic transmission' },
  { title: 'Brake pads for Toyota', description: 'OEM brake pads' },
  { title: 'Car seat cover', description: 'Leather seat covers for car' },
  { title: 'Yamaha R1 motorcycle', description: 'Sport bike' },
  { title: 'Mountain bicycle', description: 'Trek mountain bike' }
];

console.log('🧪 Testing AI Category Classifier\n');

tests.forEach((test, index) => {
  console.log(`Test ${index + 1}: "${test.title}"`);
  const result = categoryClassifier.classify(test.title, test.description);
  console.log(`✅ Suggested: ${result.category}`);
  console.log(`   Confidence: ${result.confidence.toFixed(1)}%`);
  console.log(`   Keywords: ${result.matchedKeywords.slice(0, 3).join(', ')}`);
  if (result.parent) {
    console.log(`   Parent: ${result.parent}`);
  }
  console.log('');
});
