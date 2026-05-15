"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import Button from "@/components/button";
import { estimateMeasurementsWithMoveNet } from "@/lib/ai/movenetEstimator";

const CALIBRATION_OPTIONS = [
  { value: "height", label: "Use Height" },
  { value: "marker", label: "Use Reference Marker" },
];

const PORTRAIT_OUTPUT_WIDTH = 720;
const PORTRAIT_OUTPUT_HEIGHT = 1280;
const PORTRAIT_ASPECT_RATIO = PORTRAIT_OUTPUT_WIDTH / PORTRAIT_OUTPUT_HEIGHT;

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
  const [showCameraPopup, setShowCameraPopup] = useState(false);
  const [shouldStartCamera, setShouldStartCamera] = useState(false);

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
    setIsStartingCamera(false);
  };

  const closeCameraPopup = () => {
    stopCamera();
    setShowCameraPopup(false);
    setShouldStartCamera(false);
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
    if (!showCameraPopup || (!isCameraActive && !isStartingCamera)) {
      return;
    }

    attachStreamToVideo();
  }, [showCameraPopup, isCameraActive, isStartingCamera]);

  useEffect(() => {
    if (!showCameraPopup || !shouldStartCamera) {
      return;
    }

    const startCamera = async () => {
      if (!navigator?.mediaDevices?.getUserMedia) {
        toast.error("Webcam is not supported in this browser.");
        setShouldStartCamera(false);
        return;
      }

      try {
        setIsStartingCamera(true);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1080 },
            height: { ideal: 1920 },
            aspectRatio: { ideal: 9 / 16 },
          },
          audio: false,
        });

        stopCamera();
        streamRef.current = stream;
        setIsCameraActive(true);
        await attachStreamToVideo();
        toast.success("Portrait camera is ready. Fit your full body into the frame.");
      } catch (error) {
        toast.error(
          error?.message || "Unable to access webcam. Please allow camera permission."
        );
        setShowCameraPopup(false);
      } finally {
        setIsStartingCamera(false);
        setShouldStartCamera(false);
      }
    };

    startCamera();
  }, [showCameraPopup, shouldStartCamera]);

  useEffect(() => {
    if (!showCameraPopup) {
      return;
    }

    const handleEscClose = (event) => {
      if (event.key === "Escape") {
        closeCameraPopup();
      }
    };

    window.addEventListener("keydown", handleEscClose);
    return () => {
      window.removeEventListener("keydown", handleEscClose);
    };
  }, [showCameraPopup]);

  const canEstimate = useMemo(() => {
    return Boolean(imagePreviewUrl);
  }, [imagePreviewUrl]);

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

  const openCameraPopup = () => {
    setShowCameraPopup(true);
    setShouldStartCamera(true);
  };

  const captureCurrentFrame = () => {
    if (!videoRef.current || !canvasRef.current) {
      toast.error("Camera is not ready yet.");
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const sourceWidth = video.videoWidth;
    const sourceHeight = video.videoHeight;

    if (!sourceWidth || !sourceHeight) {
      toast.error("Unable to capture image. Please try again.");
      return;
    }

    const sourceAspect = sourceWidth / sourceHeight;
    let cropWidth = sourceWidth;
    let cropHeight = sourceHeight;
    let sourceX = 0;
    let sourceY = 0;

    if (sourceAspect > PORTRAIT_ASPECT_RATIO) {
      cropWidth = sourceHeight * PORTRAIT_ASPECT_RATIO;
      sourceX = (sourceWidth - cropWidth) / 2;
    } else {
      cropHeight = sourceWidth / PORTRAIT_ASPECT_RATIO;
      sourceY = (sourceHeight - cropHeight) / 2;
    }

    canvas.width = PORTRAIT_OUTPUT_WIDTH;
    canvas.height = PORTRAIT_OUTPUT_HEIGHT;
    const context = canvas.getContext("2d");
    if (!context) {
      toast.error("Unable to process captured image.");
      return;
    }

    context.drawImage(
      video,
      sourceX,
      sourceY,
      cropWidth,
      cropHeight,
      0,
      0,
      PORTRAIT_OUTPUT_WIDTH,
      PORTRAIT_OUTPUT_HEIGHT
    );

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          toast.error("Unable to capture image. Please try again.");
          return;
        }

        revokeCurrentPreview();
        setImagePreviewUrl(URL.createObjectURL(blob));
        closeCameraPopup();
        toast.success("Portrait photo captured. You can now run AI estimation.");
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
    toast.info("Auto capture in 3 seconds. Keep your full body inside the frame.");
    autoCaptureTimeoutRef.current = setTimeout(() => {
      setIsAutoCapturing(false);
      captureCurrentFrame();
      autoCaptureTimeoutRef.current = null;
    }, 3000);
  };

  return (
    <>
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-semibold text-gray-900">AI Measurement (MoveNet Beta)</p>
        <p className="text-xs text-gray-600 pt-1">
          Upload a clear front full-body image or open portrait camera. AI will auto-fill measurements.
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
              onClick={openCameraPopup}
              disable={isStartingCamera}
            >
              Open Portrait Camera
            </Button>
          </div>
        </div>

        {imagePreviewUrl && (
          <div className="pt-3">
            <img
              src={imagePreviewUrl}
              alt="AI measurement preview"
              className="h-56 w-full rounded-md border border-gray-200 object-contain bg-white"
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

      {showCameraPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Portrait Camera Capture</h3>
                <p className="text-xs text-gray-600">Stand 6-8 feet away and keep full body in frame.</p>
              </div>
              <button
                type="button"
                className="rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
                onClick={closeCameraPopup}
              >
                Close
              </button>
            </div>

            <div className="p-4">
              <div className="mx-auto aspect-[9/16] w-full max-w-[360px] overflow-hidden rounded-xl bg-black shadow-inner">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="mx-auto mt-3 w-full max-w-[360px] rounded-lg border border-dashed border-gray-300 p-2 text-center text-xs text-gray-600">
                Position your head near the top and feet near the bottom of the frame.
              </div>

              {isStartingCamera && (
                <p className="pt-3 text-center text-xs text-gray-600">Starting webcam...</p>
              )}

              <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
                <Button
                  type="button"
                  className="bg-primary text-white rounded-md"
                  onClick={captureCurrentFrame}
                  disable={!isCameraActive || isAutoCapturing}
                >
                  Capture Now
                </Button>

                <Button
                  type="button"
                  className="border border-gray-300 bg-white text-gray-700 rounded-md"
                  onClick={handleAutoCapture}
                  disable={!isCameraActive || isAutoCapturing}
                >
                  {isAutoCapturing ? "Auto Capture..." : "Auto Capture (3s)"}
                </Button>

                <Button
                  type="button"
                  className="border border-gray-300 bg-white text-gray-700 rounded-md"
                  onClick={() => {
                    stopCamera();
                    setShouldStartCamera(true);
                  }}
                  disable={isStartingCamera}
                >
                  Restart Camera
                </Button>
              </div>
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>
      )}
    </>
  );
}
