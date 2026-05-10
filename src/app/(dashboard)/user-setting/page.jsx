"use client";

import React, { useState } from "react";
import { Form, Formik } from "formik";
import Button from "@/components/button";
import { AuthServices } from "@/services/auth";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import * as Yup from "yup";
import FormikControl from "@/components/formik/formikControl";
import { FiLock, FiShield, FiAlertCircle, FiMail } from "react-icons/fi";

const emailSchema = Yup.object({
  email: Yup.string().email("Invalid email").required("Email is required"),
});

const passwordSchema = Yup.object({
  otp: Yup.string().required("Please enter the OTP sent to your email").length(6, "OTP must be 6 digits"),
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

export default function UserSetting() {
  const [step, setStep] = useState(1); // 1 = enter email, 2 = enter OTP + passwords
  const [email, setEmail] = useState("");

  const sendOtpMutation = useMutation({
    mutationFn: async (values) => {
      const response = await AuthServices.send_password_otp({ email: values.email });
      return response?.data;
    },
    onSuccess: (data, variables) => {
      setEmail(variables.email);
      setStep(2);
      toast.success("OTP sent to your email. Please check your inbox.");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message ?? "Failed to send OTP. Please try again.");
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (values) => {
      const response = await AuthServices.change_password({ email, ...values });
      return response?.data;
    },
    onSuccess: () => {
      toast.success("Password changed successfully");
      setStep(1);
      setEmail("");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message ?? "An unexpected error occurred");
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
              <p className="text-sm text-gray-500">
                {step === 1 ? "Enter your email to receive a verification code" : "Enter the code sent to your email"}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {step === 1 ? (
            /* Step 1: Enter email and request OTP */
            <Formik
              initialValues={{ email: "" }}
              validationSchema={emailSchema}
              onSubmit={(values) => sendOtpMutation.mutate(values)}
            >
              {() => (
                <Form className="space-y-5">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                    <FiMail className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-blue-700">
                      For your security, we'll send a one-time code to your email address before allowing a password change.
                    </p>
                  </div>
                  <FormikControl
                    control="input"
                    type="email"
                    label="Email Address"
                    name="email"
                    placeholder="Enter your account email"
                    className="w-full"
                  />
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      loading={sendOtpMutation.isPending}
                      className="bg-primary text-white rounded-lg px-8 py-3 font-medium hover:bg-primary/90 transition-all"
                    >
                      Send Verification Code
                    </Button>
                  </div>
                </Form>
              )}
            </Formik>
          ) : (
            /* Step 2: Enter OTP + new password */
            <Formik
              initialValues={{ otp: "", oldPassword: "", newPassword: "" }}
              validationSchema={passwordSchema}
              onSubmit={(values, { resetForm }) => {
                changePasswordMutation.mutate(values, { onSuccess: () => resetForm() });
              }}
            >
              {() => (
                <Form className="space-y-5">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
                    A 6-digit code was sent to <strong>{email}</strong>. Enter it below along with your new password.
                    <button
                      type="button"
                      className="ml-2 text-primary underline text-xs"
                      onClick={() => setStep(1)}
                    >
                      Use a different email
                    </button>
                  </div>

                  <FormikControl
                    control="input"
                    type="text"
                    label="Verification Code (OTP)"
                    name="otp"
                    placeholder="Enter 6-digit code"
                    className="w-full"
                  />

                  <div className="border-t border-gray-100 pt-5 space-y-4">
                    <FormikControl
                      control="input"
                      type="password"
                      label="Current Password"
                      name="oldPassword"
                      placeholder="Enter your current password"
                      className="w-full"
                    />
                    <FormikControl
                      control="input"
                      type="password"
                      label="New Password"
                      name="newPassword"
                      placeholder="Enter your new password"
                      className="w-full"
                    />
                  </div>

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

                  <div className="flex justify-between items-center pt-2">
                    <button
                      type="button"
                      className="text-sm text-gray-500 hover:text-primary underline"
                      onClick={() => sendOtpMutation.mutate({ email })}
                      disabled={sendOtpMutation.isPending}
                    >
                      Resend code
                    </button>
                    <Button
                      type="submit"
                      loading={changePasswordMutation.isPending}
                      className="bg-primary text-white rounded-lg px-8 py-3 font-medium hover:bg-primary/90 transition-all"
                    >
                      Update Password
                    </Button>
                  </div>
                </Form>
              )}
            </Formik>
          )}
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
              <li>Never share your password or verification code with anyone</li>
              <li>Use a unique password for this account</li>
              <li>Consider using a password manager</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
