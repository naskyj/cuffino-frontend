"use client";

import React, { useState } from "react";
import CustomModal from "./index";
import Button from "../button";
import { IoTrashOutline } from "react-icons/io5";
import { ImageServices } from "@/services/images";
import { toast } from "sonner";
import useUtilityII from "@/core/zustand/utilityII";

const ViewCustomizationsModal = ({
  isVisible,
  onClose,
  customizationImages,
  onDelete,
}) => {
  const [deletingId, setDeletingId] = useState(null);
  const { customizationImagesCustom, setCustomizationImagesCustom } = useUtilityII();

  const handleDelete = async (imageId) => {
    setDeletingId(imageId);
    try {
      await ImageServices.deleteCustomizationImage(imageId);
      toast.success("Image deleted successfully!");
      if (onDelete) {
        onDelete(imageId);
      }
    } catch (error) {
      console.error("Error deleting image:", error);
      toast.error(
        error?.response?.data?.message || "Failed to delete image. Please try again."
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <CustomModal isVisible={isVisible} onClose={onClose} classProp="!h-full">
      <div className="flex flex-col gap-4 px-4 lg:px-6">
        <h3 className="text-xl lg:text-2xl text-center uppercase font-bold tracking-wider text-primary">
          Image Customizations
        </h3>
        {/* <p className="text-center text-gray-600 text-sm">
          {customizationImages.length} customization image(s) uploaded
        </p> */}

        {customizationImagesCustom?.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No customization images uploaded yet.</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {customizationImagesCustom?.map((item, index) => (
              <div
                key={item?.imageId || index}
                className="flex items-start gap-4 p-4 border border-[#DCDFF1] rounded-lg bg-gray-50"
              >
                <img
                  src={item.imageUrl}
                  alt={`Customization ${index + 1}`}
                  className="w-20 h-20 object-cover rounded-md"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">
                    {item.imageType === "CUSTOMIZATION_REFERENCE"
                      ? "Reference Image"
                      : "Inspiration"}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {item.description}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(item?.userImageId ?? item?.imageId)}
                  disabled={deletingId === item?.userImageId ?? item?.imageId}
                  className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                  title="Delete customization"
                >
                  {deletingId === item?.imageId ?? item?.userImageId ? (
                    <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <IoTrashOutline size={20} />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="pt-4">
          <Button
            type="button"
            className="bg-primary text-white rounded-md w-full"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>
    </CustomModal>
  );
};

export default ViewCustomizationsModal;
