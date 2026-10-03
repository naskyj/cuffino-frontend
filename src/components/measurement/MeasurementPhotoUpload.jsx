"use client";

import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import Button from "@/components/button";
import { ImageServices } from "@/services/images";

import WebcamCapture from "./WebcamCapture";

/**
 * Front / side / back photos attached to a set of manually-entered measurements.
 *
 * These are reference material for a human - the tailor or reviewer eyeballs them against the
 * numbers the customer typed in and catches anything obviously wrong (a waist entered in cm, a
 * transposed digit). Nothing here estimates, derives, or alters a single measurement value: the
 * numbers are exactly what the customer entered.
 *
 * Capture works the same on phone and desktop, by different means on each - see `canUseCapture`.
 */

const PHOTO_SLOTS = [
  {
    key: "FRONT",
    label: "Front",
    hint: "Facing the camera, arms slightly away from your sides.",
  },
  {
    key: "SIDE",
    label: "Side",
    hint: "Turned 90 degrees, arms relaxed at your sides.",
  },
  {
    key: "BACK",
    label: "Back",
    hint: "Back to the camera, standing straight.",
  },
];

// Matches the backend's 15MB upload ceiling (MaxUploadSizeExceededException handler + Spring's
// configured max-file-size). Checking here turns a confusing server rejection into a sentence
// that says what to do about it.
const MAX_FILE_BYTES = 15 * 1024 * 1024;

const MeasurementPhotoUpload = ({ onPhotosChange }) => {
  const [photos, setPhotos] = useState({}); // key -> { previewUrl, status, imageId, fileName }
  const [cameraSlot, setCameraSlot] = useState(null);

  // On a phone, `capture` on a file input opens the camera directly, which is the best possible
  // experience and needs no permissions dance. On a desktop the attribute is silently ignored, so
  // "Take Photo" there has to go through getUserMedia (WebcamCapture) instead. Detect which case
  // we're in rather than disabling the button on desktop, which is what used to happen.
  const [canUseCapture, setCanUseCapture] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    setCanUseCapture(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  const cameraInputRefs = useRef({});
  const libraryInputRefs = useRef({});

  // Object URLs are only released on unmount here; per-photo replacement revokes its own
  // predecessor in applyFile/handleRemove. Read through a ref - the unmount closure would
  // otherwise only ever see the initial, empty `photos`.
  const photosRef = useRef(photos);
  photosRef.current = photos;
  useEffect(
    () => () => {
      Object.values(photosRef.current).forEach((photo) => {
        if (photo?.previewUrl) URL.revokeObjectURL(photo.previewUrl);
      });
    },
    []
  );

  // Reported from an effect rather than from inside a setPhotos updater: updater functions must
  // be pure (React runs them twice in StrictMode), and calling a parent's callback from one would
  // fire it twice in development.
  const onPhotosChangeRef = useRef(onPhotosChange);
  onPhotosChangeRef.current = onPhotosChange;

  useEffect(() => {
    if (typeof onPhotosChangeRef.current !== "function") return;
    onPhotosChangeRef.current(
      Object.entries(photos)
        .filter(([, photo]) => photo?.status === "done" && photo.imageId)
        .map(([key, photo]) => ({ slot: key, imageId: photo.imageId }))
    );
  }, [photos]);

  const applyFile = async (slot, file) => {
    if (!file) return;

    if (!file.type?.startsWith("image/")) {
      toast.error("That file isn't an image. Please choose a photo.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      toast.error(
        `That photo is ${(file.size / (1024 * 1024)).toFixed(1)}MB - the limit is 15MB. Please use a smaller photo.`
      );
      return;
    }

    const previousImageId = photos[slot]?.imageId;
    if (photos[slot]?.previewUrl) URL.revokeObjectURL(photos[slot].previewUrl);

    const previewUrl = URL.createObjectURL(file);
    setPhotos((current) => ({
      ...current,
      [slot]: { previewUrl, status: "uploading", fileName: file.name },
    }));

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("imageType", "MEASUREMENT_REFERENCE");
      formData.append("description", PHOTO_SLOTS.find((s) => s.key === slot)?.label || slot);
      const response = await ImageServices.uploadCustomizationImages(formData);

      setPhotos((current) => ({
        ...current,
        [slot]: {
          ...current[slot],
          status: "done",
          imageId: response?.data?.imageId,
        },
      }));

      // Replacing a slot's photo should not leave the old file orphaned in storage.
      if (previousImageId) {
        ImageServices.deleteCustomizationImage(previousImageId).catch(() => {});
      }
    } catch (error) {
      setPhotos((current) => ({
        ...current,
        [slot]: { ...current[slot], status: "error" },
      }));
      toast.error(
        error?.response?.data?.message || "Couldn't upload that photo. Please try again."
      );
    }
  };

  const handleInputChange = (slot) => async (event) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // so picking the same file twice still fires onChange
    await applyFile(slot, file);
  };

  const handleRemove = async (slot) => {
    const photo = photos[slot];
    if (!photo) return;

    if (photo.previewUrl) URL.revokeObjectURL(photo.previewUrl);
    setPhotos((current) => {
      const next = { ...current };
      delete next[slot];
      return next;
    });

    if (photo.imageId) {
      try {
        await ImageServices.deleteCustomizationImage(photo.imageId);
      } catch {
        // Already gone from the UI; worst case is an orphaned file in storage.
      }
    }
  };

  const handleTakePhoto = (slot) => {
    if (canUseCapture) {
      cameraInputRefs.current[slot]?.click();
    } else {
      setCameraSlot(slot);
    }
  };

  const uploadedCount = Object.values(photos).filter((p) => p?.status === "done").length;

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-semibold text-gray-900">
          Reference Photos <span className="font-normal text-gray-500">(optional)</span>
        </p>
        <p className="text-[11px] text-gray-500">
          {uploadedCount} of {PHOTO_SLOTS.length} added
        </p>
      </div>
      <p className="mt-1 text-xs text-gray-600">
        Add a front, side and back photo so our tailor can sanity-check the measurements you
        entered. These are for a human to look at - they don&apos;t change any of your numbers,
        and your measurements are used exactly as you typed them.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {PHOTO_SLOTS.map((slot) => {
          const photo = photos[slot.key];
          return (
            <div
              key={slot.key}
              className="rounded-md border border-gray-200 bg-white p-3"
            >
              <p className="text-xs font-semibold text-gray-900">{slot.label}</p>
              <p className="mt-0.5 text-[11px] text-gray-500">{slot.hint}</p>

              {/* Two inputs rather than one: on Android the OS chooser behind a bare
                  accept="image/*" input is inconsistent about offering the camera at all, so
                  the camera and the library each get their own explicit button. */}
              <input
                ref={(el) => {
                  cameraInputRefs.current[slot.key] = el;
                }}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleInputChange(slot.key)}
              />
              <input
                ref={(el) => {
                  libraryInputRefs.current[slot.key] = el;
                }}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleInputChange(slot.key)}
              />

              {photo?.previewUrl ? (
                <div className="mt-2">
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.previewUrl}
                      alt={`${slot.label} reference`}
                      className={`h-32 w-full rounded-md border object-cover ${
                        photo.status === "error" ? "border-red-300" : "border-gray-200"
                      } ${photo.status === "uploading" ? "opacity-50" : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemove(slot.key)}
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gray-700 text-xs leading-none text-white hover:bg-gray-900"
                      aria-label={`Remove ${slot.label} photo`}
                    >
                      &times;
                    </button>
                  </div>
                  <p className="pt-1 text-[11px]">
                    {photo.status === "uploading" && (
                      <span className="text-gray-500">Uploading...</span>
                    )}
                    {photo.status === "done" && (
                      <span className="font-medium text-green-700">Uploaded</span>
                    )}
                    {photo.status === "error" && (
                      <span className="font-medium text-red-600">
                        Upload failed - try again
                      </span>
                    )}
                  </p>
                </div>
              ) : (
                <div className="mt-2 flex h-32 items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-50">
                  <span className="text-[11px] text-gray-400">No photo yet</span>
                </div>
              )}

              <div className="mt-2 flex flex-col gap-1.5">
                <Button
                  type="button"
                  className="w-full border border-gray-300 bg-white text-gray-700 rounded-md !text-xs"
                  onClick={() => handleTakePhoto(slot.key)}
                >
                  Take Photo
                </Button>
                <Button
                  type="button"
                  className="w-full border border-gray-300 bg-white text-gray-700 rounded-md !text-xs"
                  onClick={() => libraryInputRefs.current[slot.key]?.click()}
                >
                  Choose from Library
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <WebcamCapture
        isOpen={Boolean(cameraSlot)}
        label={PHOTO_SLOTS.find((s) => s.key === cameraSlot)?.label || "Reference"}
        onCapture={(file) => applyFile(cameraSlot, file)}
        onClose={() => setCameraSlot(null)}
      />
    </div>
  );
};

export default MeasurementPhotoUpload;
