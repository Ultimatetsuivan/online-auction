/**
 * ID Card Liveness Detection Test Simulator
 *
 * Generates synthetic motion data to test card authenticity verification
 * without requiring real camera hardware or ID cards.
 *
 * Use cases:
 * - Unit testing liveness detection algorithms
 * - Testing anti-paper detection (2D vs 3D movement)
 * - Testing anti-screen replay detection
 * - Testing hologram/reflectivity detection
 * - Performance benchmarking
 */

/**
 * Frame metadata structure representing ID card state at a point in time
 * @typedef {Object} CardFrame
 * @property {number} timestamp - Frame timestamp in ms
 * @property {number} frameIndex - Sequential frame number
 * @property {number} angleX - Tilt angle around X-axis (pitch) in degrees [-30, 30]
 * @property {number} angleY - Tilt angle around Y-axis (yaw) in degrees [-30, 30]
 * @property {number} rotationZ - Rotation around Z-axis (roll) in degrees [-15, 15]
 * @property {number} distance - Distance from camera (1.0 = baseline) [0.8, 1.2]
 * @property {number} lighting - Lighting intensity (1.0 = baseline) [0.7, 1.3]
 * @property {Object} reflectivity - Simulated hologram/reflective surface response
 * @property {number} reflectivity.intensity - Reflection brightness [0, 1]
 * @property {number} reflectivity.specularAngle - Angle of specular highlight
 * @property {Object} noise - Natural hand shake and micro-movements
 * @property {number} noise.translationX - Horizontal shake in pixels
 * @property {number} noise.translationY - Vertical shake in pixels
 * @property {number} noise.microRotation - Tiny rotation variance
 * @property {Object} depth - 3D depth information (absent in 2D fakes)
 * @property {number} depth.cardThickness - Perceived thickness in mm
 * @property {number} depth.edgeShadow - Shadow intensity at card edges
 * @property {Object} metadata - Additional frame info
 * @property {string} metadata.motionPhase - Current motion type
 * @property {boolean} metadata.isKeyFrame - Important transition frame
 */

/**
 * Generate realistic ID card motion sequence for liveness testing
 *
 * @param {Object} options - Generation options
 * @param {number} options.duration - Total duration in seconds (default: 3)
 * @param {number} options.fps - Frames per second (default: 15)
 * @param {boolean} options.includeHologram - Simulate holographic effects (default: true)
 * @param {boolean} options.includeNoise - Add realistic hand shake (default: true)
 * @param {string} options.motionPattern - 'complete' | 'tilt-only' | 'rotate-only' | 'distance-only'
 * @returns {CardFrame[]} Array of frame metadata
 */
function generateTestCardMotionFrames(options = {}) {
  const {
    duration = 3,
    fps = 15,
    includeHologram = true,
    includeNoise = true,
    motionPattern = 'complete'
  } = options;

  const totalFrames = Math.floor(duration * fps);
  const frames = [];
  const frameDuration = 1000 / fps; // ms per frame

  for (let i = 0; i < totalFrames; i++) {
    const progress = i / totalFrames; // 0 to 1
    const timestamp = i * frameDuration;

    // Determine motion phase
    const phase = getMotionPhase(progress, motionPattern);

    // Generate base motion
    const motion = calculateCardMotion(progress, phase, motionPattern);

    // Add holographic effects (only visible on real cards)
    const reflectivity = includeHologram
      ? calculateHologramEffect(motion.angleX, motion.angleY, motion.lighting)
      : { intensity: 0, specularAngle: 0 };

    // Add realistic noise (hand shake)
    const noise = includeNoise
      ? calculateHandShakeNoise(progress, i)
      : { translationX: 0, translationY: 0, microRotation: 0 };

    // Calculate depth information (3D properties)
    const depth = calculateDepthInformation(
      motion.angleX,
      motion.angleY,
      motion.distance
    );

    frames.push({
      timestamp,
      frameIndex: i,
      ...motion,
      reflectivity,
      noise,
      depth,
      metadata: {
        motionPhase: phase,
        isKeyFrame: isKeyFrame(i, totalFrames, phase),
        progress: Math.round(progress * 100)
      }
    });
  }

  return frames;
}

/**
 * Determine current motion phase based on progress
 */
function getMotionPhase(progress, pattern) {
  if (pattern === 'tilt-only') return 'tilt';
  if (pattern === 'rotate-only') return 'rotate';
  if (pattern === 'distance-only') return 'distance';

  // Complete pattern: tilt -> rotate -> distance -> combined
  if (progress < 0.25) return 'tilt-left-right';
  if (progress < 0.50) return 'rotate-clockwise';
  if (progress < 0.75) return 'move-closer-farther';
  return 'combined-motion';
}

/**
 * Calculate card motion parameters for current frame
 */
function calculateCardMotion(progress, phase, pattern) {
  const t = progress;

  let angleX = 0; // Pitch (tilt up/down)
  let angleY = 0; // Yaw (tilt left/right)
  let rotationZ = 0; // Roll (rotate clockwise/counterclockwise)
  let distance = 1.0; // Distance from camera
  let lighting = 1.0; // Lighting intensity

  // Phase-specific motion patterns
  switch (phase) {
    case 'tilt-left-right':
      // Smooth sinusoidal tilt
      angleY = 25 * Math.sin(t * Math.PI * 4); // -25° to +25°
      angleX = 10 * Math.sin(t * Math.PI * 2); // Slight vertical tilt
      lighting = 1.0 + 0.15 * Math.sin(t * Math.PI * 4); // Lighting changes with angle
      break;

    case 'rotate-clockwise':
      // Rotation with slight tilt
      const rotProgress = (t - 0.25) * 4; // 0 to 1 during this phase
      rotationZ = -15 + (30 * rotProgress); // -15° to +15°
      angleX = 5 * Math.sin(rotProgress * Math.PI);
      lighting = 1.0 + 0.1 * Math.cos(rotProgress * Math.PI);
      break;

    case 'move-closer-farther':
      // Distance oscillation
      const distProgress = (t - 0.50) * 4;
      distance = 1.0 + 0.2 * Math.sin(distProgress * Math.PI * 2); // 0.8 to 1.2
      // Lighting increases as card gets closer
      lighting = 0.9 + 0.2 * distance;
      angleY = 10 * Math.sin(distProgress * Math.PI);
      break;

    case 'combined-motion':
      // Complex combined motion
      const combProgress = (t - 0.75) * 4;
      angleX = 15 * Math.sin(combProgress * Math.PI * 3);
      angleY = 20 * Math.cos(combProgress * Math.PI * 2);
      rotationZ = 10 * Math.sin(combProgress * Math.PI);
      distance = 1.0 + 0.15 * Math.sin(combProgress * Math.PI * 2);
      lighting = 1.0 + 0.2 * Math.cos(combProgress * Math.PI * 3);
      break;

    default:
      break;
  }

  return {
    angleX: parseFloat(angleX.toFixed(2)),
    angleY: parseFloat(angleY.toFixed(2)),
    rotationZ: parseFloat(rotationZ.toFixed(2)),
    distance: parseFloat(distance.toFixed(3)),
    lighting: parseFloat(lighting.toFixed(3))
  };
}

/**
 * Calculate holographic/reflective effects
 * Real ID cards have holograms that respond to angle and lighting
 * Paper prints or screen displays won't show these effects
 */
function calculateHologramEffect(angleX, angleY, lighting) {
  // Hologram intensity depends on viewing angle
  const angleIntensity = Math.abs(Math.sin((angleX + angleY) * Math.PI / 180));

  // Specular highlight angle shifts with card rotation
  const specularAngle = Math.atan2(angleY, angleX) * 180 / Math.PI;

  // Base intensity modulated by lighting
  const baseIntensity = 0.3 + (angleIntensity * 0.7);
  const intensity = baseIntensity * (lighting / 1.0);

  return {
    intensity: parseFloat(Math.min(intensity, 1.0).toFixed(3)),
    specularAngle: parseFloat(specularAngle.toFixed(2)),
    // Color shift in holograms (wavelength-dependent diffraction)
    colorShift: parseFloat((angleIntensity * 60).toFixed(1)), // 0-60° hue shift
    // Iridescence factor
    iridescence: parseFloat((0.5 + angleIntensity * 0.5).toFixed(3))
  };
}

/**
 * Calculate realistic hand shake noise
 * Natural human hand movement has characteristic frequencies and amplitudes
 */
function calculateHandShakeNoise(progress, frameIndex) {
  // Human hand shake is typically 8-12 Hz
  const shakeFreq = 10;
  const t = frameIndex / 15; // Time in seconds (assuming 15fps)

  // Perlin-like noise simulation
  const translationX = 2.5 * Math.sin(t * shakeFreq) + 0.5 * Math.cos(t * shakeFreq * 3);
  const translationY = 2.0 * Math.cos(t * shakeFreq) + 0.7 * Math.sin(t * shakeFreq * 2.5);

  // Micro-rotation from wrist movement
  const microRotation = 0.5 * Math.sin(t * shakeFreq * 1.5);

  return {
    translationX: parseFloat(translationX.toFixed(2)),
    translationY: parseFloat(translationY.toFixed(2)),
    microRotation: parseFloat(microRotation.toFixed(3)),
    // Shake amplitude (higher = more shake)
    amplitude: parseFloat((2.0 + Math.random() * 0.5).toFixed(2))
  };
}

/**
 * Calculate depth information
 * Real 3D cards show depth cues that flat prints/screens cannot replicate
 */
function calculateDepthInformation(angleX, angleY, distance) {
  // Card thickness becomes visible when tilted
  const tiltMagnitude = Math.sqrt(angleX * angleX + angleY * angleY);
  const cardThickness = 0.76 * (tiltMagnitude / 30); // Standard ID card is 0.76mm thick

  // Edge shadows appear when card is tilted
  const edgeShadow = Math.min(tiltMagnitude / 20, 1.0);

  // Parallax effect (closer objects move more)
  const parallaxFactor = (1.2 - distance) * 10; // Higher when closer

  // Perspective distortion
  const perspectiveDistortion = tiltMagnitude / 90; // 0 to 0.33

  return {
    cardThickness: parseFloat(cardThickness.toFixed(3)),
    edgeShadow: parseFloat(edgeShadow.toFixed(3)),
    parallaxFactor: parseFloat(parallaxFactor.toFixed(2)),
    perspectiveDistortion: parseFloat(perspectiveDistortion.toFixed(3)),
    // Depth confidence (how much 3D info is available)
    depthConfidence: parseFloat((tiltMagnitude / 30).toFixed(3))
  };
}

/**
 * Determine if frame is a key frame (important for analysis)
 */
function isKeyFrame(frameIndex, totalFrames, phase) {
  // First and last frames
  if (frameIndex === 0 || frameIndex === totalFrames - 1) return true;

  // Phase transition frames
  const phaseTransitions = [
    Math.floor(totalFrames * 0.25),
    Math.floor(totalFrames * 0.50),
    Math.floor(totalFrames * 0.75)
  ];

  return phaseTransitions.includes(frameIndex);
}

/**
 * Generate fake/spoofed motion sequence for testing detection
 * This simulates what attackers might try (paper print, phone screen)
 *
 * @param {string} spoofType - 'paper' | 'screen' | 'photo'
 * @returns {CardFrame[]} Frames with spoofing characteristics
 */
function generateSpoofedCardMotion(spoofType = 'paper') {
  const baseFrames = generateTestCardMotionFrames({
    duration: 3,
    fps: 15,
    includeHologram: false,
    includeNoise: true
  });

  return baseFrames.map(frame => {
    const spoofedFrame = { ...frame };

    switch (spoofType) {
      case 'paper':
        // Paper is perfectly flat - no depth
        spoofedFrame.depth = {
          cardThickness: 0.0, // No thickness
          edgeShadow: 0.0, // No edge shadows
          parallaxFactor: 0.0,
          perspectiveDistortion: 0.0,
          depthConfidence: 0.0
        };
        // No hologram on paper
        spoofedFrame.reflectivity.intensity = 0.0;
        spoofedFrame.reflectivity.iridescence = 0.0;
        break;

      case 'screen':
        // Phone/laptop screen characteristics
        spoofedFrame.depth.cardThickness = 0.0;
        spoofedFrame.depth.edgeShadow = 0.0;
        // Screen has uniform backlight (no natural lighting variation)
        spoofedFrame.lighting = 1.0;
        // Screen refresh rate artifacts
        spoofedFrame.metadata.screenRefreshRate = 60;
        spoofedFrame.metadata.pixelGridVisible = true;
        // No hologram, but may have screen glare
        spoofedFrame.reflectivity.intensity = 0.1; // Minimal screen glare
        break;

      case 'photo':
        // Printed photo on thick paper
        spoofedFrame.depth.cardThickness = 0.2; // Thicker than ID card
        spoofedFrame.depth.edgeShadow = 0.05; // Minimal shadows
        spoofedFrame.reflectivity.intensity = 0.0;
        spoofedFrame.metadata.surfaceTexture = 'matte'; // Photo paper texture
        break;
    }

    spoofedFrame.metadata.spoofType = spoofType;
    spoofedFrame.metadata.isSpoofed = true;

    return spoofedFrame;
  });
}

/**
 * Analyze frame sequence to detect liveness
 * This is a sample analysis function showing how to use the test data
 *
 * @param {CardFrame[]} frames - Frame sequence to analyze
 * @returns {Object} Analysis results
 */
function analyzeLiveness(frames) {
  if (frames.length < 10) {
    return {
      isLive: false,
      confidence: 0,
      reason: 'Insufficient frames'
    };
  }

  const analysis = {
    depthVariation: calculateDepthVariation(frames),
    hologramPresence: calculateHologramPresence(frames),
    motionConsistency: calculateMotionConsistency(frames),
    lightingVariation: calculateLightingVariation(frames)
  };

  // Scoring algorithm
  let score = 0;
  let maxScore = 0;

  // Depth variation (30 points)
  maxScore += 30;
  if (analysis.depthVariation > 0.5) score += 30;
  else if (analysis.depthVariation > 0.3) score += 20;
  else if (analysis.depthVariation > 0.1) score += 10;

  // Hologram presence (25 points)
  maxScore += 25;
  if (analysis.hologramPresence > 0.4) score += 25;
  else if (analysis.hologramPresence > 0.2) score += 15;

  // Motion consistency (25 points)
  maxScore += 25;
  if (analysis.motionConsistency > 0.7) score += 25;
  else if (analysis.motionConsistency > 0.5) score += 15;

  // Lighting variation (20 points)
  maxScore += 20;
  if (analysis.lightingVariation > 0.15) score += 20;
  else if (analysis.lightingVariation > 0.08) score += 10;

  const confidence = score / maxScore;
  const isLive = confidence > 0.65; // 65% threshold

  return {
    isLive,
    confidence: parseFloat(confidence.toFixed(3)),
    score,
    maxScore,
    analysis,
    recommendation: isLive
      ? 'Likely authentic ID card'
      : 'Possible spoofing attempt detected'
  };
}

// Helper analysis functions
function calculateDepthVariation(frames) {
  const depths = frames.map(f => f.depth.depthConfidence);
  return Math.max(...depths) - Math.min(...depths);
}

function calculateHologramPresence(frames) {
  const avgIntensity = frames.reduce((sum, f) =>
    sum + f.reflectivity.intensity, 0) / frames.length;
  return avgIntensity;
}

function calculateMotionConsistency(frames) {
  // Check if motion follows expected patterns
  let consistentFrames = 0;
  for (let i = 1; i < frames.length; i++) {
    const angleDiff = Math.abs(frames[i].angleY - frames[i-1].angleY);
    // Smooth motion has gradual changes
    if (angleDiff > 0 && angleDiff < 10) consistentFrames++;
  }
  return consistentFrames / frames.length;
}

function calculateLightingVariation(frames) {
  const lightingValues = frames.map(f => f.lighting);
  return Math.max(...lightingValues) - Math.min(...lightingValues);
}

// Export functions
module.exports = {
  generateTestCardMotionFrames,
  generateSpoofedCardMotion,
  analyzeLiveness
};

// Example usage (for testing)
if (require.main === module) {
  console.log('=== ID Card Liveness Detection Simulator ===\n');

  // Generate authentic card motion
  console.log('1. Generating authentic card motion sequence...');
  const authenticFrames = generateTestCardMotionFrames({ duration: 3, fps: 15 });
  console.log(`   Generated ${authenticFrames.length} frames`);
  console.log('   Sample frame:', JSON.stringify(authenticFrames[20], null, 2));

  // Analyze authentic motion
  console.log('\n2. Analyzing authentic motion...');
  const authenticResult = analyzeLiveness(authenticFrames);
  console.log('   Result:', authenticResult);

  // Generate spoofed motion (paper)
  console.log('\n3. Generating spoofed motion (paper)...');
  const spoofedFrames = generateSpoofedCardMotion('paper');
  const spoofResult = analyzeLiveness(spoofedFrames);
  console.log('   Result:', spoofResult);

  // Generate spoofed motion (screen)
  console.log('\n4. Generating spoofed motion (screen)...');
  const screenFrames = generateSpoofedCardMotion('screen');
  const screenResult = analyzeLiveness(screenFrames);
  console.log('   Result:', screenResult);

  console.log('\n=== Test Complete ===');
}
