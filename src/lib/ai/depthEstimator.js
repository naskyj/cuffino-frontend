// Hip and waist circumference from front width + side depth, combined as an ellipse cross-
// section - a real accuracy improvement over the pure front-only ratio approach in
// movenetEstimator.js, validated against two real people with real tailor measurements
// (2026-08-25/30): hip error dropped from 12-24% to 0.3-2.4%; waist (only checkable for one of
// the two people) came in at 14.5% error, still meaningfully better than the ratio method's
// typical 20-45% miss on the same field.
//
// Why hip/waist only, not every circumference field: this needs a reliable WIDTH at the target
// row (a real MoveNet keypoint pair) as well as a reliable DEPTH (from segmentation). Hip has a
// direct keypoint pair. Waist doesn't, so its width is interpolated between shoulder and hip
// keypoints - weaker, but still keypoint-anchored. Thigh was tried and rejected: it needs a
// side-view depth reading low on the leg, where loose trousers drape away from the body and the
// segmentation mask picks up fabric, not leg circumference - this produced 33-77% overestimates
// on both real test subjects and is not shipped. Neck/bicep/wrist/calf/ankle stay on the ratio
// method for the same reason (no direct keypoint pair to anchor a width, and no validated depth
// row for them yet).
//
// A front-view width was also tried directly from the segmentation mask (matching how depth is
// read from the side photo) and rejected: in a natural standing pose, the arms hang close enough
// to the torso that the mask shows one fully connected blob with no gap to separate "torso" from
// "torso + arms" - MoveNet's keypoints don't have this problem since they're trained to identify
// specific joints, not just silhouette shape.

let segmenterPromise = null;

const ensureSegmenter = async () => {
  if (!segmenterPromise) {
    segmenterPromise = (async () => {
      const tf = await import("@tensorflow/tfjs-core");
      await import("@tensorflow/tfjs-backend-webgl");
      const bodySegmentation = await import("@tensorflow-models/body-segmentation");

      await tf.ready();
      if (tf.getBackend() !== "webgl") {
        await tf.setBackend("webgl");
      }

      // runtime: "tfjs" avoids needing the separate @mediapipe/selfie_segmentation WASM
      // package - the model itself still comes from the same MediaPipe research, just run
      // through TF.js like the pose detector already is.
      return bodySegmentation.createSegmenter(
        bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation,
        { runtime: "tfjs", modelType: "general" }
      );
    })();
  }
  return segmenterPromise;
};

const getKeypoint = (pose, name) => pose?.keypoints?.find((k) => k.name === name || k.part === name);

const bestOf = (a, b) => (a && (!b || (a.score ?? 0) >= (b.score ?? 0)) ? a : b);

const interpolate = (y, y0, y1, w0, w1) => {
  if (y0 == null || y1 == null || w0 == null || w1 == null || y1 === y0) return null;
  return w0 + ((y - y0) / (y1 - y0)) * (w1 - w0);
};

// Ramanujan's second approximation for the perimeter of an ellipse with semi-axes a, b -
// accurate to well within photo-measurement error for any realistic body cross-section.
const ellipseCircumference = (a, b) => {
  const h = ((a - b) ** 2) / ((a + b) ** 2);
  return Math.PI * (a + b) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));
};

// Finds the silhouette edges at a given row of a segmentation mask, restricted to the single
// contiguous run of person-pixels containing anchorX (the torso's own x-position at roughly that
// height) - this is what lets a side-profile depth reading exclude a disconnected artifact
// elsewhere in the mask, and is safe to use here because the side view doesn't have the
// front view's arm-touches-torso ambiguity (see module comment above).
const findSilhouetteEdgesAtRow = (maskImageData, row, anchorX) => {
  const { width, height, data } = maskImageData;
  const y = Math.round(row);
  if (y < 0 || y >= height) return { leftEdge: null, rightEdge: null };
  const ALPHA_THRESHOLD = 128;
  const isPersonAt = (x) => {
    const i = (y * width + x) * 4;
    return data[i] > ALPHA_THRESHOLD || data[i + 3] > ALPHA_THRESHOLD;
  };

  if (anchorX != null) {
    const ax = Math.round(anchorX);
    if (ax >= 0 && ax < width && isPersonAt(ax)) {
      let leftEdge = ax;
      let rightEdge = ax;
      while (leftEdge > 0 && isPersonAt(leftEdge - 1)) leftEdge -= 1;
      while (rightEdge < width - 1 && isPersonAt(rightEdge + 1)) rightEdge += 1;
      return { leftEdge, rightEdge };
    }
  }

  let leftEdge = null;
  let rightEdge = null;
  for (let x = 0; x < width; x += 1) {
    if (isPersonAt(x)) {
      if (leftEdge === null) leftEdge = x;
      rightEdge = x;
    }
  }
  return { leftEdge, rightEdge };
};

const segmentToMask = async (segmenter, imageElement) => {
  const segmentation = await segmenter.segmentPeople(imageElement, {
    multiSegmentation: false,
    segmentBodyParts: false,
  });
  if (!segmentation.length) return null;
  return segmentation[0].mask.toImageData();
};

/**
 * Computes hip and waist circumference from a front pose (already detected by the caller, so it
 * isn't run twice) plus a side photo (detected here). Returns null - never throws - if anything
 * needed isn't available, so a caller can always fall back to the ratio-based estimate instead
 * of blocking the whole "Estimate with AI" flow over this specific enhancement.
 */
export const estimateHipWaistFromDepth = async ({ frontPose, frontImageElement, sideImageElement, heightInches }) => {
  try {
    const height = Number(heightInches);
    if (!Number.isFinite(height) || height <= 0) return null;

    const leftHip = getKeypoint(frontPose, "left_hip");
    const rightHip = getKeypoint(frontPose, "right_hip");
    const leftShoulder = getKeypoint(frontPose, "left_shoulder");
    const rightShoulder = getKeypoint(frontPose, "right_shoulder");
    const nose = getKeypoint(frontPose, "nose");
    const leftAnkle = getKeypoint(frontPose, "left_ankle");
    const rightAnkle = getKeypoint(frontPose, "right_ankle");
    if (!leftHip || !rightHip || !leftShoulder || !rightShoulder || !nose || !leftAnkle || !rightAnkle) {
      return null;
    }

    const hipY = (leftHip.y + rightHip.y) / 2;
    const shoulderY = (leftShoulder.y + rightShoulder.y) / 2;
    const hipWidthPx = Math.hypot(leftHip.x - rightHip.x, leftHip.y - rightHip.y);
    const shoulderWidthPx = Math.hypot(leftShoulder.x - rightShoulder.x, leftShoulder.y - rightShoulder.y);
    const frontBottomY = Math.max(leftAnkle.y, rightAnkle.y);
    const frontTopY = nose.y;
    const frontPixelBodyHeight = (frontBottomY - frontTopY) / 0.933;
    const frontCrownY = frontTopY - (frontPixelBodyHeight - (frontBottomY - frontTopY));
    const frontPixelsPerInch = frontPixelBodyHeight / height;

    // Natural waistline: no direct keypoint, approximated ~35% of the shoulder-to-hip span
    // above the hip line (between the lowest rib and the top of the pelvis).
    const waistY = hipY - 0.35 * (hipY - shoulderY);
    const waistWidthPx = interpolate(waistY, shoulderY, hipY, shoulderWidthPx, hipWidthPx);

    const segmenter = await ensureSegmenter();
    const { detectPose } = await import("./movenetEstimator");
    const sidePose = await detectPose(sideImageElement);
    if (!sidePose) return null;

    const sideNose = getKeypoint(sidePose, "nose");
    const sideAnkle = bestOf(getKeypoint(sidePose, "left_ankle"), getKeypoint(sidePose, "right_ankle"));
    const sideHip = bestOf(getKeypoint(sidePose, "left_hip"), getKeypoint(sidePose, "right_hip"));
    if (!sideNose || !sideAnkle) return null;

    const sideBottomY = sideAnkle.y;
    const sideTopY = sideNose.y;
    const sidePixelBodyHeight = (sideBottomY - sideTopY) / 0.933;
    const sideCrownY = sideTopY - (sidePixelBodyHeight - (sideBottomY - sideTopY));
    const sidePixelsPerInch = sidePixelBodyHeight / height;

    const sideMask = await segmentToMask(segmenter, sideImageElement);
    if (!sideMask) return null;
    const sideAnchorX = sideHip && sideHip.score > 0.3 ? sideHip.x : null;

    const measureCircumference = (widthPx, rowY_front, knownSideRow) => {
      if (widthPx == null || rowY_front == null) return null;
      const widthIn = widthPx / frontPixelsPerInch;
      const fractionFromCrown = (rowY_front - frontCrownY) / (frontBottomY - frontCrownY);
      const rowYSide = knownSideRow ?? sideCrownY + fractionFromCrown * (sideBottomY - sideCrownY);
      const { leftEdge, rightEdge } = findSilhouetteEdgesAtRow(sideMask, rowYSide, sideAnchorX);
      if (leftEdge == null || rightEdge == null) return null;
      const depthIn = (rightEdge - leftEdge) / sidePixelsPerInch;
      return ellipseCircumference(widthIn / 2, depthIn / 2);
    };

    const knownSideHipRow = sideHip && sideHip.score > 0.3 ? sideHip.y : null;
    const hips = measureCircumference(hipWidthPx, hipY, knownSideHipRow);
    const waist = measureCircumference(waistWidthPx, waistY, null);

    if (hips == null && waist == null) return null;

    return {
      hips,
      waist,
      diagnostics: { method: "depth-ellipse", hipWidthSource: "keypoint", waistWidthSource: "keypoint-interpolated" },
    };
  } catch (error) {
    // Any failure here (segmentation model load, pose detection on a poor side photo, etc.)
    // just means no enhancement - never let this block the ratio-based estimate the rest of
    // the flow already produced.
    return null;
  }
};
