/**
 * Unit Tests for ID Card Liveness Detection Simulator
 *
 * Run with: node idCardLivenessSimulator.test.js
 */

const {
  generateTestCardMotionFrames,
  generateSpoofedCardMotion,
  analyzeLiveness
} = require('./idCardLivenessSimulator');

// Simple test framework
class TestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(name, fn) {
    this.tests.push({ name, fn });
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(message || 'Assertion failed');
    }
  }

  assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(
        `${message || 'Assertion failed'}: expected ${expected}, got ${actual}`
      );
    }
  }

  assertGreaterThan(actual, threshold, message) {
    if (actual <= threshold) {
      throw new Error(
        `${message || 'Assertion failed'}: expected > ${threshold}, got ${actual}`
      );
    }
  }

  assertLessThan(actual, threshold, message) {
    if (actual >= threshold) {
      throw new Error(
        `${message || 'Assertion failed'}: expected < ${threshold}, got ${actual}`
      );
    }
  }

  async run() {
    console.log('🧪 Running ID Card Liveness Detection Tests...\n');

    for (const test of this.tests) {
      try {
        await test.fn();
        console.log(`✅ ${test.name}`);
        this.passed++;
      } catch (error) {
        console.log(`❌ ${test.name}`);
        console.log(`   Error: ${error.message}\n`);
        this.failed++;
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`Tests passed: ${this.passed}/${this.tests.length}`);
    console.log(`Tests failed: ${this.failed}/${this.tests.length}`);
    console.log('='.repeat(60));

    return this.failed === 0;
  }
}

const runner = new TestRunner();

// ==================== BASIC FUNCTIONALITY TESTS ====================

runner.test('Should generate correct number of frames', () => {
  const frames = generateTestCardMotionFrames({ duration: 3, fps: 15 });
  runner.assertEqual(frames.length, 45, 'Should generate 45 frames (3s × 15fps)');
});

runner.test('Should generate frames with all required properties', () => {
  const frames = generateTestCardMotionFrames({ duration: 1, fps: 10 });
  const frame = frames[0];

  runner.assert(typeof frame.timestamp === 'number', 'Should have timestamp');
  runner.assert(typeof frame.frameIndex === 'number', 'Should have frameIndex');
  runner.assert(typeof frame.angleX === 'number', 'Should have angleX');
  runner.assert(typeof frame.angleY === 'number', 'Should have angleY');
  runner.assert(typeof frame.rotationZ === 'number', 'Should have rotationZ');
  runner.assert(typeof frame.distance === 'number', 'Should have distance');
  runner.assert(typeof frame.lighting === 'number', 'Should have lighting');
  runner.assert(frame.reflectivity !== undefined, 'Should have reflectivity');
  runner.assert(frame.noise !== undefined, 'Should have noise');
  runner.assert(frame.depth !== undefined, 'Should have depth');
  runner.assert(frame.metadata !== undefined, 'Should have metadata');
});

runner.test('Should respect motion pattern option', () => {
  const tiltFrames = generateTestCardMotionFrames({
    duration: 1,
    fps: 10,
    motionPattern: 'tilt-only'
  });

  tiltFrames.forEach(frame => {
    runner.assertEqual(
      frame.metadata.motionPhase,
      'tilt',
      'All frames should be in tilt phase'
    );
  });
});

// ==================== MOTION CHARACTERISTICS TESTS ====================

runner.test('Should generate realistic angle ranges', () => {
  const frames = generateTestCardMotionFrames({ duration: 3, fps: 15 });

  const angles = frames.map(f => ({
    x: Math.abs(f.angleX),
    y: Math.abs(f.angleY),
    z: Math.abs(f.rotationZ)
  }));

  const maxAngleX = Math.max(...angles.map(a => a.x));
  const maxAngleY = Math.max(...angles.map(a => a.y));
  const maxAngleZ = Math.max(...angles.map(a => a.z));

  // Real human motion: angles typically within ±30°
  runner.assertLessThan(maxAngleX, 31, 'AngleX should be ≤ 30°');
  runner.assertLessThan(maxAngleY, 31, 'AngleY should be ≤ 30°');
  runner.assertLessThan(maxAngleZ, 16, 'AngleZ should be ≤ 15°');
});

runner.test('Should generate realistic distance variation', () => {
  const frames = generateTestCardMotionFrames({ duration: 3, fps: 15 });

  const distances = frames.map(f => f.distance);
  const minDistance = Math.min(...distances);
  const maxDistance = Math.max(...distances);

  // Distance should vary between 0.8 and 1.2
  runner.assertGreaterThan(minDistance, 0.79, 'Min distance should be ≥ 0.8');
  runner.assertLessThan(maxDistance, 1.21, 'Max distance should be ≤ 1.2');
});

runner.test('Should generate smooth motion (no jumps)', () => {
  const frames = generateTestCardMotionFrames({ duration: 2, fps: 15 });

  for (let i = 1; i < frames.length; i++) {
    const angleDiff = Math.abs(frames[i].angleY - frames[i-1].angleY);

    // Smooth human motion: angle changes < 20° per frame
    runner.assertLessThan(
      angleDiff,
      20,
      `Frame ${i}: angle change should be smooth`
    );
  }
});

// ==================== HOLOGRAM SIMULATION TESTS ====================

runner.test('Should generate hologram effects when enabled', () => {
  const frames = generateTestCardMotionFrames({
    duration: 2,
    fps: 15,
    includeHologram: true
  });

  const avgIntensity = frames.reduce((sum, f) =>
    sum + f.reflectivity.intensity, 0) / frames.length;

  runner.assertGreaterThan(
    avgIntensity,
    0.2,
    'Average hologram intensity should be > 0.2'
  );
});

runner.test('Should not generate hologram effects when disabled', () => {
  const frames = generateTestCardMotionFrames({
    duration: 2,
    fps: 15,
    includeHologram: false
  });

  frames.forEach((frame, i) => {
    runner.assertEqual(
      frame.reflectivity.intensity,
      0,
      `Frame ${i}: hologram intensity should be 0`
    );
  });
});

runner.test('Hologram intensity should correlate with angle', () => {
  const frames = generateTestCardMotionFrames({
    duration: 3,
    fps: 15,
    includeHologram: true
  });

  // When card is more tilted, hologram should be more visible
  const tiltedFrames = frames.filter(f =>
    Math.abs(f.angleX) > 15 || Math.abs(f.angleY) > 15
  );

  const flatFrames = frames.filter(f =>
    Math.abs(f.angleX) < 5 && Math.abs(f.angleY) < 5
  );

  if (tiltedFrames.length > 0 && flatFrames.length > 0) {
    const tiltedIntensity = tiltedFrames.reduce((sum, f) =>
      sum + f.reflectivity.intensity, 0) / tiltedFrames.length;

    const flatIntensity = flatFrames.reduce((sum, f) =>
      sum + f.reflectivity.intensity, 0) / flatFrames.length;

    runner.assertGreaterThan(
      tiltedIntensity,
      flatIntensity,
      'Tilted frames should have higher hologram intensity'
    );
  }
});

// ==================== DEPTH SIMULATION TESTS ====================

runner.test('Should generate depth information', () => {
  const frames = generateTestCardMotionFrames({ duration: 2, fps: 15 });

  frames.forEach((frame, i) => {
    runner.assert(
      frame.depth.cardThickness >= 0,
      `Frame ${i}: card thickness should be ≥ 0`
    );
    runner.assert(
      frame.depth.edgeShadow >= 0 && frame.depth.edgeShadow <= 1,
      `Frame ${i}: edge shadow should be 0-1`
    );
    runner.assert(
      frame.depth.depthConfidence >= 0 && frame.depth.depthConfidence <= 1,
      `Frame ${i}: depth confidence should be 0-1`
    );
  });
});

runner.test('Depth should increase with tilt angle', () => {
  const frames = generateTestCardMotionFrames({ duration: 3, fps: 15 });

  // More tilted = more depth visible
  const highlyTiltedFrames = frames.filter(f =>
    Math.abs(f.angleX) + Math.abs(f.angleY) > 20
  );

  const flatFrames = frames.filter(f =>
    Math.abs(f.angleX) + Math.abs(f.angleY) < 5
  );

  if (highlyTiltedFrames.length > 0 && flatFrames.length > 0) {
    const tiltedDepth = highlyTiltedFrames.reduce((sum, f) =>
      sum + f.depth.depthConfidence, 0) / highlyTiltedFrames.length;

    const flatDepth = flatFrames.reduce((sum, f) =>
      sum + f.depth.depthConfidence, 0) / flatFrames.length;

    runner.assertGreaterThan(
      tiltedDepth,
      flatDepth,
      'Tilted frames should have higher depth confidence'
    );
  }
});

// ==================== NOISE SIMULATION TESTS ====================

runner.test('Should generate hand shake noise when enabled', () => {
  const frames = generateTestCardMotionFrames({
    duration: 2,
    fps: 15,
    includeNoise: true
  });

  let hasNoise = false;
  frames.forEach(frame => {
    if (Math.abs(frame.noise.translationX) > 0 ||
        Math.abs(frame.noise.translationY) > 0) {
      hasNoise = true;
    }
  });

  runner.assert(hasNoise, 'Should have hand shake noise in some frames');
});

runner.test('Should not generate noise when disabled', () => {
  const frames = generateTestCardMotionFrames({
    duration: 2,
    fps: 15,
    includeNoise: false
  });

  frames.forEach((frame, i) => {
    runner.assertEqual(
      frame.noise.translationX,
      0,
      `Frame ${i}: noise X should be 0`
    );
    runner.assertEqual(
      frame.noise.translationY,
      0,
      `Frame ${i}: noise Y should be 0`
    );
  });
});

// ==================== SPOOFING DETECTION TESTS ====================

runner.test('Should detect paper spoof (no depth)', () => {
  const paperFrames = generateSpoofedCardMotion('paper');

  // Paper has no depth
  paperFrames.forEach((frame, i) => {
    runner.assertEqual(
      frame.depth.cardThickness,
      0,
      `Frame ${i}: paper should have 0 thickness`
    );
    runner.assertEqual(
      frame.depth.edgeShadow,
      0,
      `Frame ${i}: paper should have no edge shadows`
    );
  });
});

runner.test('Should detect screen spoof (uniform lighting)', () => {
  const screenFrames = generateSpoofedCardMotion('screen');

  // Screen has uniform backlight
  const lightingValues = screenFrames.map(f => f.lighting);
  const lightingVariation = Math.max(...lightingValues) - Math.min(...lightingValues);

  runner.assertLessThan(
    lightingVariation,
    0.05,
    'Screen should have minimal lighting variation'
  );
});

runner.test('Paper spoof should have no hologram', () => {
  const paperFrames = generateSpoofedCardMotion('paper');

  const avgIntensity = paperFrames.reduce((sum, f) =>
    sum + f.reflectivity.intensity, 0) / paperFrames.length;

  runner.assertEqual(avgIntensity, 0, 'Paper should have no hologram');
});

runner.test('Spoofed frames should be marked as spoofed', () => {
  const spoofedFrames = generateSpoofedCardMotion('paper');

  spoofedFrames.forEach((frame, i) => {
    runner.assertEqual(
      frame.metadata.isSpoofed,
      true,
      `Frame ${i}: should be marked as spoofed`
    );
    runner.assertEqual(
      frame.metadata.spoofType,
      'paper',
      `Frame ${i}: should have spoofType`
    );
  });
});

// ==================== LIVENESS ANALYSIS TESTS ====================

runner.test('Should detect authentic card as live', () => {
  const authenticFrames = generateTestCardMotionFrames({
    duration: 3,
    fps: 15,
    includeHologram: true,
    includeNoise: true
  });

  const result = analyzeLiveness(authenticFrames);

  runner.assertEqual(result.isLive, true, 'Should detect as live');
  runner.assertGreaterThan(
    result.confidence,
    0.65,
    'Confidence should be > 0.65'
  );
});

runner.test('Should detect paper spoof as not live', () => {
  const paperFrames = generateSpoofedCardMotion('paper');
  const result = analyzeLiveness(paperFrames);

  runner.assertEqual(result.isLive, false, 'Should detect paper as not live');
  runner.assertLessThan(
    result.confidence,
    0.5,
    'Confidence should be < 0.5 for spoofs'
  );
});

runner.test('Should detect screen spoof as not live', () => {
  const screenFrames = generateSpoofedCardMotion('screen');
  const result = analyzeLiveness(screenFrames);

  runner.assertEqual(result.isLive, false, 'Should detect screen as not live');
  runner.assertLessThan(
    result.confidence,
    0.5,
    'Confidence should be < 0.5 for spoofs'
  );
});

runner.test('Should return analysis details', () => {
  const frames = generateTestCardMotionFrames({ duration: 2, fps: 15 });
  const result = analyzeLiveness(frames);

  runner.assert(result.analysis !== undefined, 'Should have analysis object');
  runner.assert(
    result.analysis.depthVariation !== undefined,
    'Should have depth variation'
  );
  runner.assert(
    result.analysis.hologramPresence !== undefined,
    'Should have hologram presence'
  );
  runner.assert(
    result.analysis.motionConsistency !== undefined,
    'Should have motion consistency'
  );
  runner.assert(
    result.analysis.lightingVariation !== undefined,
    'Should have lighting variation'
  );
});

runner.test('Should reject sequences with too few frames', () => {
  const shortFrames = generateTestCardMotionFrames({ duration: 0.5, fps: 10 });
  const result = analyzeLiveness(shortFrames);

  runner.assertEqual(result.isLive, false, 'Should reject short sequences');
  runner.assertEqual(result.confidence, 0, 'Confidence should be 0');
});

// ==================== EDGE CASES ====================

runner.test('Should handle zero duration gracefully', () => {
  const frames = generateTestCardMotionFrames({ duration: 0, fps: 15 });
  runner.assertEqual(frames.length, 0, 'Should generate 0 frames');
});

runner.test('Should handle very low FPS', () => {
  const frames = generateTestCardMotionFrames({ duration: 2, fps: 1 });
  runner.assertEqual(frames.length, 2, 'Should generate 2 frames');
});

runner.test('Should handle very high FPS', () => {
  const frames = generateTestCardMotionFrames({ duration: 1, fps: 60 });
  runner.assertEqual(frames.length, 60, 'Should generate 60 frames');
});

// ==================== PERFORMANCE TESTS ====================

runner.test('Should generate frames quickly', () => {
  const start = Date.now();
  generateTestCardMotionFrames({ duration: 5, fps: 30 });
  const elapsed = Date.now() - start;

  runner.assertLessThan(
    elapsed,
    1000,
    'Should generate 150 frames in < 1 second'
  );
});

// ==================== INTEGRATION TESTS ====================

runner.test('Complete workflow: generate, analyze, detect', () => {
  // Generate authentic motion
  const authenticFrames = generateTestCardMotionFrames({
    duration: 3,
    fps: 15
  });

  // Analyze
  const authenticResult = analyzeLiveness(authenticFrames);

  // Generate spoof
  const spoofFrames = generateSpoofedCardMotion('paper');
  const spoofResult = analyzeLiveness(spoofFrames);

  // Verify different results
  runner.assert(
    authenticResult.confidence > spoofResult.confidence,
    'Authentic should have higher confidence than spoof'
  );

  runner.assertEqual(
    authenticResult.isLive,
    true,
    'Authentic should be detected as live'
  );

  runner.assertEqual(
    spoofResult.isLive,
    false,
    'Spoof should be detected as not live'
  );
});

// Run all tests
runner.run().then(success => {
  process.exit(success ? 0 : 1);
});
