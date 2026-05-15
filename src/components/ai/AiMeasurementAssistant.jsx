"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import Button from "@/components/button";
import { estimateMeasurementsWithMoveNet } from "@/lib/ai/movenetEstimator";

const CALIBRATION_OPTIONS = [
  { value: "height", label: "Use Height" },
  { value: "marker", label: "Use Reference Marker" },
];

const loadImageElement = (src) =>
  new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to read selected image."));
    image.src = src;
  });

const buildAiNote = (diagnostics) => {
  const base = `AI estimate (MoveNet): confidence ${diagnostics.keypointConfidence}/1, pixelsPerInch ${diagnostics.pixelsPerInch}.`;
  if (diagnostics.calibrationMode === "marker") {
    return `${base} Calibration: marker (${diagnostics.markerWidthInches}in / ${diagnostics.markerPixelWidth}px). Please verify manually.`;
  }
  return `${base} Calibration: height. Please verify manually.`;
};

export default function AiMeasurementAssistant({ onApply }) {
  const [calibrationMode, setCalibrationMode] = useState("height");
  const [heightInches, setHeightInches] = useState("");
  const [markerWidthInches, setMarkerWidthInches] = useState("");
  const [markerPixelWidth, setMarkerPixelWidth] = useState("");
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [isEstimating, setIsEstimating] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [isAutoCapturing, setIsAutoCapturing] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const autoCaptureTimeoutRef = useRef(null);

  const revokeCurrentPreview = () => {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
  };

  const stopCamera = () => {
    if (autoCaptureTimeoutRef.current) {
      clearTimeout(autoCaptureTimeoutRef.current);
      autoCaptureTimeoutRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsCameraActive(false);
    setIsAutoCapturing(false);
  };

  const attachStreamToVideo = async () => {
    if (!videoRef.current || !streamRef.current) {
      return;
    }

    if (videoRef.current.srcObject !== streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }

    try {
      await videoRef.current.play();
    } catch {
      // Some browsers may delay autoplay until metadata is ready.
    }
  };

  useEffect(() => {
    return () => {
      revokeCurrentPreview();
      stopCamera();
    };
  }, [imagePreviewUrl]);

  useEffect(() => {
    if (!isCameraActive && !isStartingCamera) {
      return;
    }

    attachStreamToVideo();
  }, [isCameraActive, isStartingCamera]);

  const canEstimate = useMemo(() => {
    if (!imagePreviewUrl) return false;
    if (calibrationMode === "height") {
      return Number(heightInches) > 0;
    }
    return Number(markerWidthInches) > 0 && Number(markerPixelWidth) > 1;
  }, [imagePreviewUrl, calibrationMode, heightInches, markerWidthInches, markerPixelWidth]);

  const handleEstimate = async () => {
    if (!imagePreviewUrl) {
      toast.error("Please upload or capture a front full-body image first.");
      return;
    }

    if (calibrationMode === "height" && Number(heightInches) <= 0) {
      toast.error("Please enter a valid height in inches for calibration.");
      return;
    }

    if (calibrationMode === "marker") {
      if (Number(markerWidthInches) <= 0) {
        toast.error("Please enter marker width in inches.");
        return;
      }
      if (Number(markerPixelWidth) <= 1) {
        toast.error("Please enter marker width in pixels.");
        return;
      }
    }

    try {
      setIsEstimating(true);
      const imageElement = await loadImageElement(imagePreviewUrl);
      const result = await estimateMeasurementsWithMoveNet({
        imageElement,
        calibrationMode,
        heightInches: Number(heightInches),
        markerWidthInches: Number(markerWidthInches),
        markerPixelWidth: Number(markerPixelWidth),
      });

      const aiNote = buildAiNote(result.diagnostics);
      if (onApply) {
        onApply({
          measurements: result.measurements,
          diagnostics: result.diagnostics,
          aiNote,
        });
      }
      toast.success("AI measurements generated. Please review and adjust if needed.");
    } catch (error) {
      toast.error(error?.message || "Unable to estimate measurements from the image.");
    } finally {
      setIsEstimating(false);
    }
  };

  const handleStartCamera = async () => {
    if (!navigator?.mediaDevices?.getUserMedia) {
      toast.error("Webcam is not supported in this browser.");
      return;
    }

    try {
      setIsStartingCamera(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
        },
        audio: false,
      });

      stopCamera();
      streamRef.current = stream;
      setIsCameraActive(true);
      await attachStreamToVideo();
      toast.success("Webcam is ready. Position full body in frame.");
    } catch (error) {
      toast.error(
        error?.message || "Unable to access webcam. Please allow camera permission."
      );
    } finally {
      setIsStartingCamera(false);
    }
  };

  const captureCurrentFrame = () => {
    if (!videoRef.current || !canvasRef.current) {
      toast.error("Camera is not ready yet.");
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const width = video.videoWidth;
    const height = video.videoHeight;

    if (!width || !height) {
      toast.error("Unable to capture image. Please try again.");
      return;
    }

    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      toast.error("Unable to process captured image.");
      return;
    }

    context.drawImage(video, 0, 0, width, height);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          toast.error("Unable to capture image. Please try again.");
          return;
        }

        revokeCurrentPreview();
        setImagePreviewUrl(URL.createObjectURL(blob));
        stopCamera();
        toast.success("Photo captured. You can now run AI estimation.");
      },
      "image/jpeg",
      0.92
    );
  };

  const handleAutoCapture = () => {
    if (!isCameraActive) {
      toast.error("Please start the webcam first.");
      return;
    }

    if (autoCaptureTimeoutRef.current) {
      clearTimeout(autoCaptureTimeoutRef.current);
    }

    setIsAutoCapturing(true);
    toast.info("Auto capture in 3 seconds. Hold a full-body pose.");
    autoCaptureTimeoutRef.current = setTimeout(() => {
      setIsAutoCapturing(false);
      captureCurrentFrame();
      autoCaptureTimeoutRef.current = null;
    }, 3000);
  };

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <p className="text-sm font-semibold text-gray-900">AI Measurement (MoveNet Beta)</p>
      <p className="text-xs text-gray-600 pt-1">
        Upload a clear front full-body image and choose a calibration method. AI will auto-fill measurements.
        Please review before saving.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3">
        <div>
          <label className="text-xs font-medium text-gray-700">Calibration Mode</label>
          <select
            value={calibrationMode}
            onChange={(event) => setCalibrationMode(event.target.value)}
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
          <>
            <div>
              <label className="text-xs font-medium text-gray-700">Marker Width (inches)</label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={markerWidthInches}
                onChange={(event) => setMarkerWidthInches(event.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="e.g. 3.4"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">Marker Width (pixels)</label>
              <input
                type="number"
                min="2"
                step="1"
                value={markerPixelWidth}
                onChange={(event) => setMarkerPixelWidth(event.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="e.g. 120"
              />
            </div>
          </>
        )}
      </div>

      <div className="pt-3">
        <label className="text-xs font-medium text-gray-700">Front photo</label>
        <input
          type="file"
          accept="image/*"
          className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            revokeCurrentPreview();
            setImagePreviewUrl(URL.createObjectURL(file));
          }}
        />

        <div className="flex flex-wrap gap-2 pt-3">
          <Button
            type="button"
            className="border border-gray-300 bg-white text-gray-700 rounded-md"
            onClick={handleStartCamera}
            disable={isStartingCamera}
            loading={isStartingCamera}
          >
            {isCameraActive ? "Restart Webcam" : "Use Webcam"}
          </Button>

          {isCameraActive && (
            <>
              <Button
                type="button"
                className="border border-gray-300 bg-white text-gray-700 rounded-md"
                onClick={captureCurrentFrame}
                disable={isAutoCapturing}
              >
                Capture Now
              </Button>

              <Button
                type="button"
                className="border border-gray-300 bg-white text-gray-700 rounded-md"
                onClick={handleAutoCapture}
                disable={isAutoCapturing}
              >
                {isAutoCapturing ? "Auto Capture..." : "Auto Capture (3s)"}
              </Button>

              <Button
                type="button"
                className="border border-gray-300 bg-white text-gray-700 rounded-md"
                onClick={stopCamera}
              >
                Stop Webcam
              </Button>
            </>
          )}
        </div>

        {(isCameraActive || isStartingCamera) && (
          <div className="pt-3">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-56 w-full rounded-md border border-gray-200 object-contain bg-black"
            />
            {isStartingCamera && (
              <p className="pt-2 text-xs text-gray-600">Starting webcam...</p>
            )}
            <p className="pt-2 text-xs text-gray-600">
              Keep your full body visible in the frame for better measurement accuracy.
            </p>
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}
      </div>

      {imagePreviewUrl && (
        <div className="pt-3">
          <img
            src={imagePreviewUrl}
            alt="AI measurement preview"
            className="h-36 w-full rounded-md border border-gray-200 object-contain bg-white"
          />
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
