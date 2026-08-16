"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import Button from "@/components/button";
import { estimateMeasurementsWithMoveNet } from "@/lib/ai/movenetEstimator";

const CALIBRATION_OPTIONS = [
  { value: "height", label: "Use Height" },
  { value: "marker", label: "Use Reference Marker" },
];

const MAX_DISPLAY_WIDTH = 420;
const MAX_DISPLAY_HEIGHT = 620;

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
  const base = `AI estimate (MoveNet Thunder): confidence ${diagnostics.keypointConfidence}/1, pixelsPerInch ${diagnostics.pixelsPerInch}.`;
  const calibrationNote =
    diagnostics.calibrationMode === "marker"
      ? `Calibration: reference marker (${diagnostics.markerWidthInches}in / ${diagnostics.markerPixelWidth}px).`
      : `Calibration: height (${diagnostics.calibrationQuality === "reduced" ? "reduced confidence - face not clearly visible" : "good"}).`;
  return `${base} ${calibrationNote} Please verify manually.`;
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

  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
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

  const markerPixelWidth = useMemo(() => {
    if (markerPoints.length !== 2) return "";
    const [a, b] = markerPoints;
    return Math.round(Math.hypot(a.x - b.x, a.y - b.y));
  }, [markerPoints]);

  const canEstimate = useMemo(() => {
    if (!imageInfo) return false;
    if (calibrationMode === "marker") return markerPoints.length === 2;
    return true;
  }, [imageInfo, calibrationMode, markerPoints]);

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

    try {
      setIsEstimating(true);
      const result = await estimateMeasurementsWithMoveNet({
        imageElement: imageInfo.element,
        calibrationMode,
        heightInches: Number(heightInches),
        markerWidthInches: Number(markerWidthInches),
        markerPixelWidth: Number(markerPixelWidth),
        bodyType,
      });

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
      setIsEstimating(false);
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

      {lastDiagnostics && (
        <div className="mt-3 rounded-md border border-gray-200 bg-white p-2 text-[11px] text-gray-600">
          Confidence: {lastDiagnostics.keypointConfidence}/1
          {lastDiagnostics.calibrationQuality === "reduced" &&
            " - face not clearly visible, height calibration is a rougher estimate"}
        </div>
      )}

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
      </div>
    </div>
  );
}
