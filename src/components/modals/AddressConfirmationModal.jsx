"use client";

import React, { useState } from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useQuery } from "@tanstack/react-query";
import FormikControl from "../formik/formikControl";
import Button from "../button";
import { toast } from "sonner";
import useAuth from "@/core/zustand/auth.store";
import { UserServices } from "@/services/user";
import CustomModal from "./index";
import AutoComplete from "../input/AutoComplete";
import AddressFormModal from "./AddressFormModal";

const getValidationSchema = (updateAddress) => {
  if (!updateAddress) return Yup.object({});
  return Yup.object({
    address: Yup.string().required("Address is required"),
  });
};

const AddressConfirmationModal = ({ isVisible, onClose, onConfirm }) => {
  const { user } = useAuth();
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [updateAddress, setUpdateAddress] = useState(false);
  const currentAddress = user?.userDetail?.address || "";

  // Fetch user's delivery addresses
  const { data: addresses, isLoading, refetch } = useQuery({
    queryKey: ["addresses", user?.userId],
    queryFn: async () => {
      const res = await UserServices.getUsersAddresses(user?.userId);
      return res?.data || [];
    },
    enabled: !!user?.userId && isVisible,
    onSuccess: (data) => {
      // Set default address as selected initially
      if (data && data.length > 0 && !selectedAddressId) {
        const defaultAddress = data.find(addr => addr.isDefault);
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.addressId);
        } else {
          setSelectedAddressId(data[0].addressId);
        }
      }
    },
  });

  const initialValues = {
    address: currentAddress,
  };

  const handleAddressSelect = (addressId) => {
    setSelectedAddressId(addressId);
  };

  const handleConfirm = () => {
    if (selectedAddressId) {
      onConfirm(selectedAddressId);
    }
  };

  const handleAddAddressSuccess = () => {
    setShowAddModal(false);
    // Query will refetch automatically when modal reopens
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      if (updateAddress && values.address !== currentAddress) {
        // Address was updated, pass the new address to onConfirm
        onConfirm(values.address);
      } else {
        // Address is correct, pass null to indicate no update needed
        onConfirm(null);
      }
    } catch (error) {
      toast.error("Failed to process address");
      console.error("Error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <CustomModal
        isVisible={isVisible}
        onClose={onClose}
        className="max-w-2xl"
      >
        <div className="px-4 lg:px-6 py-4">
          <h3 className="text-xl font-semibold text-primary text-center mb-6">
            Select Delivery Address
          </h3>

          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : addresses && addresses.length > 0 ? (
            <div className="space-y-3 mb-6">
              <p className="text-gray-700 mb-4">Choose a delivery address:</p>
              {addresses.map((address) => (
                <div
                  key={address.addressId}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedAddressId === address.addressId
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => handleAddressSelect(address.addressId)}
                >
                  <div className="flex items-start">
                    <input
                      type="radio"
                      name="deliveryAddress"
                      checked={selectedAddressId === address.addressId}
                      onChange={() => handleAddressSelect(address.addressId)}
                      className="mt-1 mr-3 text-primary focus:ring-primary"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {address.streetAddress}
                      </div>
                      {address.addressLine2 && (
                        <div className="text-sm text-gray-600">
                          {address.addressLine2}
                        </div>
                      )}
                      <div className="text-sm text-gray-500">
                        {address.city}, {address.state} {address.postalCode}
                        {address.country && `, ${address.country}`}
                      </div>
                      {address.label && (
                        <div className="text-xs text-gray-500 mt-1 italic">
                          {address.label}
                        </div>
                      )}
                      {address.isDefault && (
                        <span className="inline-block mt-2 py-1 px-2 text-xs font-semibold bg-primary text-white rounded">
                          Default
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="mb-4">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No delivery addresses found
              </h3>
              <p className="text-gray-500 mb-6">
                Add a delivery address to continue with your order.
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              className="bg-gray-200 text-gray-700 rounded"
              onClick={() => setShowAddModal(true)}
            >
              Add New Address
            </Button>

            <div className="flex gap-3 flex-1">
              <Button
                type="button"
                className="bg-gray-200 text-gray-700 rounded flex-1"
                onClick={onClose}
              >
                Cancel
              </Button>

              <Button
                type="button"
                className="bg-primary text-white rounded flex-1"
                onClick={handleConfirm}
                disable={!selectedAddressId}
              >
                Confirm Address
              </Button>
            </div>
          </div>

          {/* Legacy address update section - keep for backward compatibility */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="updateAddress"
                checked={updateAddress}
                onChange={(e) => setUpdateAddress(e.target.checked)}
                className="mr-2 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label
                htmlFor="updateAddress"
                className="text-gray-700 cursor-pointer text-sm"
              >
                Or update your profile address instead
              </label>
            </div>

            {updateAddress && (
              <Formik
                initialValues={initialValues}
                validationSchema={getValidationSchema(updateAddress)}
                onSubmit={handleSubmit}
                enableReinitialize
              >
                {(formik) => (
                  <Form className="space-y-4 mt-4">
                    <AutoComplete form={formik} name="address" />
                    <Button
                      type="submit"
                      className="w-full bg-primary text-white rounded"
                      disable={formik.isSubmitting || !formik.isValid}
                      loading={formik.isSubmitting}
                    >
                      Update Profile Address
                    </Button>
                  </Form>
                )}
              </Formik>
            )}
          </div>
        </div>
      </CustomModal>

      {/* Add Address Modal */}
      <AddressFormModal
        isVisible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={async (values, actions) => {
          try {
            await UserServices.addAddress(user.userId, {
              streetAddress: values.streetAddress,
              addressLine2: values.addressLine2 || "",
              city: values.city,
              state: values.state,
              postalCode: values.postalCode,
              country: values.country,
              label: values.label || "",
              isDefault: values.isDefault,
            });
            handleAddAddressSuccess();
            actions.setSubmitting(false);
          } catch (err) {
            actions.setSubmitting(false);
            throw err;
          }
        }}
        submitLabel="Add Address"
      />
    </>
  );
};

export default AddressConfirmationModal;
