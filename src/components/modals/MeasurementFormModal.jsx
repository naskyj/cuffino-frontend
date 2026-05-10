"use client";

import React, { useState, useEffect } from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import FormikControl from "../formik/formikControl";
import Button from "../button";
import { TextError } from "../utils";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import useAuth from "@/core/zustand/auth.store";
import { UserServices } from "@/services/user";
import { ClipLoader } from "react-spinners";
import CustomSelect from "../select";
import { ProductServices } from "@/services/product";
import CustomModal from "./index";

const BODY_TYPE_OPTIONS = [
  { key: "Select body type", value: "" },
  { key: "Men", value: "MEN" },
  { key: "Women", value: "WOMEN" },
  { key: "Children", value: "CHILDREN" },
];

const MeasurementFormModal = ({
  isVisible,
  onClose,
  productId,
  productPrice,
  productName,
  productImage,
  quantity,
  onMeasurementComplete,
  onSave,
}) => {
  const { user } = useAuth();
  const [mode, setMode] = useState("select"); // "select" or "new"
  const [selectedMeasurementId, setSelectedMeasurementId] = useState(null);
  const [customColors, setCustomColors] = useState([]);
  const [customSizes, setCustomSizes] = useState([]);

  // Fetch saved measurements
  const { data: measurementsData, isLoading: isLoadingMeasurements } = useQuery(
    {
      queryKey: ["userMeasurements", user?.userId],
      queryFn: () => UserServices.getUserMeasurements(user?.userId),
      enabled: !!user?.userId && isVisible,
    }
  );

  const getProductById = useQuery({
    queryKey: ["productById", productId],
    queryFn: () => ProductServices.getProductById(productId),
    enabled: !!productId,
  });

  const savedMeasurements = measurementsData?.data || [];

  // Convert customizationValue string to array of {value, label} objects for dropdown
  useEffect(() => {
    if (getProductById?.data) {
      setCustomColors(
        getProductById?.data?.data?.customizations?.[0]?.customizationValue?.split(
          ","
        ) || []
      );
      setCustomSizes(
        getProductById?.data?.data?.customizations?.[1]?.customizationValue?.split(
          ","
        ) || []
      );
    }
    // console.log("CUSTOM COLORShjgh:", getProductById?.data?.data);
  }, [getProductById?.data]);

  const selectCustomColor = customColors
    .map((color) => color.trim())
    .filter((color) => color.length > 0)
    .map((color) => ({
      value: color,
      label: color,
    }));

  const selectCustomSize = customSizes
    .map((size) => size.trim())
    .filter((size) => size.length > 0)
    .map((size) => ({
      value: size,
      label: size,
    }));

  // Reset state when modal opens
  useEffect(() => {
    if (isVisible) {
      setMode("select");
      setSelectedMeasurementId(null);
    }
  }, [isVisible]);

  const initialValues = {
    bodyType: "",
    height: "",
    bust: "",
    waist: "",
    hips: "",
    shoulderWidth: "",
    armLength: "",
    legLength: "",
    neck: "",
    sleeveLength: "",
    inseam: "",
    thigh: "",
    calf: "",
    additionalNotes: "",
    // additionalProp1: "",
    // additionalProp2: "",
    // additionalProp3: "",
    measurementProfileId: 0,
    customizations: [
      {
        productCustomizationId: "", // e.g., "Color"
        value: "",
      },
      {
        productCustomizationId: "", // e.g., "Size"
        value: "",
      },
    ],
  };

  const validationSchema = Yup.object({
    bodyType: Yup.string().required("Body type is required"),
    height: Yup.number()
      .transform((value, originalValue) =>
        originalValue === "" || originalValue === null ? null : value
      )
      .nullable()
      .min(0, "Height must be positive"),
    bust: Yup.number()
      .min(0, "Bust measurement must be positive")
      .required("Bust measurement is required"),
    waist: Yup.number()
      .min(0, "Waist measurement must be positive")
      .required("Waist measurement is required"),
    hips: Yup.number()
      .min(0, "Hips measurement must be positive")
      .required("Hips measurement is required"),
    shoulderWidth: Yup.number()
      .min(0, "Shoulder width must be positive")
      .required("Shoulder width is required"),
    armLength: Yup.number()
      .min(0, "Arm length must be positive")
      .required("Arm length is required"),
    legLength: Yup.number()
      .min(0, "Leg length must be positive")
      .required("Leg length is required"),
    neck: Yup.number()
      .min(0, "Neck measurement must be positive")
      .required("Neck measurement is required"),
    sleeveLength: Yup.number()
      .min(0, "Sleeve length must be positive")
      .required("Sleeve length is required"),
    inseam: Yup.number()
      .min(0, "Inseam must be positive")
      .required("Inseam is required"),
    thigh: Yup.number()
      .min(0, "Thigh measurement must be positive")
      .required("Thigh measurement is required"),
    calf: Yup.number()
      .min(0, "Calf measurement must be positive")
      .required("Calf measurement is required"),
    additionalNotes: Yup.string(),
    additionalProp1: Yup.string(),
    additionalProp2: Yup.string(),
    additionalProp3: Yup.string(),
  });

  const handleSelectMeasurement = (measurement) => {
    setSelectedMeasurementId(
      measurement.profileId || measurement.measurementId
    );
  };

  const handleUseSelectedMeasurement = () => {
    if (!selectedMeasurementId) {
      toast.error("Please select a measurement");
      return;
    }

    const currentQuantity = quantity && quantity > 0 ? quantity : 1;
    const selectedMeasurement = savedMeasurements.find(
      (m) => (m.profileId || m.measurementId) === selectedMeasurementId
    );

    if (!selectedMeasurement) {
      toast.error("Selected measurement not found");
      return;
    }

    const measurementData = {
      productId: parseInt(productId),
      quantity: currentQuantity,
      measurement: {
        bodyType: selectedMeasurement.bodyType || "",
        height: parseFloat(selectedMeasurement.height) || 0,
        bust: parseFloat(selectedMeasurement.bust) || 0,
        waist: parseFloat(selectedMeasurement.waist) || 0,
        hips: parseFloat(selectedMeasurement.hips) || 0,
        shoulderWidth: parseFloat(selectedMeasurement.shoulderWidth) || 0,
        armLength: parseFloat(selectedMeasurement.armLength) || 0,
        legLength: parseFloat(selectedMeasurement.legLength) || 0,
        neck: parseFloat(selectedMeasurement.neck) || 0,
        sleeveLength: parseFloat(selectedMeasurement.sleeveLength) || 0,
        inseam: parseFloat(selectedMeasurement.inseam) || 0,
        thigh: parseFloat(selectedMeasurement.thigh) || 0,
        calf: parseFloat(selectedMeasurement.calf) || 0,
        additionalNotes: selectedMeasurement.additionalNotes || "",
        customFields: selectedMeasurement.customFields || {},
        customizations: [],
      },
      measurementId: selectedMeasurementId,
      customizations: [],
    };

    // Save measurements to parent component
    if (onSave) {
      onSave(measurementData);
    }

    // Notify parent component that measurement is complete
    if (onMeasurementComplete) {
      onMeasurementComplete();
    }

    toast.success("Measurement selected successfully!");
    onClose();
  };

  const onSubmit = async (values, { setSubmitting }) => {
    try {
      // Use the current quantity prop value (latest value)
      const currentQuantity = quantity && quantity > 0 ? quantity : 1;

      const measurementData = {
        productId: parseInt(productId),
        quantity: currentQuantity,
        measurement: {
          bodyType: values.bodyType,
          height: parseFloat(values.height) || 0,
          bust: parseFloat(values.bust) || 0,
          waist: parseFloat(values.waist) || 0,
          hips: parseFloat(values.hips) || 0,
          shoulderWidth: parseFloat(values.shoulderWidth) || 0,
          armLength: parseFloat(values.armLength) || 0,
          legLength: parseFloat(values.legLength) || 0,
          neck: parseFloat(values.neck) || 0,
          sleeveLength: parseFloat(values.sleeveLength) || 0,
          inseam: parseFloat(values.inseam) || 0,
          thigh: parseFloat(values.thigh) || 0,
          calf: parseFloat(values.calf) || 0,
          additionalNotes: values.additionalNotes || "",
          // customFields: {
          //   additionalProp1: values.additionalProp1 || "",
          //   additionalProp2: values.additionalProp2 || "",
          //   additionalProp3: values.additionalProp3 || "",
          // },
          customizations: [],
        },
        measurementId: values.measurementProfileId || 0,
        customizations: [],
      };

      // Save measurements to parent component
      if (onSave) {
        onSave(measurementData);
      }

      // Notify parent component that measurement is complete
      if (onMeasurementComplete) {
        onMeasurementComplete();
      }

      toast.success("Measurements saved successfully!");

      onClose();
    } catch (error) {
      toast.error("Failed to save measurements");
      console.error("Error saving measurements:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CustomModal
      isVisible={isVisible}
      onClose={onClose}
      classProp="!h-full"
      // customStyles={{
      //   overflowY: "scroll",
      //   height: "fit-content",
      //   width: "90%",
      //   maxWidth: "800px",
      //   maxHeight: "90vh",
      // }}
    >
      <div className="flex flex-col gap-4 px-4 lg:px-0">
        <h3 className="text-xl lg:text-2xl text-center uppercase font-bold tracking-wider">
          Size Form
        </h3>

        {/* Mode Toggle */}
        <div className="flex gap-2 border-b border-gray-200 pb-2">
          <button
            type="button"
            onClick={() => {
              setMode("select");
              setSelectedMeasurementId(null);
            }}
            className={`flex-1 py-2 px-4 rounded-md font-semibold transition-colors ${
              mode === "select"
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Select Existing
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("new");
              setSelectedMeasurementId(null);
            }}
            className={`flex-1 py-2 px-4 rounded-md font-semibold transition-colors ${
              mode === "new"
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Add New
          </button>
        </div>

        <div className="mt-2 lg:px-3">
          {/* Select Existing Measurements */}
          {mode === "select" && (
            <div className="space-y-4">
              {isLoadingMeasurements ? (
                <div className="flex justify-center items-center py-8">
                  <ClipLoader color="#A86746" size={30} />
                </div>
              ) : savedMeasurements.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">
                    No saved measurements found.
                  </p>
                  <button
                    type="button"
                    onClick={() => setMode("new")}
                    className="text-primary hover:underline font-semibold"
                  >
                    Create a new measurement
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {savedMeasurements.map((measurement, index) => {
                      const measurementId =
                        measurement.profileId || measurement.measurementId;
                      const isSelected =
                        selectedMeasurementId === measurementId;

                      return (
                        <div
                          key={measurementId || index}
                          onClick={() => handleSelectMeasurement(measurement)}
                          className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-gray-200 hover:border-primary/50"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-lg text-gray-900 mb-2">
                                {measurement.profileName ||
                                  `Measurement ${index + 1}`}
                              </h4>
                              <div className="text-xs text-gray-500 mb-2 flex gap-3">
                                <span>Body Type: {measurement.bodyType || "N/A"}</span>
                                <span>Height: {measurement.height || "N/A"}</span>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                                <div>
                                  <span className="text-gray-500">Bust:</span>{" "}
                                  <span className="font-medium">
                                    {measurement.bust}"
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Waist:</span>{" "}
                                  <span className="font-medium">
                                    {measurement.waist}"
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Hips:</span>{" "}
                                  <span className="font-medium">
                                    {measurement.hips}"
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-500">
                                    Shoulder:
                                  </span>{" "}
                                  <span className="font-medium">
                                    {measurement.shoulderWidth}"
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Arm:</span>{" "}
                                  <span className="font-medium">
                                    {measurement.armLength}"
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Leg:</span>{" "}
                                  <span className="font-medium">
                                    {measurement.legLength}"
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div
                              className={`ml-4 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                isSelected
                                  ? "border-primary bg-primary"
                                  : "border-gray-300"
                              }`}
                            >
                              {isSelected && (
                                <div className="w-2 h-2 rounded-full bg-white" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="pt-4">
                    <Button
                      className="bg-primary text-white w-full rounded-md"
                      onClick={handleUseSelectedMeasurement}
                      disable={!selectedMeasurementId}
                    >
                      Use Selected Measurement
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Add New Measurement Form */}
          {mode === "new" && (
            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={onSubmit}
              validateOnChange={false}
              validateOnBlur={false}
            >
              {(formik) => {
                return (
                  <Form className="space-y-[20px]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-x-8">
                      <div>
                        <p className="text-sm md:text-sm pb-1 font-semibold">
                          Body Type <span className="text-red-600">*</span>
                        </p>
                        <FormikControl
                          control="select"
                          name="bodyType"
                          options={BODY_TYPE_OPTIONS}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <p className="text-sm md:text-sm pb-1 font-semibold">
                          Height (inches)
                        </p>
                        <FormikControl
                          control="input"
                          type="number"
                          label=""
                          name="height"
                          placeholder="Enter height"
                          className="w-full"
                          step="0.1"
                        />
                      </div>
                    </div>

                    {/* Body Measurements */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-x-8">
                      <div className="">
                        <p className="text-sm md:text-sm pb-1 font-semibold">
                          Bust (inches) <span className="text-red-600">*</span>
                        </p>
                        <FormikControl
                          control="input"
                          type="number"
                          label=""
                          name="bust"
                          placeholder="Enter bust measurement"
                          className="w-full"
                          step="0.1"
                        />
                      </div>

                      <div className="">
                        <p className="text-sm md:text-sm pb-1 font-semibold">
                          Waist (inches) <span className="text-red-600">*</span>
                        </p>
                        <FormikControl
                          control="input"
                          type="number"
                          label=""
                          name="waist"
                          placeholder="Enter waist measurement"
                          className="w-full"
                          step="0.1"
                        />
                      </div>

                      <div className="">
                        <p className="text-sm md:text-sm pb-1 font-semibold">
                          Hips (inches) <span className="text-red-600">*</span>
                        </p>
                        <FormikControl
                          control="input"
                          type="number"
                          label=""
                          name="hips"
                          placeholder="Enter hips measurement"
                          className="w-full"
                          step="0.1"
                        />
                      </div>

                      <div className="">
                        <p className="text-sm md:text-sm pb-1 font-semibold">
                          Shoulder Width (inches){" "}
                          <span className="text-red-600">*</span>
                        </p>
                        <FormikControl
                          control="input"
                          type="number"
                          label=""
                          name="shoulderWidth"
                          placeholder="Enter shoulder width"
                          className="w-full"
                          step="0.1"
                        />
                      </div>

                      <div className="">
                        <p className="text-sm md:text-sm pb-1 font-semibold">
                          Arm Length (inches){" "}
                          <span className="text-red-600">*</span>
                        </p>
                        <FormikControl
                          control="input"
                          type="number"
                          label=""
                          name="armLength"
                          placeholder="Enter arm length"
                          className="w-full"
                          step="0.1"
                        />
                      </div>

                      <div className="">
                        <p className="text-sm md:text-sm pb-1 font-semibold">
                          Leg Length (inches){" "}
                          <span className="text-red-600">*</span>
                        </p>
                        <FormikControl
                          control="input"
                          type="number"
                          label=""
                          name="legLength"
                          placeholder="Enter leg length"
                          className="w-full"
                          step="0.1"
                        />
                      </div>

                      <div className="">
                        <p className="text-sm md:text-sm pb-1 font-semibold">
                          Neck (inches) <span className="text-red-600">*</span>
                        </p>
                        <FormikControl
                          control="input"
                          type="number"
                          label=""
                          name="neck"
                          placeholder="Enter neck measurement"
                          className="w-full"
                          step="0.1"
                        />
                      </div>

                      <div className="">
                        <p className="text-sm md:text-sm pb-1 font-semibold">
                          Sleeve Length (inches){" "}
                          <span className="text-red-600">*</span>
                        </p>
                        <FormikControl
                          control="input"
                          type="number"
                          label=""
                          name="sleeveLength"
                          placeholder="Enter sleeve length"
                          className="w-full"
                          step="0.1"
                        />
                      </div>

                      <div className="">
                        <p className="text-sm md:text-sm pb-1 font-semibold">
                          Inseam (inches){" "}
                          <span className="text-red-600">*</span>
                        </p>
                        <FormikControl
                          control="input"
                          type="number"
                          label=""
                          name="inseam"
                          placeholder="Enter inseam"
                          className="w-full"
                          step="0.1"
                        />
                      </div>

                      <div className="">
                        <p className="text-sm md:text-sm pb-1 font-semibold">
                          Thigh (inches) <span className="text-red-600">*</span>
                        </p>
                        <FormikControl
                          control="input"
                          type="number"
                          label=""
                          name="thigh"
                          placeholder="Enter thigh measurement"
                          className="w-full"
                          step="0.1"
                        />
                      </div>

                      <div className="">
                        <p className="text-sm md:text-sm pb-1 font-semibold">
                          Calf (inches) <span className="text-red-600">*</span>
                        </p>
                        <FormikControl
                          control="input"
                          type="number"
                          label=""
                          name="calf"
                          placeholder="Enter calf measurement"
                          className="w-full"
                          step="0.1"
                        />
                      </div>
                    </div>

                    {/* Additional Notes */}
                    <FormikControl
                      control="input"
                      type="text"
                      label="Additional Notes"
                      name="additionalNotes"
                      placeholder="Any additional notes or special requirements"
                      className="w-full"
                    />

                    <div className="pt-2">
                      <Button
                        className="bg-primary text-white w-full rounded-md"
                        type="submit"
                        disable={formik.isSubmitting}
                        loading={formik.isSubmitting || formik.isLoading}
                      >
                        {formik.isSubmitting ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  </Form>
                );
              }}
            </Formik>
          )}
        </div>
      </div>
    </CustomModal>
  );
};

export default MeasurementFormModal;
