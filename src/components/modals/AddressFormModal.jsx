"use client";

import React from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import Button from "@/components/button";
import AutoComplete from "@/components/input/AutoComplete";
import CustomModal from ".";

const getValidationSchema = () =>
  Yup.object({
    streetAddress: Yup.string().required("Street Address is required"),
    city: Yup.string().required("City is required"),
    state: Yup.string().required("State is required"),
    postalCode: Yup.string().required("Postal Code is required"),
    country: Yup.string().required("Country is required"),
  });

export default function AddressFormModal({
  isVisible,
  onClose,
  onSubmit,
  initialValues = {
    streetAddress: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    label: "",
    isDefault: false,
  },
  submitLabel = "Save Address",
  loading = false,
}) {
  return (
    <CustomModal isVisible={isVisible} onClose={onClose}>
      <div className="px-2 sm:px-0">
        <h3 className="text-xl font-semibold text-primary text-center mb-2">
          {submitLabel}
        </h3>
        <Formik
          initialValues={initialValues}
          validationSchema={getValidationSchema()}
          onSubmit={async (values, actions) => {
            try {
              await onSubmit(values, actions);
              actions.setSubmitting(false);
            } catch (err) {
              actions.setSubmitting(false);
            }
          }}
          enableReinitialize
        >
          {(formik) => (
            <Form className="space-y-4">
              <AutoComplete
                form={formik}
                name="streetAddress"
                fieldNames={{
                  city: "city",
                  state: "state",
                  postalCode: "postalCode",
                  country: "country",
                }}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    name="city"
                    className="w-full border rounded px-3 py-2"
                    value={formik.values.city}
                    onChange={formik.handleChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <input
                    name="state"
                    className="w-full border rounded px-3 py-2"
                    value={formik.values.state}
                    onChange={formik.handleChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Postal Code
                  </label>
                  <input
                    name="postalCode"
                    className="w-full border rounded px-3 py-2"
                    value={formik.values.postalCode}
                    onChange={formik.handleChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <input
                    name="country"
                    className="w-full border rounded px-3 py-2"
                    value={formik.values.country}
                    onChange={formik.handleChange}
                    placeholder="e.g., Canada"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address Line 2 (Optional)
                </label>
                <input
                  name="addressLine2"
                  className="w-full border rounded px-3 py-2"
                  value={formik.values.addressLine2}
                  onChange={formik.handleChange}
                  placeholder="Apartment, suite, unit, building, floor, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Label (Optional)
                </label>
                <input
                  name="label"
                  className="w-full border rounded px-3 py-2"
                  value={formik.values.label}
                  onChange={formik.handleChange}
                  placeholder="e.g., Home, Work, Office"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isDefault"
                  name="isDefault"
                  checked={formik.values.isDefault}
                  onChange={formik.handleChange}
                  className="mr-2"
                />
                <label htmlFor="isDefault" className="text-sm text-gray-700">
                  Set as default address
                </label>
              </div>
              <div className="flex gap-2 justify-end mt-3">
                <Button
                  type="button"
                  className="bg-gray-200 text-gray-700 rounded px-4"
                  onClick={onClose}
                  disable={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-primary text-white rounded px-4"
                  loading={formik.isSubmitting || loading}
                  disable={formik.isSubmitting || !formik.isValid || loading}
                >
                  {submitLabel}
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </CustomModal>
  );
}

