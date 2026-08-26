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
 *
 * waist/hips/neck/thigh were previously roughly half of realistic adult anthropometric ratios
 * (e.g. neck: 0.37 x an ~16in shoulder width produced a ~6in "neck", which is not a real neck
 * size for anyone) - caught 2026-08-23 by finally running this against a real full-body photo
 * for the first time (every prior verification of this feature had tested the surrounding
 * plumbing - upload, consent, calibration switching - never an actual detection+math run).
 *
 * That first fix (2026-08-23) used textbook anthropometric proportions, not real data. A second
 * pass (2026-08-25), against two more real photos with real tailor-measured ground truth
 * (hips/thigh/neck/bicep/waist confirmed as genuine circumferences, not garment-draft half
 * measurements), showed the textbook ratios were STILL roughly half of what was needed - e.g.
 * hips needed ~5.16x hipWidth for MEN, not 2.65x. Root cause traced further than the ratio table
 * itself: the raw hipWidth/shoulderWidth keypoint distances these ratios multiply are themselves
 * running low, most likely because a single 2D front photo has no way to see front-to-back body
 * depth, which materially affects circumference - MoveNet's joint keypoints capture frontal width
 * only, not girth. Diagnostic detail: for both photos, no plausible real height could reconcile
 * the shoulder-width gap alone (required implied heights of ~87in and ~102in), and hips required
 * an even less plausible implied height than shoulders - ruling out "just a wrong height guess"
 * and confirming hips/waist/thigh/neck/bicep carry error beyond whatever the shoulder/hip
 * calibration itself contributes. These ratios are now fit directly to close that combined gap
 * (calibration error + width-vs-circumference error folded into one empirical multiplier), since
 * the two error sources can't be cleanly separated without a marker-calibrated (known-object-size)
 * real photo, which wasn't available for this pass. bust/calf/wrist/ankle were left alone - no
 * confidently-interpretable real ground truth was available for them this pass (bust's closest
 * real analog, "Chest," was ambiguous between a full circumference and a half/draft measurement
 * on both sheets, so wasn't used to avoid recalibrating against a guess).
 *
 * n=2 real people, both apparently adult men - MEN's values are the direct empirical fit; DEFAULT/
 * WOMEN/CHILDREN are scaled by the same per-field correction factor applied to MEN's prior values,
 * preserving each set's existing relative shape rather than fitting them independently (no real
 * data for those categories yet). Expect further tuning as more real photos come in - flagged in
 * WORK_LOG.md as a small-sample calibration, not a settled result.
 *
 * calf is derived from thigh (calf = thigh x calfRatio), not from hipWidth directly - roughly
 * doubling the thigh ratio above without touching calf's own ratio would have silently doubled
 * calf (and, cascading further, ankle) right along with it, even though there's no real ground
 * truth for either in this pass. calfRatio is reduced here by the same ~2.06x factor thigh grew
 * by, specifically to hold calf/ankle's *output values* steady at their pre-existing (untouched,
 * separately-plausible) numbers rather than silently inflating them as a side effect of a fix
 * aimed at thigh.
 */
const RATIO_SETS = {
  DEFAULT: { bust: 1.95, waist: 4.01, hips: 5.45, neck: 1.14, thigh: 3.30, calf: 0.33, bicep: 1.04, wrist: 0.36, ankle: 0.72 },
  MEN: { bust: 2.0, waist: 4.18, hips: 5.16, neck: 1.23, thigh: 3.30, calf: 0.33, bicep: 1.10, wrist: 0.37, ankle: 0.72 },
  WOMEN: { bust: 1.92, waist: 3.66, hips: 5.64, neck: 1.08, thigh: 3.41, calf: 0.33, bicep: 0.99, wrist: 0.35, ankle: 0.72 },
  CHILDREN: { bust: 1.95, waist: 4.01, hips: 5.45, neck: 1.14, thigh: 3.30, calf: 0.33, bicep: 1.04, wrist: 0.36, ankle: 0.72 },
};

const getRatios = (bodyType) => RATIO_SETS[bodyType] || RATIO_SETS.DEFAULT;

// Quality gate run before AI processing, not after - the PRD's "FAIL -> explain -> guide ->
// retake" flow. Brightness is the one lighting/framing check that's actually reliable to compute
// client-side from pixel data alone; things like "multiple people in frame" aren't checkable
// with a SINGLEPOSE model (it only ever returns one pose, by construction) so aren't attempted
// here rather than faked.
const MIN_AVG_BRIGHTNESS = 40; // 0-255 scale
const MAX_AVG_BRIGHTNESS = 240;
const BRIGHTNESS_SAMPLE_SIZE = 64; // downscaled - average brightness doesn't need full resolution

const computeAverageBrightness = (imageElement) => {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = BRIGHTNESS_SAMPLE_SIZE;
    canvas.height = BRIGHTNESS_SAMPLE_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(imageElement, 0, 0, BRIGHTNESS_SAMPLE_SIZE, BRIGHTNESS_SAMPLE_SIZE);
    const { data } = ctx.getImageData(0, 0, BRIGHTNESS_SAMPLE_SIZE, BRIGHTNESS_SAMPLE_SIZE);
    let total = 0;
    let count = 0;
    for (let i = 0; i < data.length; i += 4) {
      // Perceptual luminance weighting, not a flat RGB average.
      total += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      count += 1;
    }
    return count ? total / count : null;
  } catch (error) {
    // Canvas can be tainted in rare cross-origin cases - skip the check rather than block
    // estimation over something unrelated to actual photo quality.
    return null;
  }
};

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

  const avgBrightness = computeAverageBrightness(imageElement);
  if (avgBrightness !== null) {
    if (avgBrightness < MIN_AVG_BRIGHTNESS) {
      throw new Error(
        "Photo appears too dark. Retake in better lighting - a well-lit room or daylight near a window works best."
      );
    }
    if (avgBrightness > MAX_AVG_BRIGHTNESS) {
      throw new Error(
        "Photo appears overexposed or washed out. Retake with less direct light, or move away from a bright background."
      );
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
      averageBrightness: round1(avgBrightness),
    },
  };
};
