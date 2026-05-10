"use client";

import React, { useState } from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import FormikControl from "../formik/formikControl";
import Button from "../button";
import { toast } from "sonner";
import CustomModal from "./index";
import { ImageServices } from "@/services/images";
import useUtilityII from "@/core/zustand/utilityII";

const imageTypeOptions = [
  { key: "Select image type", value: "", $isDisabled: true },
  { key: "Customization Reference", value: "CUSTOMIZATION_REFERENCE" },
  { key: "Inspiration", value: "INSPIRATION" },
];

const MAX_IMAGES = 5;

const ImageCustomizationModal = ({ isVisible, onClose, onUploaded, currentImageCount = 0 }) => {
  const [isUploading, setIsUploading] = useState(false);
  const { setCustomizationImagesCustom } = useUtilityII();

  const initialValues = {
    file: null,
    imageType: "",
    description: "",
  };

  const validationSchema = Yup.object({
    file: Yup.mixed()
      .required("Please select an image")
      .test("fileType", "Only image files are allowed", (file) => {
        if (!file) return false;
        return file.type && file.type.startsWith("image/");
      }),
    imageType: Yup.string().required("Please select an image type"),
    description: Yup.string().required("Please enter a description"),
  });

  const handleSubmit = async (values, { setSubmitting, resetForm, setFieldError }) => {
    // Check if max image limit is reached
    if (currentImageCount >= MAX_IMAGES) {
      setFieldError("file", `Maximum of ${MAX_IMAGES} images allowed. Please delete an image before uploading a new one.`);
      setSubmitting(false);
      return;
    }

    // Validate file
    if (!values.file) {
      setFieldError("file", "Please select an image");
      setSubmitting(false);
      return;
    }

    setIsUploading(true);
    try {
      // Create FormData for multipart/form-data request
      const formData = new FormData();
      formData.append("file", values.file);
      formData.append("imageType", values.imageType);
      formData.append("description", values.description);

      const response = await ImageServices.uploadCustomizationImage(formData);

      // Handle response - could be single image or wrapped in images array
      const uploadedImage = response?.data?.image || response?.data?.images?.[0] || response?.data;
      
      if (uploadedImage?.imageId) {
        const uploadedItem = {
          imageId: uploadedImage.imageId,
        };

        const uploadedItem_ForTheView = {
          imageId: uploadedImage.imageId,
          imageUrl: uploadedImage.imageUrl,
          imageType: uploadedImage.imageType || values.imageType,
          description: uploadedImage.description || values.description,
        };

        // Update store
        setCustomizationImagesCustom((prev) => [...prev, uploadedItem_ForTheView]);

        // Pass uploaded item back to parent
        if (onUploaded) {
          onUploaded(uploadedItem);
        }
      }

      toast.success(response.data?.message || "Image uploaded successfully!");
      
      // Reset form and close modal
      resetForm();
      onClose();
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error(
        error?.response?.data?.message ||
          "Failed to upload image. Please try again."
      );
    } finally {
      setIsUploading(false);
      setSubmitting(false);
    }
  };

  return (
    <CustomModal isVisible={isVisible} onClose={onClose} classProp="!h-full">
      <div className="flex flex-col gap-4 px-4 lg:px-6">
        <h3 className="text-xl lg:text-2xl text-center uppercase font-bold tracking-wider text-primary">
          Add Image Customization
        </h3>
        <p className="text-center text-gray-600 text-sm">
          Upload a reference image to help us customize your order
        </p>

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          validateOnChange={false}
          validateOnBlur={false}
        >
          {(formik) => (
            <Form className="space-y-5">
              {/* Dropzone for single image */}
              <div>
                <p className="text-sm md:text-sm pb-2 font-semibold">
                  Upload Image <span className="text-red-600">*</span>
                </p>
                <div className="mb-2 flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-md px-3 py-2">
                  <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs text-blue-700">
                    <span className="font-semibold">Max size: 5MB</span> &nbsp;|&nbsp; Accepted: JPG, PNG, GIF, WebP
                  </p>
                </div>
                <FormikControl 
                  control="dropzone" 
                  name="file" 
                  maxFiles={1}
                />
              </div>

              {/* Image Type Select */}
              <div>
                <p className="text-sm md:text-sm pb-1 font-semibold">
                  Image Type <span className="text-red-600">*</span>
                </p>
                <FormikControl
                  control="select"
                  name="imageType"
                  options={imageTypeOptions}
                  className="w-full"
                />
              </div>

              {/* Description Textarea */}
              <div>
                <p className="text-sm md:text-sm pb-1 font-semibold">
                  Description <span className="text-red-600">*</span>
                </p>
                <FormikControl
                  control="textarea"
                  name="description"
                  placeholder="Describe what you want (e.g., 'I want this exact color' or 'Use this as inspiration for the pattern')"
                  rows={4}
                  className="w-full"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  className="bg-gray-200 text-gray-700 rounded-md flex-1"
                  onClick={() => {
                    formik.resetForm();
                    onClose();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-primary text-white rounded-md flex-1"
                  disable={formik.isSubmitting || isUploading || currentImageCount >= MAX_IMAGES}
                  loading={formik.isSubmitting || isUploading}
                >
                  {currentImageCount >= MAX_IMAGES
                    ? "Limit Reached"
                    : isUploading
                    ? "Uploading..."
                    : "Upload Image"}
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </CustomModal>
  );
};

export default ImageCustomizationModal;
