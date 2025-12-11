# ID Card Liveness Detection Testing Guide

## Overview

This system simulates ID card motion for testing anti-spoofing and liveness detection algorithms **without requiring real camera hardware or physical ID cards**. It's designed for unit testing, algorithm development, and performance benchmarking.

---

## Core Concepts

### What is Liveness Detection?

Liveness detection verifies that the ID card being scanned is:
- **Physical and present** (not a photo or screen)
- **3-dimensional** (has depth and thickness)
- **Authentic** (has security features like holograms)
- **In real-time** (not a replay attack)

### Attack Vectors This Helps Test

1. **Paper Print Attack**: Attacker prints a photo of an ID on paper
2. **Screen Replay Attack**: Attacker displays an ID photo on a phone/tablet screen
3. **Photo Attack**: Attacker holds up a printed photograph
4. **Video Replay**: Attacker plays a recorded video of someone holding an ID

---

## How It Works

### 1. Motion Simulation

The system generates realistic 3D motion patterns that a real ID card would exhibit:

```javascript
const frames = generateTestCardMotionFrames({
  duration: 3,        // 3 seconds
  fps: 15,            // 15 frames per second
  includeHologram: true,
  includeNoise: true,
  motionPattern: 'complete'
});

// Returns 45 frames (3 seconds × 15 fps)
console.log(frames.length); // 45
```

### 2. Frame Metadata Structure

Each frame contains rich metadata:

```javascript
{
  // Basic info
  "timestamp": 1000,
  "frameIndex": 15,

  // 3D orientation (degrees)
  "angleX": 12.5,      // Pitch (up/down tilt)
  "angleY": -18.3,     // Yaw (left/right tilt)
  "rotationZ": 5.2,    // Roll (clockwise rotation)

  // Distance and lighting
  "distance": 1.05,    // Relative distance (1.0 = baseline)
  "lighting": 1.15,    // Lighting intensity

  // Hologram simulation (CRITICAL for authenticity)
  "reflectivity": {
    "intensity": 0.65,          // How bright the hologram appears
    "specularAngle": -23.5,     // Angle of reflection
    "colorShift": 42.0,         // Hologram color shift (nm)
    "iridescence": 0.78         // Rainbow effect intensity
  },

  // Natural hand shake
  "noise": {
    "translationX": 1.2,        // Horizontal shake (pixels)
    "translationY": -0.8,       // Vertical shake (pixels)
    "microRotation": 0.3,       // Tiny rotation variance
    "amplitude": 2.1            // Overall shake magnitude
  },

  // 3D depth cues (ABSENT in flat prints/screens)
  "depth": {
    "cardThickness": 0.45,      // Visible thickness (mm)
    "edgeShadow": 0.32,         // Shadow at card edges
    "parallaxFactor": 2.5,      // Motion parallax effect
    "perspectiveDistortion": 0.21,
    "depthConfidence": 0.67     // How much depth info available
  },

  // Metadata
  "metadata": {
    "motionPhase": "tilt-left-right",
    "isKeyFrame": false,
    "progress": 33
  }
}
```

---

## Detection Strategies

### 1. Anti-Paper Detection

**How it works**: Paper prints are **perfectly flat** (2D). They show no depth variation.

**Test with**:
```javascript
const paperSpoof = generateSpoofedCardMotion('paper');

// Paper characteristics:
paperSpoof.forEach(frame => {
  console.log(frame.depth.cardThickness);  // Always 0.0
  console.log(frame.depth.edgeShadow);     // Always 0.0
  console.log(frame.reflectivity.intensity); // Always 0.0 (no hologram)
});
```

**Detection logic**:
```javascript
function detectPaper(frames) {
  const avgThickness = frames.reduce((sum, f) =>
    sum + f.depth.cardThickness, 0) / frames.length;

  const avgShadow = frames.reduce((sum, f) =>
    sum + f.depth.edgeShadow, 0) / frames.length;

  // Real ID cards show depth > 0.3mm when tilted
  return avgThickness < 0.1 && avgShadow < 0.1;
}
```

### 2. Anti-Screen Replay Detection

**How it works**: Screens have:
- Uniform backlighting (no natural light variation)
- Pixel grid patterns
- Screen refresh rate artifacts
- No holographic effects

**Test with**:
```javascript
const screenSpoof = generateSpoofedCardMotion('screen');

// Screen characteristics:
screenSpoof.forEach(frame => {
  console.log(frame.lighting);  // Always 1.0 (uniform backlight)
  console.log(frame.metadata.screenRefreshRate);  // 60 Hz
  console.log(frame.metadata.pixelGridVisible);   // true
});
```

**Detection logic**:
```javascript
function detectScreen(frames) {
  // Calculate lighting variation
  const lightingValues = frames.map(f => f.lighting);
  const lightingVariation = Math.max(...lightingValues) -
                           Math.min(...lightingValues);

  // Real cards show lighting variation > 0.15
  // Screens show variation < 0.05
  return lightingVariation < 0.08;
}
```

### 3. Hologram Detection

**How it works**: Real ID cards have holograms that:
- Change color when tilted (iridescence)
- Show specular highlights at specific angles
- Have wavelength-dependent diffraction patterns

**Test with**:
```javascript
const authenticFrames = generateTestCardMotionFrames({
  includeHologram: true
});

// Analyze hologram behavior
const hologramData = authenticFrames.map(f => ({
  angle: f.angleY,
  intensity: f.reflectivity.intensity,
  colorShift: f.reflectivity.colorShift
}));

// Real holograms: intensity correlates with angle
// Fake cards: intensity = 0
```

**Detection logic**:
```javascript
function detectHologram(frames) {
  const avgIntensity = frames.reduce((sum, f) =>
    sum + f.reflectivity.intensity, 0) / frames.length;

  const maxColorShift = Math.max(...frames.map(f =>
    f.reflectivity.colorShift));

  // Real holograms: intensity > 0.3, color shift > 20°
  return avgIntensity > 0.3 && maxColorShift > 20;
}
```

### 4. Document Depth Simulation

**How it works**: Real 3D objects show:
- Parallax effect (closer objects move more)
- Perspective distortion when tilted
- Edge shadows from lighting

**Test with**:
```javascript
function analyzeDepth(frames) {
  // Track depth variation over time
  const depthScores = frames.map(f => f.depth.depthConfidence);

  // Real cards: depth confidence varies 0.3 - 0.9
  // Flat fakes: depth confidence always ~0

  const maxDepth = Math.max(...depthScores);
  const minDepth = Math.min(...depthScores);
  const depthRange = maxDepth - minDepth;

  return {
    isReal: depthRange > 0.4,
    confidence: depthRange
  };
}
```

---

## Usage Examples

### Basic Testing

```javascript
const {
  generateTestCardMotionFrames,
  generateSpoofedCardMotion,
  analyzeLiveness
} = require('./idCardLivenessSimulator');

// Test 1: Authentic card
const authenticFrames = generateTestCardMotionFrames();
const result1 = analyzeLiveness(authenticFrames);
console.log(result1);
// { isLive: true, confidence: 0.89, ... }

// Test 2: Paper spoof
const paperFrames = generateSpoofedCardMotion('paper');
const result2 = analyzeLiveness(paperFrames);
console.log(result2);
// { isLive: false, confidence: 0.23, ... }
```

### Testing Different Motion Patterns

```javascript
// Test tilt-only detection
const tiltFrames = generateTestCardMotionFrames({
  motionPattern: 'tilt-only',
  duration: 2
});

// Test rotation-only detection
const rotateFrames = generateTestCardMotionFrames({
  motionPattern: 'rotate-only',
  duration: 2
});

// Test distance-only detection
const distanceFrames = generateTestCardMotionFrames({
  motionPattern: 'distance-only',
  duration: 2
});
```

### Performance Benchmarking

```javascript
// High FPS for detailed analysis
const highFpsFrames = generateTestCardMotionFrames({
  duration: 3,
  fps: 30
});

// Low FPS for resource-constrained scenarios
const lowFpsFrames = generateTestCardMotionFrames({
  duration: 3,
  fps: 10
});
```

---

## Integration with Real Camera Feed

When you have real camera data, map it to the same structure:

```javascript
function mapCameraFrameToTestFormat(cameraFrame, previousFrame) {
  // Extract 3D pose from computer vision
  const pose = estimatePose(cameraFrame.image);

  // Detect holograms using light analysis
  const hologram = detectHologramInImage(cameraFrame.image);

  // Calculate depth using stereo vision or structured light
  const depth = estimateDepth(cameraFrame.image);

  return {
    timestamp: cameraFrame.timestamp,
    frameIndex: cameraFrame.index,
    angleX: pose.pitch,
    angleY: pose.yaw,
    rotationZ: pose.roll,
    distance: pose.distance,
    lighting: analyzeLighting(cameraFrame.image),
    reflectivity: hologram,
    noise: calculateNoise(pose, previousFrame),
    depth: depth,
    metadata: {
      motionPhase: classifyMotion(pose),
      isKeyFrame: detectKeyFrame(pose, previousFrame)
    }
  };
}
```

---

## Advanced Testing Scenarios

### 1. Temporal Attack Detection

Test replay attacks using saved sequences:

```javascript
// Generate two identical sequences (replay)
const seq1 = generateTestCardMotionFrames({ duration: 3 });
const seq2 = generateTestCardMotionFrames({ duration: 3 });

// Real motion: sequences differ
// Replay attack: sequences identical
function detectReplay(seq1, seq2) {
  let identicalFrames = 0;
  for (let i = 0; i < seq1.length; i++) {
    if (JSON.stringify(seq1[i]) === JSON.stringify(seq2[i])) {
      identicalFrames++;
    }
  }
  return identicalFrames / seq1.length > 0.9; // 90% identical = replay
}
```

### 2. Multi-Spectral Analysis

Simulate infrared or UV response:

```javascript
function addMultispectralData(frames) {
  return frames.map(frame => ({
    ...frame,
    spectral: {
      infrared: calculateIRReflectance(frame),
      ultraviolet: calculateUVReflectance(frame),
      // Real IDs have UV-reactive inks
      uvInk: frame.reflectivity.intensity > 0.5 ? 0.8 : 0.0
    }
  }));
}
```

### 3. Machine Learning Training Data

Generate training datasets:

```javascript
// Generate 1000 authentic sequences
const authenticDataset = Array.from({ length: 1000 }, () =>
  generateTestCardMotionFrames()
);

// Generate 1000 spoofed sequences
const spoofedDataset = Array.from({ length: 1000 }, () =>
  generateSpoofedCardMotion(['paper', 'screen', 'photo'][Math.floor(Math.random() * 3)])
);

// Labels
const labels = [
  ...Array(1000).fill(1), // Authentic
  ...Array(1000).fill(0)  // Spoofed
];

// Train ML model
trainModel([...authenticDataset, ...spoofedDataset], labels);
```

---

## Scoring Thresholds

Based on analysis results:

| Score Range | Verdict | Action |
|-------------|---------|--------|
| 0.80 - 1.00 | High confidence authentic | Accept |
| 0.65 - 0.79 | Likely authentic | Accept with review |
| 0.40 - 0.64 | Uncertain | Request retry |
| 0.00 - 0.39 | Likely spoofed | Reject |

---

## Testing Checklist

- [ ] Test paper print detection
- [ ] Test screen replay detection
- [ ] Test photo attack detection
- [ ] Test hologram presence validation
- [ ] Test depth variation analysis
- [ ] Test motion consistency
- [ ] Test lighting variation
- [ ] Test hand shake patterns
- [ ] Benchmark performance (fps)
- [ ] Test with different motion patterns
- [ ] Validate false positive rate < 5%
- [ ] Validate false negative rate < 2%

---

## Common Issues & Solutions

### Issue: False positives on genuine cards
**Solution**: Lower the confidence threshold from 0.65 to 0.55

### Issue: Spoofs passing detection
**Solution**: Add multiple detection layers (depth + hologram + motion)

### Issue: Poor performance on low-end devices
**Solution**: Reduce FPS and use `motionPattern: 'tilt-only'`

---

## References

- ISO/IEC 30107-3:2017 - Presentation attack detection
- NIST SP 800-76-2 - Biometric data specifications
- iBeta Level 1/2 PAD testing standards

---

## Support

For questions or issues, contact the development team or file an issue in the project repository.
