"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { IoLocationOutline } from "react-icons/io5";
import { TbRulerMeasure } from "react-icons/tb";
import { FaCheckCircle } from "react-icons/fa";
import Button from "@/components/button";
import CustomModal from "./index";

const CompleteProfilePromptModal = ({
  isVisible,
  onClose,
  hasAddress = false,
  hasMeasurement = false,
  onSkip,
}) => {
  const router = useRouter();

  const handleGoToAddress = () => {
    onClose();
    router.push("/user-delivery-address");
  };

  const handleGoToMeasurement = () => {
    onClose();
    router.push("/user-measurement");
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    }
    onClose();
  };

  const allComplete = hasAddress && hasMeasurement;

  return (
    <CustomModal isVisible={isVisible} onClose={onClose}>
      <div className="px-2 sm:px-4 py-4">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <span className="text-3xl">🎉</span>
          </div>
          <h3 className="text-2xl font-bold text-primary mb-2">
            Welcome to Cuffino!
          </h3>
          <p className="text-gray-600 text-sm md:text-base">
            Complete your profile to enjoy a seamless shopping experience with
            perfectly fitted African fashion.
          </p>
        </div>

        {/* Progress Items */}
        <div className="space-y-4 mb-6">
          {/* Delivery Address Item */}
          <div
            className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all cursor-pointer hover:shadow-md ${
              hasAddress
                ? "border-green-500 bg-green-50"
                : "border-primary/30 bg-primary/5 hover:border-primary"
            }`}
            onClick={!hasAddress ? handleGoToAddress : undefined}
          >
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                hasAddress ? "bg-green-500" : "bg-primary"
              }`}
            >
              {hasAddress ? (
                <FaCheckCircle className="text-white text-xl" />
              ) : (
                <IoLocationOutline className="text-white text-xl" />
              )}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">Delivery Address</h4>
              <p className="text-sm text-gray-500">
                {hasAddress
                  ? "Address added successfully!"
                  : "Add your delivery address for smooth order deliveries"}
              </p>
            </div>
            {!hasAddress && (
              <Button
                type="button"
                className="bg-primary text-white rounded-lg px-4 py-2 text-sm"
                onClick={handleGoToAddress}
              >
                Add Now
              </Button>
            )}
          </div>

          {/* Measurement Item */}
          <div
            className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all cursor-pointer hover:shadow-md ${
              hasMeasurement
                ? "border-green-500 bg-green-50"
                : "border-primary/30 bg-primary/5 hover:border-primary"
            }`}
            onClick={!hasMeasurement ? handleGoToMeasurement : undefined}
          >
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                hasMeasurement ? "bg-green-500" : "bg-primary"
              }`}
            >
              {hasMeasurement ? (
                <FaCheckCircle className="text-white text-xl" />
              ) : (
                <TbRulerMeasure className="text-white text-xl" />
              )}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">Body Measurements</h4>
              <p className="text-sm text-gray-500">
                {hasMeasurement
                  ? "Measurements added successfully!"
                  : "Add your measurements for custom-fitted outfits"}
              </p>
            </div>
            {!hasMeasurement && (
              <Button
                type="button"
                className="bg-primary text-white rounded-lg px-4 py-2 text-sm"
                onClick={handleGoToMeasurement}
              >
                Add Now
              </Button>
            )}
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>Profile Completion</span>
            <span>
              {(hasAddress ? 1 : 0) + (hasMeasurement ? 1 : 0)}/2 completed
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-500"
              style={{
                width: `${((hasAddress ? 1 : 0) + (hasMeasurement ? 1 : 0)) * 50}%`,
              }}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          {allComplete ? (
            <Button
              type="button"
              className="bg-primary text-white rounded-lg w-full"
              onClick={onClose}
            >
              Start Shopping
            </Button>
          ) : (
            <>
              <Button
                type="button"
                className="bg-gray-100 text-gray-600 rounded-lg flex-1 hover:bg-gray-200"
                onClick={handleSkip}
              >
                Skip for Now
              </Button>
              <Button
                type="button"
                className="bg-primary text-white rounded-lg flex-1"
                onClick={!hasAddress ? handleGoToAddress : handleGoToMeasurement}
              >
                Continue Setup
              </Button>
            </>
          )}
        </div>

        {/* Helpful Tip */}
        {!allComplete && (
          <p className="text-xs text-gray-400 text-center mt-4">
            💡 Tip: Having your measurements saved makes checkout faster and ensures a perfect fit!
          </p>
        )}
      </div>
    </CustomModal>
  );
};

export default CompleteProfilePromptModal;

