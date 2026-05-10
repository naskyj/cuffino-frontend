"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserServices } from "@/services/user";
import useAuth from "@/core/zustand/auth.store";
import Button from "@/components/button";
import AddressFormModal from "@/components/modals/AddressFormModal";
import { FiMapPin, FiEdit2, FiTrash2, FiPlus, FiCheck, FiStar } from "react-icons/fi";

export default function UserDeliveryAddresses() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [modalMode, setModalMode] = useState(null);
  const [editAddress, setEditAddress] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);

  // Fetch addresses
  const { data, isLoading, error } = useQuery({
    queryKey: ["addresses", user?.userId],
    queryFn: async () => {
      const res = await UserServices.getUsersAddresses(user?.userId);
      return res?.data;
    },
    enabled: !!user?.userId,
  });
  const addresses = data || [];

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: async (addressId) => {
      await UserServices.deleteUserAddressDetails(user.userId, addressId);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["addresses", user?.userId] }),
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (addressId) => {
      await UserServices.setDefaultAddress(user.userId, addressId);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["addresses", user?.userId] }),
  });

  const handleDelete = (addressId) => {
    setLoadingAction(true);
    deleteMutation.mutate(addressId, {
      onSettled: () => setLoadingAction(false),
    });
  };

  const handleSetDefault = (addressId) => {
    setLoadingAction(true);
    setDefaultMutation.mutate(addressId, {
      onSettled: () => setLoadingAction(false),
    });
  };

  const openAddModal = () => {
    setModalMode("add");
    setEditAddress(null);
    setShowModal(true);
  };

  const openEditModal = (address) => {
    setModalMode("edit");
    setEditAddress(address);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditAddress(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FiMapPin className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Delivery Addresses</h2>
              <p className="text-sm text-gray-500">
                {addresses.length > 0 ? `${addresses.length} address${addresses.length > 1 ? 'es' : ''} saved` : 'Manage your shipping locations'}
              </p>
            </div>
          </div>
          <Button 
            type="button" 
            className="bg-primary text-white rounded-lg px-5 py-2.5 font-medium hover:bg-primary/90 transition-all flex items-center gap-2"
            onClick={openAddModal}
          >
            <FiPlus className="w-4 h-4" />
            Add Address
          </Button>
        </div>
      </div>

      {/* Addresses List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 bg-gray-200 rounded"></div>
                  <div className="h-3 w-32 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 rounded-xl border border-red-100 p-6 text-center">
          <p className="text-red-600">Failed to load addresses. Please try again.</p>
        </div>
      ) : addresses.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FiMapPin className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No addresses saved</h3>
            <p className="text-sm text-gray-500 mb-4">Add your first delivery address to get started.</p>
            <Button 
              type="button"
              className="bg-primary text-white rounded-lg px-6 py-2.5 font-medium"
              onClick={openAddModal}
            >
              Add Your First Address
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {addresses.map((address) => (
            <div
              key={address.id || address.addressId}
              className={`bg-white rounded-xl border shadow-sm p-5 transition-all ${
                address.isDefault 
                  ? "border-primary/30 ring-1 ring-primary/10" 
                  : "border-gray-100 hover:border-gray-200"
              }`}
            >
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Address Icon */}
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  address.isDefault ? "bg-primary/10" : "bg-gray-100"
                }`}>
                  <FiMapPin className={`w-5 h-5 ${address.isDefault ? "text-primary" : "text-gray-500"}`} />
                </div>

                {/* Address Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {address.label && (
                      <span className="text-sm font-medium text-gray-900">{address.label}</span>
                    )}
                    {address.isDefault && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-primary text-white rounded-full">
                        <FiStar className="w-3 h-3" />
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-gray-900 font-medium">{address.streetAddress}</p>
                  {address.addressLine2 && (
                    <p className="text-sm text-gray-600">{address.addressLine2}</p>
                  )}
                  <p className="text-sm text-gray-500">
                    {address.city}, {address.state} {address.postalCode}
                    {address.country && `, ${address.country}`}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditModal(address)}
                    className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                    title="Edit"
                  >
                    <FiEdit2 className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(address.addressId)}
                    disabled={loadingAction && deleteMutation.variables === address.addressId}
                    className="w-9 h-9 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    <FiTrash2 className="w-4 h-4 text-red-600" />
                  </button>
                  {!address.isDefault && (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(address.addressId)}
                      disabled={loadingAction && setDefaultMutation.variables === address.addressId}
                      className="px-3 h-9 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-sm font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <FiCheck className="w-4 h-4" />
                      Set Default
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <AddressFormModal
          isVisible={showModal}
          onClose={closeModal}
          onSubmit={async (values, actions) => {
            // Decide: add or edit
            setLoadingAction(true);
            try {
              const addressPayload = {
                streetAddress: values.streetAddress,
                addressLine2: values.addressLine2 || "",
                city: values.city,
                state: values.state,
                postalCode: values.postalCode,
                country: values.country,
                label: values.label || "",
                isDefault: values.isDefault,
              };

              if (modalMode === "add") {
                await UserServices.addAddress(user.userId, addressPayload);
              } else if (modalMode === "edit" && editAddress) {
                await UserServices.editUserAddressDetails(
                  user.userId,
                  editAddress.addressId,
                  addressPayload
                );
              }
              await queryClient.invalidateQueries({ queryKey: ["addresses", user.userId] });
              closeModal();
            } catch (err) {
              actions.setSubmitting(false);
            } finally {
              setLoadingAction(false);
            }
          }}
          initialValues={
            modalMode === "edit" && editAddress
              ? {
                  streetAddress: editAddress.streetAddress || "",
                  addressLine2: editAddress.addressLine2 || "",
                  city: editAddress.city || "",
                  state: editAddress.state || "",
                  postalCode: editAddress.postalCode || "",
                  country: editAddress.country || "",
                  label: editAddress.label || "",
                  isDefault: editAddress.isDefault || false,
                }
              : {
                  streetAddress: "",
                  addressLine2: "",
                  city: "",
                  state: "",
                  postalCode: "",
                  country: "",
                  label: "",
                  isDefault: false,
                }
          }
          submitLabel={modalMode === "add" ? "Add Address" : "Save Changes"}
          loading={loadingAction}
        />
      )}
    </div>
  );
}

