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


// Simulate user holding ID card and moving it
const userMotion = generateTestCardMotionFrames({
  duration: 3,
  fps: 15,
  includeHologram: true,
  includeNoise: true,
  motionPattern: 'complete'
});


// Analyze the motion
const result = analyzeLiveness(userMotion);



// ==================== EXAMPLE 2: Attack Detection ====================


const attacks = ['paper', 'screen', 'photo'];

attacks.forEach(attackType => {
  const spoofedMotion = generateSpoofedCardMotion(attackType);
  const spoofResult = analyzeLiveness(spoofedMotion);

});

// ==================== EXAMPLE 3: Custom Detection Logic ====================


function advancedLivenessDetection(frames) {
  // Layer 1: Depth Analysis
  const depths = frames.map(f => f.depth.depthConfidence);
  const maxDepth = Math.max(...depths);
  const minDepth = Math.min(...depths);
  const depthRange = maxDepth - minDepth;

  const depthPass = depthRange > 0.4;

  // Layer 2: Hologram Detection
  const hologramIntensities = frames.map(f => f.reflectivity.intensity);
  const avgHologram = hologramIntensities.reduce((a, b) => a + b, 0) / frames.length;
  const maxHologram = Math.max(...hologramIntensities);

  const hologramPass = avgHologram > 0.3 && maxHologram > 0.5;

  // Layer 3: Motion Naturalness
  let smoothTransitions = 0;
  for (let i = 1; i < frames.length; i++) {
    const angleDiff = Math.abs(frames[i].angleY - frames[i-1].angleY);
    if (angleDiff > 0 && angleDiff < 15) smoothTransitions++;
  }
  const smoothnessRatio = smoothTransitions / (frames.length - 1);

  const motionPass = smoothnessRatio > 0.5;

  // Layer 4: Lighting Variation
  const lightingValues = frames.map(f => f.lighting);
  const lightingVariation = Math.max(...lightingValues) - Math.min(...lightingValues);

  const lightingPass = lightingVariation > 0.1;

  // Final Decision
  const passedLayers = [depthPass, hologramPass, motionPass, lightingPass].filter(Boolean).length;
  const totalLayers = 4;


  const isAuthentic = passedLayers >= 3; // Need 3/4 layers

  return {
    isAuthentic,
    passedLayers,
    totalLayers,
    confidence: passedLayers / totalLayers
  };
}

// Test on authentic card
const authenticFrames = generateTestCardMotionFrames();
advancedLivenessDetection(authenticFrames);

// Test on paper spoof
const paperSpoof = generateSpoofedCardMotion('paper');
advancedLivenessDetection(paperSpoof);

// ==================== EXAMPLE 4: Performance Testing ====================


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

  });
}

benchmarkPerformance();

// ==================== EXAMPLE 5: Statistical Analysis ====================


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




  const overallAccuracy = (authenticCorrect + paperDetected + screenDetected) / (numSamples * 3) * 100;
}

runStatisticalAnalysis();

// ==================== EXAMPLE 6: Integration with API ====================


/**
 * Simulated API endpoint handler
 * In real use, this would be called from your Express route
 */
async function handleVerificationRequest(videoFrames) {

  // In production, videoFrames would come from camera
  // For testing, we simulate it
  const testFrames = generateTestCardMotionFrames({
    duration: videoFrames.length / 15,
    fps: 15
  });

  const result = analyzeLiveness(testFrames);


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


  return response;
}

// Simulate API call
handleVerificationRequest(new Array(45)); // 45 frames

