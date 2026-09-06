// Hip, waist, and bust circumference from front width + side depth, combined as an ellipse
// cross-section - a real accuracy improvement over the pure front-only ratio approach in
// movenetEstimator.js. Validated against real tailor measurements from real people
// (2026-08-25 through 2026-09-06):
//   - Hip: 12-24% error (ratio method) -> 0.3-2.4% error (this method), two real people.
//   - Waist: 20-45% error (ratio method) -> 14.5% error (this method), checkable for only one of
//     those two people (no real waist value was available for the other).
//   - Bust: previously unvalidated (Section 19 - the two people above either had ambiguous or
//     arm-obstructed chest data) - a third person with a clean, unobstructed side photo and a
//     real chest measurement confirmed it works the same way as hip: 41.88in vs a real 41in
//     (2.1% error), with the scan row visually confirmed clear of any arm interference. Hip/waist
//     haven't yet been re-run against this third person.
//
// Why hip/waist/bust only, not every circumference field: this needs a reliable WIDTH at the
// target row (a real MoveNet keypoint pair, or a decent interpolation between two) as well as a
// reliable DEPTH (from segmentation). Hip has a direct keypoint pair. Waist and bust don't, so
// their width is interpolated between shoulder and hip keypoints - weaker, but still
// keypoint-anchored, and validated well enough to ship.
//
// Explicitly tried and REJECTED, do not re-attempt without new test photos or a different
// technique:
//   - Thigh: the side-view depth reading at leg height picks up loose trouser fabric drape, not
//     leg circumference - 33-77% overestimates on two real test subjects (2026-08-30).
//   - Neck: the interpolated width at neck height picks up shoulder/collar along with the neck -
//     58% and 83.5% overestimates on two real people (2026-08-30, 09-06). Not a tunable-parameter
//     problem; the row/width approach doesn't isolate the neck the way it does the torso.
//   - Bicep/wrist/calf/ankle (limb circumference via segmentation, width x pi as a circular
//     diameter): tested at every point along the upper arm on three real people/poses (arms at
//     sides, arms raised, hands in pockets) and got wildly wrong results (68-94in "bicep") every
//     time, because in every photo collected so far the arm rests against the torso with no
//     visible gap in the mask to separate them. This is a photo-pose requirement (arms held
//     clearly away from the body), not something fixable in code - needs new test photos taken
//     that way before attempting this technique again.
//   - Front-view WIDTH directly from the segmentation mask (matching how depth is read from the
//     side photo): in a natural standing pose the arms hang close enough to the torso that the
//     mask shows one fully connected blob with no gap to separate "torso" from "torso + arms" -
//     MoveNet's keypoints don't have this problem since they're trained to identify specific
//     joints, not just silhouette shape, so width still comes from keypoints for every field.

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
 * Computes hip, waist, and bust circumference from a front pose (already detected by the caller,
 * so it isn't run twice) plus a side photo (detected here). Returns null - never throws - if
 * anything needed isn't available, so a caller can always fall back to the ratio-based estimate
 * instead of blocking the whole "Estimate with AI" flow over this specific enhancement.
 */
export const estimateCircumferencesFromDepth = async ({ frontPose, frontImageElement, sideImageElement, heightInches }) => {
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

    // Bust/chest line: no direct keypoint, approximated ~25% of the way down the shoulder-to-hip
    // span (validated against a real chest measurement at 2.1% error - see module comment).
    const bustY = shoulderY + 0.25 * (hipY - shoulderY);
    const bustWidthPx = interpolate(bustY, shoulderY, hipY, shoulderWidthPx, hipWidthPx);

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
    const bust = measureCircumference(bustWidthPx, bustY, null);

    if (hips == null && waist == null && bust == null) return null;

    return {
      hips,
      waist,
      bust,
      diagnostics: {
        method: "depth-ellipse",
        hipWidthSource: "keypoint",
        waistWidthSource: "keypoint-interpolated",
        bustWidthSource: "keypoint-interpolated",
      },
    };
  } catch (error) {
    // Any failure here (segmentation model load, pose detection on a poor side photo, etc.)
    // just means no enhancement - never let this block the ratio-based estimate the rest of
    // the flow already produced.
    return null;
  }
};
