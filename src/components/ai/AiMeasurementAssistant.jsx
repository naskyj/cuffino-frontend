"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import Button from "@/components/button";
import { estimateMeasurementsWithMoveNet } from "@/lib/ai/movenetEstimator";
import { ImageServices } from "@/services/images";

const REFERENCE_PHOTO_LABELS = [
  { value: "SIDE_VIEW", label: "Side View" },
  { value: "CLOSE_UP", label: "Close-up" },
];

const CALIBRATION_OPTIONS = [
  { value: "height", label: "Use Height" },
  { value: "marker", label: "Use Reference Marker" },
];

const MAX_DISPLAY_WIDTH = 420;
const MAX_DISPLAY_HEIGHT = 620;

// The first estimate in a session downloads a several-MB AI model fresh from Google's model
// hub - on a slow connection (observed as low as ~450KB/s from real tester feedback) that alone
// can take well over 20 seconds, and until now the button just said "Estimating..." with no
// indication anything was still happening or how long to expect, which read as frozen/broken.
const ESTIMATE_SLOW_HINT_MS = 6000;
const ESTIMATE_TIMEOUT_MS = 60000;

const withTimeout = (promise, ms, message) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms)),
  ]);

const SKELETON_EDGES = [
  ["left_shoulder", "right_shoulder"],
  ["left_shoulder", "left_elbow"],
  ["left_elbow", "left_wrist"],
  ["right_shoulder", "right_elbow"],
  ["right_elbow", "right_wrist"],
  ["left_shoulder", "left_hip"],
  ["right_shoulder", "right_hip"],
  ["left_hip", "right_hip"],
  ["left_hip", "left_knee"],
  ["left_knee", "left_ankle"],
  ["right_hip", "right_knee"],
  ["right_knee", "right_ankle"],
];

const loadImageElement = (src) =>
  new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to read selected image."));
    image.src = src;
  });

const buildAiNote = (diagnostics) => {
  const base = `AI estimate (MoveNet Thunder): detection quality ${diagnostics.keypointConfidence}/1, pixelsPerInch ${diagnostics.pixelsPerInch}.`;
  const calibrationNote =
    diagnostics.calibrationMode === "marker"
      ? `Calibration: reference marker (${diagnostics.markerWidthInches}in / ${diagnostics.markerPixelWidth}px).`
      : `Calibration: height (${diagnostics.calibrationQuality === "reduced" ? "reduced confidence - face not clearly visible" : "good"}).`;
  const consentNote = `Customer consented to AI photo analysis at ${new Date().toLocaleString()}.`;
  return `${base} ${calibrationNote} ${consentNote} Please verify manually.`;
};

const CALIBRATION_HELP = {
  height: {
    title: "Use Height",
    text:
      "Enter your height, and the AI finds your head and feet in the photo. It compares that " +
      "pixel distance to the height you entered to work out how many pixels equal one inch, " +
      "then uses that same ratio for every other measurement. Fastest option - no extra props " +
      "needed. Accuracy depends on your height being entered correctly and your whole body " +
      "(head to feet) being clearly visible and reasonably straight in the photo.",
  },
  marker: {
    title: "Use Reference Marker",
    text:
      "Instead of relying on your stated height, you place something of a known, fixed size " +
      "(a credit/ID card by default) in the photo, at roughly the same distance from the " +
      "camera as your body, then click both ends of it directly on the photo. The app measures " +
      "that click-to-click distance against the object's real size to work out the same " +
      "pixels-to-inches ratio. One extra step, but you're confirming the scale yourself instead " +
      "of relying on an automatic head-to-foot detection - can be more accurate.",
    steps: [
      "Select \"Use Reference Marker.\"",
      "Get a credit/ID card (or enter a custom width if using something else).",
      "In the photo, hold the card flat against your body, or place it beside your feet - about the same distance from the camera as you are.",
      "Upload the photo.",
      "Click both ends of the card directly on the photo that appears.",
      "Click \"Estimate with AI.\"",
    ],
  },
};

export default function AiMeasurementAssistant({ onApply, bodyType }) {
  const [calibrationMode, setCalibrationMode] = useState("height");
  const [showCalibrationHelp, setShowCalibrationHelp] = useState(false);
  const [heightInches, setHeightInches] = useState("");
  const [markerWidthInches, setMarkerWidthInches] = useState("3.375");
  const [markerPoints, setMarkerPoints] = useState([]); // natural-image-pixel coords, up to 2
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [imageInfo, setImageInfo] = useState(null); // { element, naturalWidth, naturalHeight, displayWidth, displayHeight, scale }
  const [detectedKeypoints, setDetectedKeypoints] = useState(null);
  const [lastDiagnostics, setLastDiagnostics] = useState(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [estimatingLabel, setEstimatingLabel] = useState("Estimating...");
  const [consentGiven, setConsentGiven] = useState(false);

  // Supplementary photos (side view, close-ups) - stored as reference material for whoever
  // reviews the measurements, not fed into the AI's math. A single front photo can't support
  // real circumference math anyway (see the calibration help panel); these just give a human
  // reviewer more to look at.
  const [referencePhotos, setReferencePhotos] = useState([]); // { id, label, status, previewUrl, imageId }
  const [referenceLabel, setReferenceLabel] = useState("SIDE_VIEW");

  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const referenceInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const libraryInputRef = useRef(null);

  const revokeCurrentPreview = () => {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
  };

  useEffect(() => {
    return () => {
      revokeCurrentPreview();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imagePreviewUrl]);

  useEffect(() => {
    return () => {
      referencePhotos.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
    };
    // Only run on unmount - referencePhotos changes on every add/remove, we don't want to
    // revoke earlier photos' URLs on every render, only ones still present when this unmounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markerPixelWidth = useMemo(() => {
    if (markerPoints.length !== 2) return "";
    const [a, b] = markerPoints;
    return Math.round(Math.hypot(a.x - b.x, a.y - b.y));
  }, [markerPoints]);

  const canEstimate = useMemo(() => {
    if (!imageInfo || !consentGiven) return false;
    if (calibrationMode === "marker") return markerPoints.length === 2;
    return true;
  }, [imageInfo, consentGiven, calibrationMode, markerPoints]);

  const draw = (info, points, keypoints) => {
    const canvas = canvasRef.current;
    if (!canvas || !info) return;
    const ctx = canvas.getContext("2d");
    canvas.width = info.displayWidth;
    canvas.height = info.displayHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(info.element, 0, 0, info.displayWidth, info.displayHeight);

    if (points?.length) {
      ctx.strokeStyle = "#f59e0b";
      ctx.fillStyle = "#f59e0b";
      ctx.lineWidth = 2;
      if (points.length === 2) {
        ctx.beginPath();
        ctx.moveTo(points[0].x * info.scale, points[0].y * info.scale);
        ctx.lineTo(points[1].x * info.scale, points[1].y * info.scale);
        ctx.stroke();
      }
      points.forEach((point) => {
        ctx.beginPath();
        ctx.arc(point.x * info.scale, point.y * info.scale, 5, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    if (keypoints?.length) {
      const byName = Object.fromEntries(keypoints.map((point) => [point.name, point]));
      ctx.strokeStyle = "#22c55e";
      ctx.lineWidth = 2;
      SKELETON_EDGES.forEach(([fromName, toName]) => {
        const from = byName[fromName];
        const to = byName[toName];
        if (!from || !to) return;
        ctx.beginPath();
        ctx.moveTo(from.x * info.scale, from.y * info.scale);
        ctx.lineTo(to.x * info.scale, to.y * info.scale);
        ctx.stroke();
      });
      ctx.fillStyle = "#16a34a";
      keypoints.forEach((point) => {
        ctx.beginPath();
        ctx.arc(point.x * info.scale, point.y * info.scale, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  };

  useEffect(() => {
    draw(imageInfo, markerPoints, detectedKeypoints);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageInfo, markerPoints, detectedKeypoints]);

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    revokeCurrentPreview();
    setDetectedKeypoints(null);
    setLastDiagnostics(null);
    setMarkerPoints([]);

    const url = URL.createObjectURL(file);
    setImagePreviewUrl(url);

    try {
      const element = await loadImageElement(url);
      const containerWidth = wrapperRef.current?.clientWidth || MAX_DISPLAY_WIDTH;
      let displayWidth = Math.min(element.naturalWidth, containerWidth, MAX_DISPLAY_WIDTH);
      let displayHeight = displayWidth * (element.naturalHeight / element.naturalWidth);
      if (displayHeight > MAX_DISPLAY_HEIGHT) {
        displayHeight = MAX_DISPLAY_HEIGHT;
        displayWidth = displayHeight * (element.naturalWidth / element.naturalHeight);
      }
      const scale = displayWidth / element.naturalWidth;
      setImageInfo({
        element,
        naturalWidth: element.naturalWidth,
        naturalHeight: element.naturalHeight,
        displayWidth,
        displayHeight,
        scale,
      });
    } catch (error) {
      toast.error(error?.message || "Unable to read selected image.");
    }
  };

  const handleReferencePhotoChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const id = `${Date.now()}-${Math.random()}`;
    const previewUrl = URL.createObjectURL(file);
    const label = REFERENCE_PHOTO_LABELS.find((l) => l.value === referenceLabel)?.label || "Reference";

    setReferencePhotos((current) => [...current, { id, label, status: "uploading", previewUrl }]);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("imageType", "MEASUREMENT_REFERENCE");
      formData.append("description", label);
      const response = await ImageServices.uploadCustomizationImages(formData);
      setReferencePhotos((current) =>
        current.map((photo) =>
          photo.id === id ? { ...photo, status: "done", imageId: response?.data?.imageId } : photo
        )
      );
    } catch (error) {
      setReferencePhotos((current) =>
        current.map((photo) => (photo.id === id ? { ...photo, status: "error" } : photo))
      );
      toast.error(error?.response?.data?.message || "Failed to upload reference photo.");
    }
  };

  const handleRemoveReferencePhoto = async (photo) => {
    setReferencePhotos((current) => current.filter((p) => p.id !== photo.id));
    URL.revokeObjectURL(photo.previewUrl);
    if (photo.imageId) {
      try {
        await ImageServices.deleteCustomizationImage(photo.imageId);
      } catch {
        // Non-fatal - it's already removed from the UI; worst case an orphaned S3 file.
      }
    }
  };

  const handleCanvasClick = (event) => {
    if (calibrationMode !== "marker" || !imageInfo) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const displayX = event.clientX - rect.left;
    const displayY = event.clientY - rect.top;
    const point = { x: displayX / imageInfo.scale, y: displayY / imageInfo.scale };

    setMarkerPoints((current) => {
      if (current.length >= 2) return [point];
      return [...current, point];
    });
  };

  const handleEstimate = async () => {
    if (!imageInfo) {
      toast.error("Please upload a clear front full-body image first.");
      return;
    }

    if (!consentGiven) {
      toast.error("Please confirm you consent to AI analysis of your photo first.");
      return;
    }

    if (calibrationMode === "height" && Number(heightInches) <= 0) {
      toast.error("Please enter a valid height in inches for calibration.");
      return;
    }

    if (calibrationMode === "marker") {
      if (Number(markerWidthInches) <= 0) {
        toast.error("Please enter your reference object's width in inches.");
        return;
      }
      if (markerPoints.length !== 2) {
        toast.error("Click both ends of your reference object on the photo.");
        return;
      }
    }

    let slowHintTimer;
    try {
      setIsEstimating(true);
      setEstimatingLabel("Estimating...");
      slowHintTimer = setTimeout(() => {
        setEstimatingLabel("Still working - downloading the AI model can take longer on slower connections...");
      }, ESTIMATE_SLOW_HINT_MS);

      const result = await withTimeout(
        estimateMeasurementsWithMoveNet({
          imageElement: imageInfo.element,
          calibrationMode,
          heightInches: Number(heightInches),
          markerWidthInches: Number(markerWidthInches),
          markerPixelWidth: Number(markerPixelWidth),
          bodyType,
        }),
        ESTIMATE_TIMEOUT_MS,
        "This is taking much longer than expected, likely a slow connection while the AI model downloads. Please check your connection and try again."
      );

      setDetectedKeypoints(result.keypoints);
      setLastDiagnostics(result.diagnostics);

      const aiNote = buildAiNote(result.diagnostics);
      if (onApply) {
        onApply({
          measurements: result.measurements,
          diagnostics: result.diagnostics,
          aiNote,
        });
      }

      if (result.diagnostics.keypointConfidence < 0.4 || result.diagnostics.calibrationQuality === "reduced") {
        toast.warning(
          "Detection confidence was low - please double-check every measurement before saving."
        );
      } else {
        toast.success("AI measurements generated. Please review and adjust if needed.");
      }
    } catch (error) {
      toast.error(error?.message || "Unable to estimate measurements from the image.");
    } finally {
      clearTimeout(slowHintTimer);
      setIsEstimating(false);
      setEstimatingLabel("Estimating...");
    }
  };

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <p className="text-sm font-semibold text-gray-900">AI Measurement (MoveNet Thunder)</p>
      <p className="text-xs text-gray-600 pt-1">
        Upload a clear front full-body photo (head to feet, arms slightly away from your
        sides, plain background if possible). AI will auto-fill measurements. Please review
        before saving - a single photo can approximate girth measurements (bust/waist/hips/
        etc.) but can&apos;t truly measure them.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3">
        <div>
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-medium text-gray-700">Calibration Mode</label>
            <button
              type="button"
              onClick={() => setShowCalibrationHelp((current) => !current)}
              className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-gray-400 text-[10px] text-gray-600 bg-white hover:bg-gray-50"
              aria-expanded={showCalibrationHelp}
              aria-label="What's the difference between calibration modes?"
            >
              ?
            </button>
          </div>
          <select
            value={calibrationMode}
            onChange={(event) => {
              setCalibrationMode(event.target.value);
              setMarkerPoints([]);
            }}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            {CALIBRATION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {calibrationMode === "height" ? (
          <div>
            <label className="text-xs font-medium text-gray-700">Height (inches)</label>
            <input
              type="number"
              min="1"
              step="0.1"
              value={heightInches}
              onChange={(event) => setHeightInches(event.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="e.g. 68"
            />
          </div>
        ) : (
          <div>
            <label className="text-xs font-medium text-gray-700">Reference object width (inches)</label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={markerWidthInches}
              onChange={(event) => setMarkerWidthInches(event.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="e.g. 3.375"
            />
            <p className="mt-1 text-[11px] text-gray-500">
              Defaults to a standard credit/ID card&apos;s long edge (3.375in). Change this if
              you&apos;re using something else.
            </p>
          </div>
        )}
      </div>

      {showCalibrationHelp && (
        <div className="mt-3 space-y-3 rounded-md border border-amber-300 bg-white p-3 text-xs text-gray-700">
          {Object.entries(CALIBRATION_HELP).map(([key, help]) => (
            <div key={key} className={calibrationMode === key ? "" : "opacity-70"}>
              <p className="font-semibold text-gray-900">
                {help.title}
                {calibrationMode === key && (
                  <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                    selected
                  </span>
                )}
              </p>
              <p className="mt-1">{help.text}</p>
              {help.steps && (
                <ol className="mt-1.5 list-decimal space-y-0.5 pl-4">
                  {help.steps.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="pt-3">
        <label className="text-xs font-medium text-gray-700">Front photo</label>
        {/*
         * Two separate inputs rather than one relying on the OS's default file-picker chooser:
         * on iOS that default chooser reliably offers Camera + Photos + Files, but on Android
         * it's inconsistent - some devices/Chrome versions only surface a gallery/album picker
         * with no camera shortcut at all. `capture` reliably forces the camera on both platforms
         * (that's what caused the original "always opens camera" bug), so it's used deliberately
         * here on a dedicated Take Photo button, with a separate capture-less input for Choose
         * from Library - giving both options explicitly instead of hoping the OS picker does.
         */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />
        <input
          ref={libraryInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <div className="mt-1 flex gap-2">
          <Button
            type="button"
            className="flex-1 border border-gray-300 bg-white text-gray-700 rounded-md"
            onClick={() => cameraInputRef.current?.click()}
          >
            Take Photo
          </Button>
          <Button
            type="button"
            className="flex-1 border border-gray-300 bg-white text-gray-700 rounded-md"
            onClick={() => libraryInputRef.current?.click()}
          >
            Choose from Library
          </Button>
        </div>
      </div>

      {calibrationMode === "marker" && imageInfo && (
        <p className="pt-2 text-xs text-gray-700">
          {markerPoints.length < 2
            ? `Click both ends of your reference object in the photo below (${markerPoints.length}/2 points marked).`
            : `Marked: ${markerPixelWidth}px = ${markerWidthInches}in. Click again to remark.`}
        </p>
      )}

      {imagePreviewUrl && (
        <div ref={wrapperRef} className="pt-3">
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            // Rendered (CSS) size is pinned to exactly match the canvas's internal pixel
            // buffer (set in draw() via canvas.width/height) - if these ever diverge (e.g. a
            // CSS width like w-full stretching it independently of the buffer size), click
            // coordinates from getBoundingClientRect() stop lining up with the buffer's pixel
            // space and marker clicks land in the wrong place.
            style={imageInfo ? { width: imageInfo.displayWidth, height: imageInfo.displayHeight } : undefined}
            className={`max-w-full rounded-md border border-gray-200 bg-white ${
              calibrationMode === "marker" ? "cursor-crosshair" : ""
            }`}
          />
          {detectedKeypoints && (
            <p className="pt-1 text-[11px] text-gray-500">
              Green overlay shows what the AI actually detected - if it looks wrong, retake the
              photo rather than trusting the numbers.
            </p>
          )}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-amber-200">
        <p className="text-xs font-medium text-gray-700">
          Reference Photos <span className="font-normal text-gray-500">(optional)</span>
        </p>
        <p className="mt-0.5 text-[11px] text-gray-500">
          A side view or a close-up of a specific area (waist, sleeve, etc.) helps whoever
          reviews your measurements catch anything the front photo alone can&apos;t show. These
          are attached as reference only - they don&apos;t change the numbers above.
        </p>

        <input
          ref={referenceInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleReferencePhotoChange}
        />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <select
            value={referenceLabel}
            onChange={(event) => setReferenceLabel(event.target.value)}
            className="rounded-md border border-gray-300 px-2 py-1.5 text-xs bg-white"
          >
            {REFERENCE_PHOTO_LABELS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Button
            type="button"
            className="border border-gray-300 bg-white text-gray-700 rounded-md text-xs px-3 py-1.5"
            onClick={() => referenceInputRef.current?.click()}
          >
            + Add Photo
          </Button>
        </div>

        {referencePhotos.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-3">
            {referencePhotos.map((photo) => (
              <div key={photo.id} className="relative w-20">
                <div
                  className={`h-20 w-20 rounded-md border overflow-hidden bg-white ${
                    photo.status === "error" ? "border-red-300" : "border-gray-200"
                  }`}
                >
                  <img
                    src={photo.previewUrl}
                    alt={photo.label}
                    className={`h-full w-full object-cover ${photo.status === "uploading" ? "opacity-50" : ""}`}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveReferencePhoto(photo)}
                  className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-gray-700 text-white text-xs leading-none flex items-center justify-center hover:bg-gray-900"
                  aria-label={`Remove ${photo.label} photo`}
                >
                  &times;
                </button>
                <p className="mt-1 text-[10px] text-center text-gray-500 truncate">
                  {photo.status === "uploading" ? "Uploading..." : photo.status === "error" ? "Failed" : photo.label}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {lastDiagnostics && (
        <div className="mt-3 rounded-md border border-gray-200 bg-white p-2 text-[11px] text-gray-600">
          {/* "Detection quality," not "measurement confidence" - this reflects how clearly the
              AI could see your joints in the photo, not how accurate the resulting numbers are.
              Nothing here is a validated accuracy percentage. */}
          Detection quality: {lastDiagnostics.keypointConfidence}/1
          {lastDiagnostics.calibrationQuality === "reduced" &&
            " - face not clearly visible, height calibration is a rougher estimate"}
        </div>
      )}

      <label className="mt-3 flex items-start gap-2 text-xs text-gray-700">
        <input
          type="checkbox"
          checked={consentGiven}
          onChange={(event) => setConsentGiven(event.target.checked)}
          className="mt-0.5"
        />
        <span>
          I consent to this photo being analyzed by AI to estimate my measurements. The photo
          and its estimated measurements are stored to support my order and reviewed by Cuffino
          staff/tailors as needed.
        </span>
      </label>

      <div className="pt-3">
        <Button
          type="button"
          className="bg-primary text-white rounded-md"
          onClick={handleEstimate}
          disable={!canEstimate || isEstimating}
          loading={isEstimating}
        >
          {isEstimating ? "Estimating..." : "Estimate with AI"}
        </Button>
        {isEstimating && estimatingLabel !== "Estimating..." && (
          <p className="mt-2 text-xs text-gray-600">{estimatingLabel}</p>
        )}
      </div>
    </div>
  );
}
