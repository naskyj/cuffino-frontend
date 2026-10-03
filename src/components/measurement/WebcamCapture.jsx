"use client";

import React, { useEffect, useRef, useState } from "react";
import Button from "@/components/button";

/**
 * Take a photo with the computer's own camera.
 *
 * Why this exists at all: `<input type="file" capture>` is a mobile-only affordance. On a desktop
 * browser the `capture` attribute is ignored outright - the button just opens the same file
 * picker as "Choose from Library", which is why "Take Photo" used to be greyed out on PC. The
 * only way to actually take a photo on a desktop is getUserMedia, so that is what this does.
 *
 * The stream is stopped on close and on unmount - leaving it running leaves the camera light on,
 * which users (reasonably) read as the site spying on them.
 */
const WebcamCapture = ({ isOpen, label, onCapture, onClose }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState("");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!isOpen) return undefined;

    let cancelled = false;
    setError("");
    setIsReady(false);

    const start = async () => {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        setError(
          "This browser can't use the camera directly. Please use \"Choose from Library\" instead."
        );
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 960 } },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setIsReady(true);
      } catch (err) {
        // NotAllowedError is the user declining the permission prompt; NotFoundError is a machine
        // with no camera at all. Both are normal, and both need a different sentence.
        if (err?.name === "NotAllowedError" || err?.name === "SecurityError") {
          setError(
            "Camera access was blocked. Allow camera access in your browser, or use \"Choose from Library\" instead."
          );
        } else if (err?.name === "NotFoundError" || err?.name === "OverconstrainedError") {
          setError(
            "We couldn't find a camera on this device. Please use \"Choose from Library\" instead."
          );
        } else {
          setError(
            "We couldn't start the camera. Please use \"Choose from Library\" instead."
          );
        }
      }
    };

    start();

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [isOpen]);

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `${(label || "photo").toLowerCase()}-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        onCapture(file);
        onClose();
      },
      "image/jpeg",
      0.92
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white p-4 shadow-xl">
        <div className="flex items-center justify-between pb-3">
          <p className="text-sm font-semibold text-gray-900">
            Take {label} Photo
          </p>
          <button
            type="button"
            onClick={onClose}
            className="h-7 w-7 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800"
            aria-label="Close camera"
          >
            &times;
          </button>
        </div>

        {error ? (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>
        ) : (
          <div className="overflow-hidden rounded-md bg-black">
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="h-auto w-full"
            />
          </div>
        )}

        <div className="flex gap-2 pt-4">
          <Button
            type="button"
            className="flex-1 border border-gray-300 bg-white text-gray-700 rounded-md"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="flex-1 bg-[#A86746] text-white rounded-md"
            onClick={handleCapture}
            disable={!isReady || Boolean(error)}
          >
            Capture
          </Button>
        </div>

        <p className="pt-2 text-[11px] text-gray-500">
          Stand back far enough that your whole body is in frame, against a plain background.
        </p>
      </div>
    </div>
  );
};

export default WebcamCapture;
