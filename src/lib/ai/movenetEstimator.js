let detectorPromise = null;

// Core skeletal points measurements actually depend on - if these are missing or too noisy,
// the resulting numbers aren't trustworthy enough to hand to a tailor, so estimation is
// refused outright rather than silently returning a bad guess (see CORE_KEYPOINTS below).
const CORE_MIN_SCORE = 0.3;
// Face points are only used to find the top of the head for calibration, not for precise
// distance math, so a lower bar is acceptable here.
const FACE_MIN_SCORE = 0.15;

const CORE_KEYPOINTS = [
  "left_shoulder",
  "right_shoulder",
  "left_hip",
  "right_hip",
  "left_ankle",
  "right_ankle",
];

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

const getKeypoint = (pose, name, minScore) => {
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

      // THUNDER over LIGHTNING: this is a one-shot photo analysis, not live video, so there's
      // no reason to trade accuracy for the speed LIGHTNING is optimized for.
      return poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER,
      });
    })();
  }

  return detectorPromise;
};

/*
 * Body-type ratio adjustments (bust/waist/hip/etc. from a single 2D photo can only ever be a
 * ratio-based guess - MoveNet gives joint positions, never girth - see AiMeasurementAssistant's
 * help text). These per-bodyType multipliers are a modest adjustment for well-known general
 * population differences (e.g. women average a narrower waist relative to hip than men), not a
 * precise correction - still population averages applied to one photo, not a measurement of the
 * actual person. MEN/WOMEN get adjusted multipliers; CHILDREN keeps the neutral set since child
 * body proportions vary enough by age that a single adjustment would likely do more harm than
 * good - flagged as lower-confidence for children in the returned diagnostics instead.
 */
const RATIO_SETS = {
  DEFAULT: { bust: 1.95, waist: 1.05, hips: 1.4, neck: 0.37, thigh: 0.72, calf: 0.68, bicep: 0.68, wrist: 0.36, ankle: 0.72 },
  MEN: { bust: 2.0, waist: 1.1, hips: 1.32, neck: 0.4, thigh: 0.72, calf: 0.68, bicep: 0.72, wrist: 0.37, ankle: 0.72 },
  WOMEN: { bust: 1.92, waist: 0.95, hips: 1.45, neck: 0.35, thigh: 0.74, calf: 0.68, bicep: 0.65, wrist: 0.35, ankle: 0.72 },
  CHILDREN: { bust: 1.95, waist: 1.05, hips: 1.4, neck: 0.37, thigh: 0.72, calf: 0.68, bicep: 0.68, wrist: 0.36, ankle: 0.72 },
};

const getRatios = (bodyType) => RATIO_SETS[bodyType] || RATIO_SETS.DEFAULT;

export const estimateMeasurementsWithMoveNet = async ({
  imageElement,
  heightInches,
  calibrationMode = "height",
  markerWidthInches,
  markerPixelWidth,
  bodyType,
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
      throw new Error("Please mark both ends of your reference object on the photo.");
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

  const leftShoulder = getKeypoint(pose, "left_shoulder", CORE_MIN_SCORE);
  const rightShoulder = getKeypoint(pose, "right_shoulder", CORE_MIN_SCORE);
  const leftElbow = getKeypoint(pose, "left_elbow", CORE_MIN_SCORE);
  const rightElbow = getKeypoint(pose, "right_elbow", CORE_MIN_SCORE);
  const leftWrist = getKeypoint(pose, "left_wrist", CORE_MIN_SCORE);
  const rightWrist = getKeypoint(pose, "right_wrist", CORE_MIN_SCORE);
  const leftHip = getKeypoint(pose, "left_hip", CORE_MIN_SCORE);
  const rightHip = getKeypoint(pose, "right_hip", CORE_MIN_SCORE);
  const leftKnee = getKeypoint(pose, "left_knee", CORE_MIN_SCORE);
  const rightKnee = getKeypoint(pose, "right_knee", CORE_MIN_SCORE);
  const leftAnkle = getKeypoint(pose, "left_ankle", CORE_MIN_SCORE);
  const rightAnkle = getKeypoint(pose, "right_ankle", CORE_MIN_SCORE);
  const nose = getKeypoint(pose, "nose", FACE_MIN_SCORE);
  const leftEye = getKeypoint(pose, "left_eye", FACE_MIN_SCORE);
  const rightEye = getKeypoint(pose, "right_eye", FACE_MIN_SCORE);
  const leftEar = getKeypoint(pose, "left_ear", FACE_MIN_SCORE);
  const rightEar = getKeypoint(pose, "right_ear", FACE_MIN_SCORE);

  const missingCore = CORE_KEYPOINTS.filter((name) => {
    const point = getKeypoint(pose, name, CORE_MIN_SCORE);
    return !point;
  });
  if (missingCore.length) {
    throw new Error(
      `Couldn't clearly see: ${missingCore.map((n) => n.replace("_", " ")).join(", ")}. ` +
        "Retake the photo with your full body visible, good lighting, and arms slightly away from your sides."
    );
  }

  // Calibration: MoveNet has no "top of head" keypoint, so the true crown position has to be
  // inferred. Using the raw topmost detected keypoint (previously any of nose/eye/ear/shoulder,
  // whichever scored highest) systematically undercounts pixel height, since even the eyes sit
  // noticeably below the crown - which then throws off every measurement derived from
  // pixelsPerInch, not just height. Correct for it using standard figure-proportion fractions:
  // the eye-line sits ~6.7% of total height below the crown (roughly half a head-height, with
  // adult head height averaging ~1/7.5 of total height); the shoulder line sits ~16.7% below
  // the crown (~1.25 head-heights). These are population averages, not this specific person's
  // proportions, but they're a large improvement over assuming zero offset.
  const faceTop = [nose, leftEye, rightEye, leftEar, rightEar].filter(Boolean);
  const bottomCandidates = [leftAnkle, rightAnkle, leftKnee, rightKnee].filter(Boolean).map((p) => p.y);
  const bottomY = Math.max(...bottomCandidates);

  let topY;
  let topFraction; // fraction of total height the raw span (topY to bottomY) represents
  let calibrationQuality;
  if (faceTop.length) {
    topY = Math.min(...faceTop.map((p) => p.y));
    topFraction = 0.933;
    calibrationQuality = "good";
  } else {
    topY = Math.min(leftShoulder.y, rightShoulder.y);
    topFraction = 0.833;
    calibrationQuality = "reduced";
  }

  const pixelBodyHeightRaw = bottomY - topY;
  if (!Number.isFinite(pixelBodyHeightRaw) || pixelBodyHeightRaw <= 1) {
    throw new Error("Could not infer body scale from image.");
  }
  const pixelBodyHeight = pixelBodyHeightRaw / topFraction;

  let pixelsPerInch;
  if (calibrationMode === "marker") {
    pixelsPerInch = markerPixels / markerWidth;
  } else {
    pixelsPerInch = pixelBodyHeight / height;
  }

  const ratios = getRatios(bodyType);

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

  const bust = Number.isFinite(shoulderWidth) ? shoulderWidth * ratios.bust : null;
  const waist = Number.isFinite(hipWidth) ? hipWidth * ratios.waist : null;
  const hips = Number.isFinite(hipWidth) ? hipWidth * ratios.hips : null;
  const neck = Number.isFinite(shoulderWidth) ? shoulderWidth * ratios.neck : null;
  const sleeveLength = Number.isFinite(armLength) ? armLength * 0.95 : null;
  const thigh = Number.isFinite(hipWidth) ? hipWidth * ratios.thigh : null;
  const calf = Number.isFinite(thigh) ? thigh * ratios.calf : null;

  const midShoulder = midpoint(leftShoulder, rightShoulder);
  const backLengthRaw = toInches(distance(midShoulder, midHip), pixelsPerInch);
  const backLength = Number.isFinite(backLengthRaw) ? backLengthRaw * 1.05 : null;
  const bicep = Number.isFinite(shoulderWidth) ? shoulderWidth * ratios.bicep : null;
  const wrist = Number.isFinite(shoulderWidth) ? shoulderWidth * ratios.wrist : null;
  const ankleCircumference = Number.isFinite(calf) ? calf * ratios.ankle : null;
  // rise (crotch depth) and garmentLength (customer's chosen finished hem) cannot be inferred
  // from a single front-facing standing photo - left for manual entry rather than guessed.
  const rise = null;
  const garmentLength = null;

  const keypointList = [
    ["left_shoulder", leftShoulder],
    ["right_shoulder", rightShoulder],
    ["left_elbow", leftElbow],
    ["right_elbow", rightElbow],
    ["left_wrist", leftWrist],
    ["right_wrist", rightWrist],
    ["left_hip", leftHip],
    ["right_hip", rightHip],
    ["left_knee", leftKnee],
    ["right_knee", rightKnee],
    ["left_ankle", leftAnkle],
    ["right_ankle", rightAnkle],
    ["nose", nose],
  ].filter(([, point]) => Boolean(point));

  const confidence = average(keypointList.map(([, point]) => point.score ?? 0)) ?? 0;
  const perKeypointConfidence = Object.fromEntries(
    keypointList.map(([name, point]) => [name, round1(point.score ?? 0)])
  );

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
      backLength: round1(backLength),
      bicep: round1(bicep),
      wrist: round1(wrist),
      ankleCircumference: round1(ankleCircumference),
      rise,
      garmentLength,
    },
    // Natural-image-pixel keypoints so the UI can draw a skeleton overlay for visual
    // confirmation of what was actually detected, before the user trusts the numbers.
    keypoints: keypointList.map(([name, point]) => ({ name, x: point.x, y: point.y, score: point.score ?? 0 })),
    diagnostics: {
      calibrationMode,
      calibrationQuality,
      bodyType: bodyType || "DEFAULT",
      pixelBodyHeight: round1(pixelBodyHeight),
      pixelsPerInch: round1(pixelsPerInch),
      markerWidthInches: calibrationMode === "marker" ? round1(markerWidth) : null,
      markerPixelWidth: calibrationMode === "marker" ? round1(markerPixels) : null,
      keypointConfidence: round1(confidence),
      perKeypointConfidence,
    },
  };
};
