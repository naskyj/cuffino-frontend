"use client";

import React, { useState } from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { IoAddCircleOutline, IoChevronDown } from "react-icons/io5";
import { FiTrash2, FiFileText, FiPlus } from "react-icons/fi";
import FormikControl from "@/components/formik/formikControl";
import Button from "@/components/button";
import { toast } from "sonner";
import useAuth from "@/core/zustand/auth.store";
import { UserServices } from "@/services/user";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const BODY_TYPE_OPTIONS = [
  { key: "Select body type", value: "" },
  { key: "Men", value: "MEN" },
  { key: "Women", value: "WOMEN" },
  { key: "Children", value: "CHILDREN" },
];

const REQUIRED_FIELDS_BY_BODY_TYPE = {
  MEN: ["neck", "shoulderWidth", "bust", "waist", "hips", "sleeveLength", "legLength", "inseam", "thigh", "calf"],
  WOMEN: ["bust", "waist", "hips", "shoulderWidth", "sleeveLength", "legLength", "neck", "inseam", "thigh"],
  CHILDREN: ["height", "bust", "waist", "hips", "sleeveLength", "legLength", "inseam"],
};

const measurementField = (fieldName, label) =>
  Yup.number()
    .typeError(`${label} must be a valid number`)
    .min(0, `${label} must be positive`)
    .nullable()
    .transform((value, originalValue) =>
      originalValue === "" || originalValue === null || originalValue === undefined
        ? null
        : value
    )
    .when("bodyType", {
      is: (bodyType) =>
        !!bodyType && REQUIRED_FIELDS_BY_BODY_TYPE[bodyType]?.includes(fieldName),
      then: (schema) => schema.required(`${label} is required for selected body type`),
      otherwise: (schema) => schema.notRequired(),
    });

const validationSchema = Yup.object({
  profileName: Yup.string().required("Measurement name is required"),
  bodyType: Yup.string().required("Body type is required"),
  height: measurementField("height", "Height"),
  bust: measurementField("bust", "Bust/Chest"),
  waist: measurementField("waist", "Waist"),
  hips: measurementField("hips", "Hips"),
  shoulderWidth: measurementField("shoulderWidth", "Shoulder width"),
  armLength: measurementField("armLength", "Arm length"),
  legLength: measurementField("legLength", "Leg length"),
  neck: measurementField("neck", "Neck"),
  sleeveLength: measurementField("sleeveLength", "Sleeve length"),
  inseam: measurementField("inseam", "Inseam"),
  thigh: measurementField("thigh", "Thigh"),
  calf: measurementField("calf", "Calf"),
});

const MEASUREMENT_HELP = {
  height: {
    text: "Stand straight without shoes and measure from floor to top of head.",
    image: "/assets/images/howItworks/measure.svg",
  },
  bust: {
    text: "Wrap tape around the fullest part of your chest/bust, level all around.",
    image: "/assets/images/howItworks/measure.svg",
  },
  waist: {
    text: "Measure around the narrowest part of your torso, keeping tape snug but not tight.",
    image: "/assets/images/howItworks/measure.svg",
  },
  shoulderWidth: {
    text: "Measure from one shoulder point to the other across your upper back.",
    image: "/assets/images/howItworks/measure.svg",
  },
  neck: {
    text: "Measure around the base of your neck where a collar would sit.",
    image: "/assets/images/howItworks/measure.svg",
  },
  armLength: {
    text: "Measure from shoulder point down to wrist with arm relaxed.",
    image: "/assets/images/howItworks/measure.svg",
  },
  sleeveLength: {
    text: "Measure from shoulder seam to desired cuff end.",
    image: "/assets/images/howItworks/measure.svg",
  },
  hips: {
    text: "Measure around the fullest part of your hips and seat.",
    image: "/assets/images/howItworks/measure.svg",
  },
  legLength: {
    text: "Measure from waist/hip line down to your desired garment hem length.",
    image: "/assets/images/howItworks/measure.svg",
  },
  inseam: {
    text: "Measure from crotch to ankle along the inner leg seam.",
    image: "/assets/images/howItworks/measure.svg",
  },
  thigh: {
    text: "Measure around the fullest part of your upper thigh.",
    image: "/assets/images/howItworks/measure.svg",
  },
  calf: {
    text: "Measure around the fullest part of your calf.",
    image: "/assets/images/howItworks/measure.svg",
  },
};

const MeasurementLabel = ({ label, helpKey }) => {
  const help = MEASUREMENT_HELP[helpKey];

  if (!help) {
    return label;
  }

  return (
    <span className="inline-flex items-center gap-2">
      <span>{label}</span>
      <span className="relative group inline-flex items-center">
        <span
          className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-gray-400 text-[10px] text-gray-600 bg-white cursor-help"
          title={help.text}
        >
          ?
        </span>
        <span className="pointer-events-none absolute left-0 top-6 z-20 hidden w-64 rounded-lg border border-gray-200 bg-white p-3 text-xs text-gray-700 shadow-lg group-hover:block">
          {help.image && (
            <img
              src={help.image}
              alt="Measurement guide"
              className="mb-2 h-20 w-full rounded object-contain bg-gray-50"
            />
          )}
          {help.text}
        </span>
      </span>
    </span>
  );
};

// Measurement stat display component
const MeasurementStat = ({ label, value }) => (
  <div className="bg-gray-50 rounded-lg p-3 text-center">
    <p className="text-xs text-gray-500 mb-1">{label}</p>
    <p className="text-lg font-semibold text-gray-900">
      {typeof value === "number" ? `${value}"` : value}
    </p>
  </div>
);

export default function UserMeasurement() {
  const { user } = useAuth();
  const [showAdditionalField, setShowAdditionalField] = useState(false);
  const [showNoteForTailor, setShowNoteForTailor] = useState(false);
  const queryClient = useQueryClient();

  // Fetch measurements
  const { data: measurements, isLoading } = useQuery({
    queryKey: ["userMeasurements", user?.userId],
    queryFn: () => UserServices.getUserMeasurements(user?.userId),
    enabled: !!user?.userId,
  });

  // Add measurement mutation
  const addMutation = useMutation({
    mutationFn: (payload) => UserServices.addUserMeasurements(payload),
    onSuccess: () => {
      queryClient.invalidateQueries(["userMeasurements", user?.userId]);
      toast.success("Measurement added successfully!");
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message || "Failed to add measurement"
      );
    },
  });

  // Delete measurement mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => UserServices.deleteUserMeasurements(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["userMeasurements", user?.userId]);
      toast.success("Measurement deleted successfully!");
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message || "Failed to delete measurement"
      );
    },
  });

  const initialValues = {
    profileName: "",
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
    preferences: "",
    additionalField: "",
  };

  const handleSubmit = async (values, { resetForm, setSubmitting }) => {
    try {
      const parseOrNull = (value) => {
        if (value === "" || value === null || value === undefined) {
          return null;
        }
        const parsed = parseFloat(value);
        return Number.isNaN(parsed) ? null : parsed;
      };

      // Build customFields object from additional fields
      const customFields = {};
      if (values.preferences) {
        customFields.preferences = values.preferences;
      }
      if (values.additionalField) {
        customFields.additionalField = values.additionalField;
      }

      const payload = {
        userId: user?.userId,
        profileName: values.profileName,
        bodyType: values.bodyType,
        height: parseOrNull(values.height),
        bust: parseOrNull(values.bust),
        waist: parseOrNull(values.waist),
        hips: parseOrNull(values.hips),
        shoulderWidth: parseOrNull(values.shoulderWidth),
        armLength: parseOrNull(values.armLength),
        legLength: parseOrNull(values.legLength),
        neck: parseOrNull(values.neck),
        sleeveLength: parseOrNull(values.sleeveLength),
        inseam: parseOrNull(values.inseam),
        thigh: parseOrNull(values.thigh),
        calf: parseOrNull(values.calf),
        additionalNotes: values.additionalNotes || "",
        customFields: Object.keys(customFields).length > 0 ? customFields : {},
      };

      await addMutation.mutateAsync(payload);
      resetForm();
      setShowAdditionalField(false);
      setShowNoteForTailor(false);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (profileId) => {
    if (window.confirm("Are you sure you want to delete this measurement?")) {
      deleteMutation.mutate(profileId);
    }
  };

  const measurementsList = measurements?.data || [];

  return (
    <div className="space-y-6">
      {/* Add New Measurement Form */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FiPlus className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Add New Measurement
              </h2>
              <p className="text-sm text-gray-500">
                Enter measurements in inches for accurate fitting
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {(formik) => (
              <Form className="space-y-6">
                {/* Profile Name */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormikControl
                      control="input"
                      type="text"
                      label="Measurement Profile Name"
                      name="profileName"
                      placeholder="e.g., Default, Summer 2024, Work Attire"
                      required
                      className="w-full"
                    />
                    <FormikControl
                      control="select"
                      label="Body Type"
                      name="bodyType"
                      options={BODY_TYPE_OPTIONS}
                      className="w-full"
                    />
                  </div>
                  <div className="mt-4">
                    <FormikControl
                      control="input"
                      type="number"
                      label={<MeasurementLabel label="Height (inches)" helpKey="height" />}
                      name="height"
                      placeholder="Optional unless children"
                      className="w-full"
                      step="0.1"
                    />
                  </div>
                  {formik.values.bodyType && (
                    <p className="text-xs text-gray-500 mt-3">
                      Required fields are automatically adjusted for {formik.values.bodyType.toLowerCase()} measurements.
                    </p>
                  )}
                </div>

                {/* Upper Body Section */}
                <div className="border border-gray-100 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-primary/10 text-primary text-xs flex items-center justify-center">1</span>
                    Upper Body
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FormikControl control="input" type="text" label={<MeasurementLabel label={formik.values.bodyType === "MEN" || formik.values.bodyType === "CHILDREN" ? "Chest" : "Bust"} helpKey="bust" />} name="bust" placeholder="Bust or chest measurement" className="w-full" />
                    <FormikControl control="input" type="text" label={<MeasurementLabel label="Waist" helpKey="waist" />} name="waist" placeholder="Waist measurement" required className="w-full" />
                    <FormikControl control="input" type="text" label={<MeasurementLabel label="Shoulder Width" helpKey="shoulderWidth" />} name="shoulderWidth" placeholder="Shoulder width" required className="w-full" />
                    <FormikControl control="input" type="text" label={<MeasurementLabel label="Neck" helpKey="neck" />} name="neck" placeholder="Neck measurement" required className="w-full" />
                    <FormikControl control="input" type="text" label={<MeasurementLabel label="Arm Length" helpKey="armLength" />} name="armLength" placeholder="Arm length" required className="w-full" />
                    <FormikControl control="input" type="text" label={<MeasurementLabel label="Sleeve Length" helpKey="sleeveLength" />} name="sleeveLength" placeholder="Sleeve length" required className="w-full" />
                  </div>
                </div>

                {/* Lower Body Section */}
                <div className="border border-gray-100 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-primary/10 text-primary text-xs flex items-center justify-center">2</span>
                    Lower Body
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FormikControl control="input" type="text" label={<MeasurementLabel label="Hips" helpKey="hips" />} name="hips" placeholder="Hips measurement" required className="w-full" />
                    <FormikControl control="input" type="text" label={<MeasurementLabel label={formik.values.bodyType === "WOMEN" ? "Dress Length" : formik.values.bodyType === "CHILDREN" ? "Garment Length" : "Leg Length"} helpKey="legLength" />} name="legLength" placeholder="Leg or garment length" required className="w-full" />
                    <FormikControl control="input" type="text" label={<MeasurementLabel label="Inseam" helpKey="inseam" />} name="inseam" placeholder="Inseam measurement" required className="w-full" />
                    <FormikControl control="input" type="text" label={<MeasurementLabel label="Thigh" helpKey="thigh" />} name="thigh" placeholder="Thigh measurement" required className="w-full" />
                    <FormikControl control="input" type="text" label={<MeasurementLabel label="Calf" helpKey="calf" />} name="calf" placeholder="Calf measurement" required className="w-full" />
                  </div>
                </div>

                {/* Additional Notes Section */}
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowNoteForTailor(!showNoteForTailor)}
                    className="flex items-center justify-between w-full text-left p-4 hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-sm font-medium text-gray-700">Additional Notes for Tailor</span>
                    <IoChevronDown
                      size={18}
                      className={`text-gray-400 transition-transform ${showNoteForTailor ? "rotate-180" : ""}`}
                    />
                  </button>
                  {showNoteForTailor && (
                    <div className="px-4 pb-4">
                      <FormikControl
                        control="textarea"
                        name="additionalNotes"
                        placeholder="Enter any special instructions or notes..."
                        className="w-full"
                        rows={3}
                      />
                    </div>
                  )}
                </div>

                {/* Custom Fields Section */}
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowAdditionalField(!showAdditionalField)}
                    className="flex items-center justify-between w-full text-left p-4 hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-sm font-medium text-gray-700">Custom Fields (Optional)</span>
                    <IoChevronDown
                      size={18}
                      className={`text-gray-400 transition-transform ${showAdditionalField ? "rotate-180" : ""}`}
                    />
                  </button>
                  {showAdditionalField && (
                    <div className="px-4 pb-4 space-y-4">
                      <p className="text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded-lg p-3">
                        <strong>Format:</strong> Enter additional measurements as{" "}
                        <code className="bg-blue-100 px-1 rounded font-mono">partName:measurement</code>.{" "}
                        For example: <code className="bg-blue-100 px-1 rounded font-mono">ankle:9.5</code> or{" "}
                        <code className="bg-blue-100 px-1 rounded font-mono">wrist:6.5</code>.
                      </p>
                      <FormikControl control="input" type="text" label="Preferences" name="preferences" placeholder="e.g., loose fit, extra room at shoulders" className="w-full" />
                      <FormikControl control="input" type="text" label="Additional Measurement" name="additionalField" placeholder="e.g., ankle:9.5" className="w-full" />
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    className="bg-primary text-white rounded-lg px-8 py-3 font-medium hover:bg-primary/90 transition-all"
                    disable={formik.isSubmitting || !formik.isValid}
                    loading={formik.isSubmitting || addMutation.isLoading}
                  >
                    Save Measurement
                  </Button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>

      {/* Measurements List */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FiFileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Saved Measurements</h2>
              <p className="text-sm text-gray-500">
                {measurementsList.length > 0 ? `${measurementsList.length} profile${measurementsList.length > 1 ? 's' : ''} saved` : 'Your measurement profiles'}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="animate-pulse border border-gray-100 rounded-xl p-5">
                  <div className="h-5 w-32 bg-gray-200 rounded mb-4"></div>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                    {[1, 2, 3, 4, 5, 6].map((j) => (
                      <div key={j} className="h-16 bg-gray-100 rounded-lg"></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : measurementsList.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <FiFileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No measurements yet</h3>
              <p className="text-sm text-gray-500">Add your first measurement profile using the form above.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {measurementsList.map((measurement, index) => (
                <div
                  key={measurement.profileId || measurement.measurementId || index}
                  className="border border-gray-100 rounded-xl p-5 hover:border-primary/20 transition-colors"
                >
                  <div className="flex justify-between items-start mb-5">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {measurement.profileName || `Measurement ${index + 1}`}
                      </h3>
                      {measurement.createdAt && (
                        <p className="text-sm text-gray-500 mt-0.5">
                          Created {new Date(measurement.createdAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(measurement.profileId || measurement.measurementId)}
                      className="w-9 h-9 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-all"
                      disabled={deleteMutation.isLoading}
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                    <MeasurementStat label="Body Type" value={measurement.bodyType || "N/A"} />
                    <MeasurementStat label="Height" value={measurement.height || "N/A"} />
                    <MeasurementStat label="Bust" value={measurement.bust} />
                    <MeasurementStat label="Waist" value={measurement.waist} />
                    <MeasurementStat label="Hips" value={measurement.hips} />
                    <MeasurementStat label="Shoulder" value={measurement.shoulderWidth} />
                    <MeasurementStat label="Arm" value={measurement.armLength} />
                    <MeasurementStat label="Neck" value={measurement.neck} />
                    <MeasurementStat label="Sleeve" value={measurement.sleeveLength} />
                    <MeasurementStat label="Leg" value={measurement.legLength} />
                    <MeasurementStat label="Inseam" value={measurement.inseam} />
                    <MeasurementStat label="Thigh" value={measurement.thigh} />
                    <MeasurementStat label="Calf" value={measurement.calf} />
                  </div>

                  {(measurement.additionalNotes || (measurement.customFields && Object.keys(measurement.customFields).length > 0)) && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      {measurement.additionalNotes && (
                        <div className="mb-3">
                          <p className="text-xs font-medium text-gray-500 uppercase mb-1">Notes</p>
                          <p className="text-sm text-gray-700">{measurement.additionalNotes}</p>
                        </div>
                      )}
                      {measurement.customFields && Object.keys(measurement.customFields).length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(measurement.customFields).map(([key, value]) => (
                            <span key={key} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                              {key}: {value}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

