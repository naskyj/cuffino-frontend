let detectorPromise = null;

const MIN_KEYPOINT_SCORE = 0.2;

const distance = (a, b) => {
  if (!a || !b) return null;
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
};

const midpoint = (a, b) => {
  if (!a || !b) return null;
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    score: Math.min(a.score ?? 0, b.score ?? 0),
  };
};

const average = (values) => {
  const valid = values.filter((value) => Number.isFinite(value));
  if (!valid.length) return null;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
};

const toInches = (pixels, pixelsPerInch) => {
  if (!Number.isFinite(pixels) || !Number.isFinite(pixelsPerInch) || pixelsPerInch <= 0) {
    return null;
  }
  return pixels / pixelsPerInch;
};

const round1 = (value) => {
  if (!Number.isFinite(value)) return null;
  return Math.round(value * 10) / 10;
};

const getKeypoint = (pose, name, minScore = MIN_KEYPOINT_SCORE) => {
  const keypoint = pose?.keypoints?.find((item) => item.name === name || item.part === name);
  if (!keypoint) return null;
  if ((keypoint.score ?? 0) < minScore) return null;
  return keypoint;
};

const ensureDetector = async () => {
  if (!detectorPromise) {
    detectorPromise = (async () => {
      const tf = await import("@tensorflow/tfjs-core");
      await import("@tensorflow/tfjs-backend-webgl");
      const poseDetection = await import("@tensorflow-models/pose-detection");

      await tf.ready();
      if (tf.getBackend() !== "webgl") {
        await tf.setBackend("webgl");
      }

      return poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
      });
    })();
  }

  return detectorPromise;
};

export const estimateMeasurementsWithMoveNet = async ({
  imageElement,
  heightInches,
  calibrationMode = "height",
  markerWidthInches,
  markerPixelWidth,
}) => {

  const height = Number(heightInches);
  const markerWidth = Number(markerWidthInches);
  const markerPixels = Number(markerPixelWidth);

  if (calibrationMode === "height") {
    if (!Number.isFinite(height) || height <= 0) {
      throw new Error("Please provide a valid height in inches.");
    }
  }

  if (calibrationMode === "marker") {
    if (!Number.isFinite(markerWidth) || markerWidth <= 0) {
      throw new Error("Please provide a valid marker width in inches.");
    }
    if (!Number.isFinite(markerPixels) || markerPixels <= 1) {
      throw new Error("Please provide a valid marker width in pixels.");
    }
  }

  const detector = await ensureDetector();
  const poses = await detector.estimatePoses(imageElement, {
    maxPoses: 1,
    flipHorizontal: false,
  });

  if (!poses?.length) {
    throw new Error("No person was detected. Use a clear full-body front image.");
  }

  const pose = poses[0];

  const leftShoulder = getKeypoint(pose, "left_shoulder");
  const rightShoulder = getKeypoint(pose, "right_shoulder");
  const leftElbow = getKeypoint(pose, "left_elbow");
  const rightElbow = getKeypoint(pose, "right_elbow");
  const leftWrist = getKeypoint(pose, "left_wrist");
  const rightWrist = getKeypoint(pose, "right_wrist");
  const leftHip = getKeypoint(pose, "left_hip");
  const rightHip = getKeypoint(pose, "right_hip");
  const leftKnee = getKeypoint(pose, "left_knee");
  const rightKnee = getKeypoint(pose, "right_knee");
  const leftAnkle = getKeypoint(pose, "left_ankle");
  const rightAnkle = getKeypoint(pose, "right_ankle");
  const nose = getKeypoint(pose, "nose", 0.1);
  const leftEye = getKeypoint(pose, "left_eye", 0.1);
  const rightEye = getKeypoint(pose, "right_eye", 0.1);
  const leftEar = getKeypoint(pose, "left_ear", 0.1);
  const rightEar = getKeypoint(pose, "right_ear", 0.1);

  const topCandidates = [nose, leftEye, rightEye, leftEar, rightEar, leftShoulder, rightShoulder]
    .filter(Boolean)
    .map((point) => point.y);

  const bottomCandidates = [leftAnkle, rightAnkle, leftKnee, rightKnee]
    .filter(Boolean)
    .map((point) => point.y);

  if (!topCandidates.length || !bottomCandidates.length) {
    throw new Error("Unable to detect enough body keypoints. Ensure full body is visible.");
  }

  const pixelBodyHeight = Math.max(...bottomCandidates) - Math.min(...topCandidates);
  if (!Number.isFinite(pixelBodyHeight) || pixelBodyHeight <= 1) {
    throw new Error("Could not infer body scale from image.");
  }

  let pixelsPerInch;
  if (calibrationMode === "marker") {
    pixelsPerInch = markerPixels / markerWidth;
  } else {
    pixelsPerInch = pixelBodyHeight / height;
  }

  const shoulderWidth = toInches(distance(leftShoulder, rightShoulder), pixelsPerInch);
  const hipWidth = toInches(distance(leftHip, rightHip), pixelsPerInch);

  const leftUpperArm = distance(leftShoulder, leftElbow);
  const leftForeArm = distance(leftElbow, leftWrist);
  const rightUpperArm = distance(rightShoulder, rightElbow);
  const rightForeArm = distance(rightElbow, rightWrist);
  const armLength = toInches(
    average([
      Number.isFinite(leftUpperArm) && Number.isFinite(leftForeArm) ? leftUpperArm + leftForeArm : null,
      Number.isFinite(rightUpperArm) && Number.isFinite(rightForeArm) ? rightUpperArm + rightForeArm : null,
    ]),
    pixelsPerInch
  );

  const leftUpperLeg = distance(leftHip, leftKnee);
  const leftLowerLeg = distance(leftKnee, leftAnkle);
  const rightUpperLeg = distance(rightHip, rightKnee);
  const rightLowerLeg = distance(rightKnee, rightAnkle);
  const legLength = toInches(
    average([
      Number.isFinite(leftUpperLeg) && Number.isFinite(leftLowerLeg) ? leftUpperLeg + leftLowerLeg : null,
      Number.isFinite(rightUpperLeg) && Number.isFinite(rightLowerLeg) ? rightUpperLeg + rightLowerLeg : null,
    ]),
    pixelsPerInch
  );

  const midHip = midpoint(leftHip, rightHip);
  const midAnkle = midpoint(leftAnkle, rightAnkle);
  const inseamRaw = toInches(distance(midHip, midAnkle), pixelsPerInch);
  const inseam = Number.isFinite(inseamRaw) ? inseamRaw * 0.92 : null;

  const bust = Number.isFinite(shoulderWidth) ? shoulderWidth * 1.95 : null;
  const waist = Number.isFinite(hipWidth) ? hipWidth * 1.05 : null;
  const hips = Number.isFinite(hipWidth) ? hipWidth * 1.4 : null;
  const neck = Number.isFinite(shoulderWidth) ? shoulderWidth * 0.37 : null;
  const sleeveLength = Number.isFinite(armLength) ? armLength * 0.95 : null;
  const thigh = Number.isFinite(hipWidth) ? hipWidth * 0.72 : null;
  const calf = Number.isFinite(thigh) ? thigh * 0.68 : null;

  const confidencePoints = [
    leftShoulder,
    rightShoulder,
    leftElbow,
    rightElbow,
    leftWrist,
    rightWrist,
    leftHip,
    rightHip,
    leftKnee,
    rightKnee,
    leftAnkle,
    rightAnkle,
  ].filter(Boolean);
  const confidence = average(confidencePoints.map((point) => point.score ?? 0)) ?? 0;

  const estimatedHeight = toInches(pixelBodyHeight, pixelsPerInch);

  return {
    measurements: {
      height: round1(calibrationMode === "height" ? height : estimatedHeight),
      bust: round1(bust),
      waist: round1(waist),
      hips: round1(hips),
      shoulderWidth: round1(shoulderWidth),
      armLength: round1(armLength),
      legLength: round1(legLength),
      neck: round1(neck),
      sleeveLength: round1(sleeveLength),
      inseam: round1(inseam),
      thigh: round1(thigh),
      calf: round1(calf),
    },
    diagnostics: {
      calibrationMode,
      pixelBodyHeight: round1(pixelBodyHeight),
      pixelsPerInch: round1(pixelsPerInch),
      markerWidthInches: calibrationMode === "marker" ? round1(markerWidth) : null,
      markerPixelWidth: calibrationMode === "marker" ? round1(markerPixels) : null,
      keypointConfidence: round1(confidence),
    },
  };
};
