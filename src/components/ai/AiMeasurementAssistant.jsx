"use client";

import React, { useEffect, useMemo, useState } from "react";
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

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  const canEstimate = useMemo(() => {
    if (!imagePreviewUrl) return false;
    if (calibrationMode === "height") {
      return Number(heightInches) > 0;
    }
    return Number(markerWidthInches) > 0 && Number(markerPixelWidth) > 1;
  }, [imagePreviewUrl, calibrationMode, heightInches, markerWidthInches, markerPixelWidth]);

  const handleEstimate = async () => {
    if (!imagePreviewUrl) {
      toast.error("Please upload a front full-body image first.");
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
            if (imagePreviewUrl) {
              URL.revokeObjectURL(imagePreviewUrl);
            }
            setImagePreviewUrl(URL.createObjectURL(file));
          }}
        />
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
