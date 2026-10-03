"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Form, Formik } from "formik";
import * as Yup from "yup";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import FormikControl from "@/components/formik/formikControl";
import { TextError } from "@/components/utils";
import Button from "@/components/button";
import BackToHome from "@/components/helpers/back-to-home";
import DesktopNavbar from "@/components/navbars/desktopNavbar";
import MobileNavbar from "@/components/navbars/mobileNavabr";
import { AuthServices } from "@/services/auth";

// This page used to be step one of a flow with no step two: it emailed a code and then simply
// said "code sent", with nowhere to type the code and no way to actually set a new password. The
// missing half couldn't be built against /user/change-password either, because that endpoint
// demands the CURRENT password alongside the code - which is precisely what someone resetting a
// forgotten password doesn't have. It now completes against /user/reset-password (code + new
// password, no old password).

const emailSchema = Yup.object({
  email: Yup.string().email("Invalid email format").required("Please enter your email"),
});

const resetSchema = Yup.object({
  otp: Yup.string()
    .required("Please enter the code from your email")
    .matches(/^\d{6}$/, "The code is 6 digits"),
  newPassword: Yup.string()
    .required("Please enter a new password")
    .min(8, "Password must be at least 8 characters")
    // Mirrors the backend's ResetPasswordDTO pattern so the rule is enforced before a round trip.
    .matches(/^(?=.*[A-Za-z])(?=.*\d).*$/, "Password must contain at least one letter and one number"),
  confirmPassword: Yup.string()
    .required("Please confirm your new password")
    .oneOf([Yup.ref("newPassword")], "Passwords don't match"),
});

export default function ForgotPassword() {
  const router = useRouter();
  const [step, setStep] = useState("request"); // "request" | "reset"
  const [email, setEmail] = useState("");

  const sendCode = useMutation({
    mutationFn: async (values) => {
      const response = await AuthServices.send_password_otp({ email: values.email });
      return response?.data;
    },
    onSuccess: (_data, values) => {
      setEmail(values.email);
      setStep("reset");
      toast.success("Verification code sent to your email");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message ?? "Failed to send reset code");
    },
  });

  const resetPassword = useMutation({
    mutationFn: async (values) => {
      const response = await AuthServices.reset_password({
        email,
        otp: values.otp,
        newPassword: values.newPassword,
      });
      return response?.data;
    },
    onSuccess: () => {
      toast.success("Password reset. Please sign in with your new password.");
      router.push("/login");
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message ?? "That code is invalid or has expired. Please try again."
      );
    },
  });

  const resendCode = () => {
    if (!email) return;
    sendCode.mutate({ email });
  };

  return (
    <>
      <div className="bg-primary min-h-screen bg-center bg-no-repeat bg-cover">
        <div className="pb-12">
          <div className="xl:px-[100px]">
            <DesktopNavbar
              textColor={`!text-white`}
              isLogoBlack={false}
              isAuthPage={true}
            />
          </div>
          <MobileNavbar
            utilityClassName="px-6 md:px-9 lg:px-[100px] text-white"
            isAuthPage={true}
            isLogoBlack={false}
          />
        </div>

        <section className="pt-9 pb-36 flex items-center justify-center">
          <div className="flex items-center justify-center bg-auth-bg bg-center bg-no-repeat rounded-[14px] shadow bg-white w-full mx-4 md:mx-12 lg:mx-[250px]">
            <div className="w-full px-5 md:px-8 py-[70px] lg:px-20">
              <div className="text-primary text-center text-3xl pb-10">
                {step === "request" ? "Forgot Password" : "Reset Your Password"}
              </div>

              {step === "request" ? (
                <Formik
                  initialValues={{ email: "" }}
                  validationSchema={emailSchema}
                  validateOnChange={false}
                  validateOnBlur={true}
                  onSubmit={(values) => sendCode.mutate(values)}
                >
                  {() => (
                    <Form className="space-y-[20px]">
                      <p className="text-gray-600 text-sm md:text-base">
                        Please enter your email address. We will send a verification code to reset your password.
                      </p>

                      <div>
                        <p className="text-base md:text-lg pb-1 font-normal">
                          Email Address: <span className="text-red-500">*</span>
                        </p>
                        <FormikControl
                          control="input"
                          type="email"
                          label=""
                          name="email"
                          placeholder="Enter your account email"
                          className="!w-full"
                        />
                      </div>

                      <div className="flex justify-center pt-6">
                        <Button
                          className="bg-[#A86746] text-white rounded-lg !text-base min-w-[290px] lg:!min-w-[600px]"
                          type="submit"
                          disable={sendCode.isPending}
                          loading={sendCode.isPending}
                        >
                          Send Code
                        </Button>
                      </div>

                      <div className="font-light -translate-y-1 text-center">
                        <p className="text-sm">
                          Remember your password?{" "}
                          <Link
                            href="/login"
                            className="text-primary underline text-base font-semibold hover:text-[#8f563a]"
                          >
                            Sign In
                          </Link>
                        </p>
                      </div>

                      {sendCode.isError && (
                        <TextError>
                          {sendCode.error?.response?.data?.message ?? "An unexpected error occurred"}
                        </TextError>
                      )}
                    </Form>
                  )}
                </Formik>
              ) : (
                <Formik
                  initialValues={{ otp: "", newPassword: "", confirmPassword: "" }}
                  validationSchema={resetSchema}
                  validateOnChange={false}
                  validateOnBlur={true}
                  onSubmit={(values) => resetPassword.mutate(values)}
                >
                  {() => (
                    <Form className="space-y-[20px]">
                      <p className="text-gray-600 text-sm md:text-base">
                        We sent a 6-digit code to{" "}
                        <span className="font-semibold">{email}</span>. Enter it below with your
                        new password. The code expires in 15 minutes.
                      </p>

                      <div>
                        <p className="text-base md:text-lg pb-1 font-normal">
                          Verification Code: <span className="text-red-500">*</span>
                        </p>
                        <FormikControl
                          control="input"
                          type="text"
                          label=""
                          name="otp"
                          placeholder="6-digit code"
                          className="!w-full"
                        />
                      </div>

                      <div>
                        <p className="text-base md:text-lg pb-1 font-normal">
                          New Password: <span className="text-red-500">*</span>
                        </p>
                        <FormikControl
                          control="input"
                          type="password"
                          label=""
                          name="newPassword"
                          placeholder="At least 8 characters, with a letter and a number"
                          className="!w-full"
                        />
                      </div>

                      <div>
                        <p className="text-base md:text-lg pb-1 font-normal">
                          Confirm New Password: <span className="text-red-500">*</span>
                        </p>
                        <FormikControl
                          control="input"
                          type="password"
                          label=""
                          name="confirmPassword"
                          placeholder="Repeat your new password"
                          className="!w-full"
                        />
                      </div>

                      <div className="flex justify-center pt-6">
                        <Button
                          className="bg-[#A86746] text-white rounded-lg !text-base min-w-[290px] lg:!min-w-[600px]"
                          type="submit"
                          disable={resetPassword.isPending}
                          loading={resetPassword.isPending}
                        >
                          Reset Password
                        </Button>
                      </div>

                      <div className="font-light text-center space-y-1">
                        <p className="text-sm">
                          Didn&apos;t get the code?{" "}
                          <button
                            type="button"
                            onClick={resendCode}
                            disabled={sendCode.isPending}
                            className="text-primary underline font-semibold hover:text-[#8f563a] disabled:opacity-50"
                          >
                            {sendCode.isPending ? "Sending..." : "Send it again"}
                          </button>
                        </p>
                        <p className="text-sm">
                          Wrong email?{" "}
                          <button
                            type="button"
                            onClick={() => setStep("request")}
                            className="text-primary underline font-semibold hover:text-[#8f563a]"
                          >
                            Start over
                          </button>
                        </p>
                      </div>

                      {resetPassword.isError && (
                        <TextError>
                          {resetPassword.error?.response?.data?.message ??
                            "An unexpected error occurred"}
                        </TextError>
                      )}
                    </Form>
                  )}
                </Formik>
              )}
            </div>
          </div>
        </section>
      </div>

      <BackToHome />
    </>
  );
}
