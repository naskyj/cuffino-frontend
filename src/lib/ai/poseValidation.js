// Geometric sanity checks run on a MoveNet pose immediately after a photo is selected, before
// the user ever clicks "Estimate with AI" - so a photo that would produce garbage numbers gets
// rejected with a specific, actionable reason instead of silently feeding a bad measurement
// downstream. This is a proxy for the standardized capture pose real body-scanning apps require
// (see the WORK_LOG discussion, 2026-09-07): full body in frame, facing the camera, arms held
// with a visible gap from the torso.
//
// The arm-gap check specifically targets the gap the rejected limb-circumference technique
// needed and never had in any photo collected so far (see depthEstimator.js's module comment) -
// it doesn't change accuracy of anything currently shipped (hip/waist/bust/neck don't depend on
// arm position), but it's what would eventually make limb circumference attemptable again, and
// it's cheap to start enforcing now rather than retroactively once enough well-posed photos exist.

const CONFIDENCE_THRESHOLD = 0.3;
const SHOULDER_TILT_MAX = 0.25;
const ARM_GAP_MIN = 0.15;

const getKeypoint = (keypoints, name) => keypoints?.find((k) => k.name === name || k.part === name);

const isVisible = (kp) => Boolean(kp) && (kp.score ?? 0) >= CONFIDENCE_THRESHOLD;

export const validateFrontPose = (keypoints) => {
  const nose = getKeypoint(keypoints, "nose");
  const leftShoulder = getKeypoint(keypoints, "left_shoulder");
  const rightShoulder = getKeypoint(keypoints, "right_shoulder");
  const leftHip = getKeypoint(keypoints, "left_hip");
  const rightHip = getKeypoint(keypoints, "right_hip");
  const leftElbow = getKeypoint(keypoints, "left_elbow");
  const rightElbow = getKeypoint(keypoints, "right_elbow");
  const leftAnkle = getKeypoint(keypoints, "left_ankle");
  const rightAnkle = getKeypoint(keypoints, "right_ankle");

  const core = [nose, leftShoulder, rightShoulder, leftHip, rightHip, leftAnkle, rightAnkle];
  if (!core.every(isVisible)) {
    return {
      valid: false,
      reason: "We couldn't clearly see your full body (head to feet) in this photo. Please retake with your whole body in frame, in good lighting, against a plain background.",
    };
  }

  const shoulderWidth = Math.hypot(leftShoulder.x - rightShoulder.x, leftShoulder.y - rightShoulder.y);
  if (shoulderWidth <= 0) {
    return { valid: false, reason: "We couldn't get a clear reading of your shoulders. Please retake facing the camera directly." };
  }

  const shoulderTilt = Math.abs(leftShoulder.y - rightShoulder.y) / shoulderWidth;
  if (shoulderTilt > SHOULDER_TILT_MAX) {
    return { valid: false, reason: "Please stand facing the camera directly, with your shoulders level, and retake the photo." };
  }

  const hasGap = (elbow, shoulderX) => isVisible(elbow) && Math.abs(elbow.x - shoulderX) / shoulderWidth > ARM_GAP_MIN;
  if (!hasGap(leftElbow, leftShoulder.x) || !hasGap(rightElbow, rightShoulder.x)) {
    return {
      valid: false,
      reason: "Please hold your arms slightly away from your sides (not resting against your body) and retake the photo.",
    };
  }

  return { valid: true, reason: null };
};

export const validateSidePose = (keypoints) => {
  const nose = getKeypoint(keypoints, "nose");
  const leftAnkle = getKeypoint(keypoints, "left_ankle");
  const rightAnkle = getKeypoint(keypoints, "right_ankle");
  const leftHip = getKeypoint(keypoints, "left_hip");
  const rightHip = getKeypoint(keypoints, "right_hip");

  const ankle = isVisible(leftAnkle) ? leftAnkle : rightAnkle;
  const hip = isVisible(leftHip) ? leftHip : rightHip;

  if (!isVisible(nose) || !isVisible(ankle) || !isVisible(hip)) {
    return {
      valid: false,
      reason: "We couldn't clearly see your full body (head to feet) in this side photo. Please retake with your whole body in frame, standing 90 degrees to the camera.",
    };
  }

  return { valid: true, reason: null };
};
