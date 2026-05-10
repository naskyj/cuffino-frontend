"use client";

import React from "react";
import { Form, Formik } from "formik";
import Button from "@/components/button";
import { AuthServices } from "@/services/auth";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import * as Yup from "yup";
import FormikControl from "@/components/formik/formikControl";
import { FiLock, FiShield, FiAlertCircle } from "react-icons/fi";

export default function UserSetting() {
  const initialValues = {
    email: "",
    oldPassword: "",
    newPassword: "",
  };

  const validationSchema = Yup.object({
    email: Yup.string().email("Invalid email").required("Email is required"),
    oldPassword: Yup.string()
      .required("Please enter your current password")
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*:;'><.,/?}{[\]\-_+=])(?=.{8,})/,
        "Must Contain 8 Characters, One Uppercase, One Lowercase, One Number and One Special Case Character"
      ),
    newPassword: Yup.string()
      .required("Please enter your new password")
      .notOneOf([Yup.ref("oldPassword")], "New password must be different from old password"),
  });

  const mutation = useMutation({
    mutationFn: async (values) => {
      const response = await AuthServices.change_password(values);
      return response?.data;
    },
    onSuccess: () => {
      toast.success("Password changed successfully");
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message ?? "An unexpected error occurred"
      );
    },
  });

  return (
    <div className="space-y-6">
      {/* Password Change Card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FiLock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
              <p className="text-sm text-gray-500">Update your account security</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="p-6">
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={(values, { resetForm }) => {
              mutation.mutate(values, {
                onSuccess: () => resetForm(),
              });
            }}
          >
            {(formik) => (
              <Form className="space-y-5">
                <FormikControl
                  control="input"
                  type="email"
                  label="Email Address"
                  name="email"
                  placeholder="Enter your email"
                  className="w-full"
                />
                
                <div className="border-t border-gray-100 pt-5">
                  <FormikControl
                    control="input"
                    type="password"
                    label="Current Password"
                    name="oldPassword"
                    placeholder="Enter your current password"
                    className="w-full"
                  />
                </div>

                <FormikControl
                  control="input"
                  type="password"
                  label="New Password"
                  name="newPassword"
                  placeholder="Enter your new password"
                  className="w-full"
                />

                {/* Password Requirements */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <FiAlertCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-gray-700 mb-1">Password Requirements:</p>
                      <ul className="text-xs text-gray-500 space-y-0.5">
                        <li>At least 8 characters long</li>
                        <li>One uppercase letter (A-Z)</li>
                        <li>One lowercase letter (a-z)</li>
                        <li>One number (0-9)</li>
                        <li>One special character (!@#$%^&*)</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disable={mutation.isLoading || !formik.isValid}
                    loading={mutation.isLoading}
                    className="bg-primary text-white rounded-lg px-8 py-3 font-medium hover:bg-primary/90 transition-all"
                  >
                    Update Password
                  </Button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>

      {/* Security Tips Card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
            <FiShield className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-1">Security Tips</h3>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>Never share your password with anyone</li>
              <li>Use a unique password for this account</li>
              <li>Consider using a password manager</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
