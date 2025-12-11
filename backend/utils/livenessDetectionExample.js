/**
 * Practical Example: Integrating Liveness Detection
 * with Real Identity Verification System
 */

const {
  generateTestCardMotionFrames,
  generateSpoofedCardMotion,
  analyzeLiveness
} = require('./idCardLivenessSimulator');

// ==================== EXAMPLE 1: Basic Testing ====================

console.log('='.repeat(70));
console.log('EXAMPLE 1: Basic Liveness Detection Testing');
console.log('='.repeat(70));

// Simulate user holding ID card and moving it
const userMotion = generateTestCardMotionFrames({
  duration: 3,
  fps: 15,
  includeHologram: true,
  includeNoise: true,
  motionPattern: 'complete'
});

console.log(`\nGenerated ${userMotion.length} frames from 3-second video`);

// Analyze the motion
const result = analyzeLiveness(userMotion);

console.log('\nAnalysis Result:');
console.log(`  Is Live: ${result.isLive ? '✅ YES' : '❌ NO'}`);
console.log(`  Confidence: ${(result.confidence * 100).toFixed(1)}%`);
console.log(`  Score: ${result.score}/${result.maxScore}`);
console.log(`  Recommendation: ${result.recommendation}`);

console.log('\nDetailed Analysis:');
console.log(`  Depth Variation: ${result.analysis.depthVariation.toFixed(3)}`);
console.log(`  Hologram Presence: ${result.analysis.hologramPresence.toFixed(3)}`);
console.log(`  Motion Consistency: ${result.analysis.motionConsistency.toFixed(3)}`);
console.log(`  Lighting Variation: ${result.analysis.lightingVariation.toFixed(3)}`);

// ==================== EXAMPLE 2: Attack Detection ====================

console.log('\n\n' + '='.repeat(70));
console.log('EXAMPLE 2: Detecting Different Attack Types');
console.log('='.repeat(70));

const attacks = ['paper', 'screen', 'photo'];

attacks.forEach(attackType => {
  const spoofedMotion = generateSpoofedCardMotion(attackType);
  const spoofResult = analyzeLiveness(spoofedMotion);

  console.log(`\n${attackType.toUpperCase()} ATTACK:`);
  console.log(`  Detected as Live: ${spoofResult.isLive ? '❌ FALSE POSITIVE' : '✅ CORRECTLY REJECTED'}`);
  console.log(`  Confidence: ${(spoofResult.confidence * 100).toFixed(1)}%`);
  console.log(`  Depth Variation: ${spoofResult.analysis.depthVariation.toFixed(3)} (real > 0.5)`);
  console.log(`  Hologram Presence: ${spoofResult.analysis.hologramPresence.toFixed(3)} (real > 0.4)`);
});

// ==================== EXAMPLE 3: Custom Detection Logic ====================

console.log('\n\n' + '='.repeat(70));
console.log('EXAMPLE 3: Custom Multi-Layer Detection');
console.log('='.repeat(70));

function advancedLivenessDetection(frames) {
  // Layer 1: Depth Analysis
  const depths = frames.map(f => f.depth.depthConfidence);
  const maxDepth = Math.max(...depths);
  const minDepth = Math.min(...depths);
  const depthRange = maxDepth - minDepth;

  const depthPass = depthRange > 0.4;
  console.log(`\nLayer 1 - Depth Analysis: ${depthPass ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Depth Range: ${depthRange.toFixed(3)} (need > 0.4)`);

  // Layer 2: Hologram Detection
  const hologramIntensities = frames.map(f => f.reflectivity.intensity);
  const avgHologram = hologramIntensities.reduce((a, b) => a + b, 0) / frames.length;
  const maxHologram = Math.max(...hologramIntensities);

  const hologramPass = avgHologram > 0.3 && maxHologram > 0.5;
  console.log(`\nLayer 2 - Hologram Detection: ${hologramPass ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Average Intensity: ${avgHologram.toFixed(3)} (need > 0.3)`);
  console.log(`  Max Intensity: ${maxHologram.toFixed(3)} (need > 0.5)`);

  // Layer 3: Motion Naturalness
  let smoothTransitions = 0;
  for (let i = 1; i < frames.length; i++) {
    const angleDiff = Math.abs(frames[i].angleY - frames[i-1].angleY);
    if (angleDiff > 0 && angleDiff < 15) smoothTransitions++;
  }
  const smoothnessRatio = smoothTransitions / (frames.length - 1);

  const motionPass = smoothnessRatio > 0.5;
  console.log(`\nLayer 3 - Motion Naturalness: ${motionPass ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Smoothness Ratio: ${smoothnessRatio.toFixed(3)} (need > 0.5)`);

  // Layer 4: Lighting Variation
  const lightingValues = frames.map(f => f.lighting);
  const lightingVariation = Math.max(...lightingValues) - Math.min(...lightingValues);

  const lightingPass = lightingVariation > 0.1;
  console.log(`\nLayer 4 - Lighting Variation: ${lightingPass ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Variation: ${lightingVariation.toFixed(3)} (need > 0.1)`);

  // Final Decision
  const passedLayers = [depthPass, hologramPass, motionPass, lightingPass].filter(Boolean).length;
  const totalLayers = 4;

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`FINAL RESULT: ${passedLayers}/${totalLayers} layers passed`);

  const isAuthentic = passedLayers >= 3; // Need 3/4 layers
  console.log(`Decision: ${isAuthentic ? '✅ AUTHENTIC ID CARD' : '❌ LIKELY SPOOF'}`);

  return {
    isAuthentic,
    passedLayers,
    totalLayers,
    confidence: passedLayers / totalLayers
  };
}

// Test on authentic card
console.log('\nTesting AUTHENTIC card:');
const authenticFrames = generateTestCardMotionFrames();
advancedLivenessDetection(authenticFrames);

// Test on paper spoof
console.log('\n\nTesting PAPER SPOOF:');
const paperSpoof = generateSpoofedCardMotion('paper');
advancedLivenessDetection(paperSpoof);

// ==================== EXAMPLE 4: Performance Testing ====================

console.log('\n\n' + '='.repeat(70));
console.log('EXAMPLE 4: Performance Benchmarking');
console.log('='.repeat(70));

function benchmarkPerformance() {
  const configs = [
    { duration: 2, fps: 10, name: 'Low Quality (Mobile)' },
    { duration: 3, fps: 15, name: 'Medium Quality (Standard)' },
    { duration: 3, fps: 30, name: 'High Quality (Desktop)' },
  ];

  configs.forEach(config => {
    const start = Date.now();

    const frames = generateTestCardMotionFrames({
      duration: config.duration,
      fps: config.fps
    });

    const analysis = analyzeLiveness(frames);

    const elapsed = Date.now() - start;
    const framesGenerated = frames.length;

    console.log(`\n${config.name}:`);
    console.log(`  Frames: ${framesGenerated}`);
    console.log(`  Time: ${elapsed}ms`);
    console.log(`  FPS Processing: ${(framesGenerated / (elapsed / 1000)).toFixed(1)} fps`);
    console.log(`  Result: ${analysis.isLive ? 'Live' : 'Not Live'} (${(analysis.confidence * 100).toFixed(1)}%)`);
  });
}

benchmarkPerformance();

// ==================== EXAMPLE 5: Statistical Analysis ====================

console.log('\n\n' + '='.repeat(70));
console.log('EXAMPLE 5: Statistical Analysis (100 samples)');
console.log('='.repeat(70));

function runStatisticalAnalysis() {
  const numSamples = 100;

  // Test authentic cards
  let authenticCorrect = 0;
  for (let i = 0; i < numSamples; i++) {
    const frames = generateTestCardMotionFrames();
    const result = analyzeLiveness(frames);
    if (result.isLive) authenticCorrect++;
  }

  // Test paper spoofs
  let paperDetected = 0;
  for (let i = 0; i < numSamples; i++) {
    const frames = generateSpoofedCardMotion('paper');
    const result = analyzeLiveness(frames);
    if (!result.isLive) paperDetected++;
  }

  // Test screen spoofs
  let screenDetected = 0;
  for (let i = 0; i < numSamples; i++) {
    const frames = generateSpoofedCardMotion('screen');
    const result = analyzeLiveness(frames);
    if (!result.isLive) screenDetected++;
  }

  console.log('\nResults:');
  console.log(`\nAuthentic Cards:`);
  console.log(`  Correctly Identified: ${authenticCorrect}/${numSamples} (${(authenticCorrect/numSamples*100).toFixed(1)}%)`);
  console.log(`  False Negatives: ${numSamples - authenticCorrect}/${numSamples} (${((numSamples-authenticCorrect)/numSamples*100).toFixed(1)}%)`);

  console.log(`\nPaper Spoofs:`);
  console.log(`  Correctly Detected: ${paperDetected}/${numSamples} (${(paperDetected/numSamples*100).toFixed(1)}%)`);
  console.log(`  False Positives: ${numSamples - paperDetected}/${numSamples} (${((numSamples-paperDetected)/numSamples*100).toFixed(1)}%)`);

  console.log(`\nScreen Spoofs:`);
  console.log(`  Correctly Detected: ${screenDetected}/${numSamples} (${(screenDetected/numSamples*100).toFixed(1)}%)`);
  console.log(`  False Positives: ${numSamples - screenDetected}/${numSamples} (${((numSamples-screenDetected)/numSamples*100).toFixed(1)}%)`);

  const overallAccuracy = (authenticCorrect + paperDetected + screenDetected) / (numSamples * 3) * 100;
  console.log(`\nOverall Accuracy: ${overallAccuracy.toFixed(1)}%`);
}

runStatisticalAnalysis();

// ==================== EXAMPLE 6: Integration with API ====================

console.log('\n\n' + '='.repeat(70));
console.log('EXAMPLE 6: API Integration Example');
console.log('='.repeat(70));

/**
 * Simulated API endpoint handler
 * In real use, this would be called from your Express route
 */
async function handleVerificationRequest(videoFrames) {
  console.log('\n📹 Received verification request with', videoFrames.length, 'frames');

  // In production, videoFrames would come from camera
  // For testing, we simulate it
  const testFrames = generateTestCardMotionFrames({
    duration: videoFrames.length / 15,
    fps: 15
  });

  console.log('⚙️  Analyzing motion patterns...');
  const result = analyzeLiveness(testFrames);

  console.log('✅ Analysis complete');

  // Prepare API response
  const response = {
    success: true,
    data: {
      isLive: result.isLive,
      confidence: result.confidence,
      requiresManualReview: result.confidence < 0.8 && result.confidence > 0.4,
      analysis: {
        depthDetection: result.analysis.depthVariation > 0.5 ? 'PASS' : 'FAIL',
        hologramDetection: result.analysis.hologramPresence > 0.4 ? 'PASS' : 'FAIL',
        motionAnalysis: result.analysis.motionConsistency > 0.7 ? 'PASS' : 'FAIL',
        lightingAnalysis: result.analysis.lightingVariation > 0.15 ? 'PASS' : 'FAIL'
      },
      recommendation: result.recommendation
    }
  };

  console.log('\n📤 API Response:');
  console.log(JSON.stringify(response, null, 2));

  return response;
}

// Simulate API call
handleVerificationRequest(new Array(45)); // 45 frames

console.log('\n\n' + '='.repeat(70));
console.log('Examples Complete! ✅');
console.log('='.repeat(70));
console.log('\nNext Steps:');
console.log('1. Review the LIVENESS_DETECTION_GUIDE.md for full documentation');
console.log('2. Run the unit tests: node idCardLivenessSimulator.test.js');
console.log('3. Integrate with your camera capture system');
console.log('4. Tune thresholds based on your specific requirements');
console.log('='.repeat(70));
