"use client";

import React, { useState } from "react";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { FiUser, FiPhone, FiMail, FiMapPin, FiCamera } from "react-icons/fi";
import FormikControl from "@/components/formik/formikControl";
import Button from "@/components/button";
import { toast } from "sonner";
import useAuth from "@/core/zustand/auth.store";
import { UserServices } from "@/services/user";
import { useMutation } from "@tanstack/react-query";

const validationSchema = Yup.object({
  username: Yup.string().required("Username is required"),
  address: Yup.string().required("Address is required"),
  phoneNumber: Yup.string(),
});

export default function UserProfile() {
  const [profileImage, setProfileImage] = useState(null);
  const { user, setUser } = useAuth();

  const initialValues = {
    username: user?.username || "",
    address: user?.userDetail?.address || "",
    phoneNumber: user?.userDetail?.phoneNumber || "",
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await UserServices.updateUser(payload, user?.userId);
      return response?.data;
    },
    onSuccess: (data) => {
      if (data) {
        setUser(data);
      }
      toast.success("Profile updated successfully!");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to update profile");
    },
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const payload = {
        username: values.username,
        address: values.address,
        phoneNumber: values.phoneNumber || null,
      };

      await updateMutation.mutateAsync(payload);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  // Get user initials for avatar
  const getInitials = () => {
    if (user?.username) {
      return user.username.slice(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header Background */}
        <div className="h-24 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10"></div>
        
        {/* Profile Info */}
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full border-4 border-white bg-primary/20 overflow-hidden flex items-center justify-center shadow-lg">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-primary">
                    {getInitials()}
                  </span>
                )}
              </div>
              <label
                htmlFor="profileImageUpload"
                className="absolute bottom-1 right-1 w-8 h-8 bg-primary text-white rounded-full cursor-pointer hover:bg-primary/90 transition-all flex items-center justify-center shadow-md"
              >
                <FiCamera size={14} />
              </label>
              <input
                id="profileImageUpload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            {/* Name & Email */}
            <div className="flex-1 pt-2 sm:pb-2">
              <h2 className="text-xl font-semibold text-gray-900">
                {user?.username || "User"}
              </h2>
              <p className="text-sm text-gray-500">{user?.email || ""}</p>
            </div>
          </div>

          {/* Quick Info */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <FiPhone className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Phone</p>
                <p className="text-sm font-medium text-gray-900">
                  {user?.userDetail?.phoneNumber || "Not provided"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <FiMapPin className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Address</p>
                <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                  {user?.userDetail?.address || "Not provided"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {(formik) => (
          <Form className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FiUser className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Personal Information
                  </h2>
                  <p className="text-sm text-gray-500">Update your profile details</p>
                </div>
              </div>

              <div className="space-y-5">
                <FormikControl
                  control="input"
                  type="text"
                  label="Username"
                  name="username"
                  placeholder="Enter username"
                  required
                  className="w-full"
                />

                <FormikControl
                  control="input"
                  type="text"
                  label="Address"
                  name="address"
                  placeholder="Enter your address"
                  required
                  className="w-full"
                />

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <FiPhone className="w-4 h-4 absolute top-3.5 left-4 text-gray-400" />
                    <Field
                      name="phoneNumber"
                      id="phoneNumber"
                      type="text"
                      className="pl-11 w-full py-3 px-4 bg-white text-gray-900 rounded-lg border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button
                type="submit"
                className="bg-primary text-white rounded-lg px-8 py-3 font-medium hover:bg-primary/90 transition-all"
                disable={
                  formik.isSubmitting ||
                  !formik.isValid ||
                  updateMutation.isLoading
                }
                loading={formik.isSubmitting || updateMutation.isLoading}
              >
                Save Changes
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}
