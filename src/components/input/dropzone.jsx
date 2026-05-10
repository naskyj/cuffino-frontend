"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { ErrorMessage, useFormikContext } from "formik";
import { TextError } from "../utils";
import { IoCloudUploadOutline, IoCloseCircle } from "react-icons/io5";

const Dropzone = ({
  name = "",
  label,
  className = "",
  accept = { "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"] },
  maxFiles = 1,
  maxSize = 5 * 1024 * 1024, // 5MB default
  multiple = false,
}) => {
  const { setFieldValue, values, setFieldTouched } = useFormikContext();
  const [previews, setPreviews] = useState([]);

  const onDrop = useCallback(
    (acceptedFiles) => {
      if (acceptedFiles && acceptedFiles.length > 0) {
        if (multiple) {
          // Multiple files mode
          const currentFiles = values[name] || [];
          const newFiles = [...currentFiles, ...acceptedFiles].slice(0, maxFiles);
          setFieldValue(name, newFiles);
          setFieldTouched(name, true);

          // Create preview URLs for new files
          const newPreviews = newFiles.map((file) => ({
            url: URL.createObjectURL(file),
            name: file.name,
          }));
          setPreviews(newPreviews);
        } else {
          // Single file mode (backward compatible)
          const file = acceptedFiles[0];
          setFieldValue(name, file);
          setFieldTouched(name, true);

          // Create preview URL
          const previewUrl = URL.createObjectURL(file);
          setPreviews([{ url: previewUrl, name: file.name }]);
        }
      }
    },
    [name, setFieldValue, setFieldTouched, multiple, maxFiles, values]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop,
      accept,
      maxFiles: multiple ? maxFiles - (values[name]?.length || 0) : 1,
      maxSize,
      multiple,
    });

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, []);

  const removeFile = (e, index) => {
    e.stopPropagation();
    if (multiple) {
      const currentFiles = values[name] || [];
      const newFiles = currentFiles.filter((_, i) => i !== index);
      setFieldValue(name, newFiles.length > 0 ? newFiles : null);

      // Update previews
      const newPreviews = previews.filter((_, i) => i !== index);
      URL.revokeObjectURL(previews[index]?.url);
      setPreviews(newPreviews);
    } else {
      setFieldValue(name, null);
      if (previews[0]?.url) {
        URL.revokeObjectURL(previews[0].url);
        setPreviews([]);
      }
    }
  };

  const currentFiles = multiple ? values[name] || [] : values[name] ? [values[name]] : [];
  const canAddMore = multiple ? currentFiles.length < maxFiles : currentFiles.length === 0;

  return (
    <div className="sharp-sans flex flex-col space-y-1">
      {label && (
        <label className="sharp-sans text-[14px] font-[600] pointer-events-none max-w-[75%]">
          {label}
        </label>
      )}

      {/* Dropzone area - always visible */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
          ${
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-[#DCDFF1] hover:border-primary/50"
          }
          ${className}
        `}
      >
        <input {...getInputProps()} />

        {/* Show previews inside the dotted box */}
        {previews.length > 0 && (
          <div className={`grid gap-3 mb-4 ${multiple ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-1 justify-items-center"}`}>
            {previews.map((preview, index) => (
              <div key={index} className="relative border rounded-lg p-2 bg-gray-50">
                <img
                  src={preview.url}
                  alt={`Preview ${index + 1}`}
                  className="h-[80px] w-full rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={(e) => removeFile(e, index)}
                  className="absolute -top-2 -right-2 text-red-500 hover:text-red-700 bg-white rounded-full shadow-md"
                >
                  <IoCloseCircle size={22} />
                </button>
                <p className="text-xs text-gray-600 mt-1 truncate">
                  {preview.name}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Upload prompt - show if no files or can add more */}
        {canAddMore && (
          <div className="flex flex-col items-center gap-2">
            <IoCloudUploadOutline className="text-3xl text-gray-400" />
            {isDragActive ? (
              <p className="text-primary font-medium text-sm">Drop the image(s) here...</p>
            ) : (
              <>
                <p className="text-gray-600 text-sm">
                  {multiple
                    ? previews.length > 0
                      ? `Add more images (${currentFiles.length}/${maxFiles})`
                      : `Drag & drop images here, or click to select (max ${maxFiles})`
                    : "Drag & drop an image here, or click to select"}
                </p>
                <p className="text-xs text-gray-400">
                  Supported: JPG, PNG, GIF, WebP (max 5MB each)
                </p>
              </>
            )}
          </div>
        )}

        {/* Show message when limit reached */}
        {/* {!canAddMore && previews.length > 0 && (
          <p className="text-xs text-gray-500 mt-2">
            Maximum {maxFiles} image{maxFiles > 1 ? "s" : ""} reached
          </p>
        )} */}
      </div>

      {fileRejections.length > 0 && (
        <p className="text-red-500 text-sm">
          {fileRejections[0]?.errors[0]?.message || "File rejected"}
        </p>
      )}

      <ErrorMessage
        name={name}
        children={(msg) => <TextError children={msg} />}
      />
    </div>
  );
};

export default Dropzone;
