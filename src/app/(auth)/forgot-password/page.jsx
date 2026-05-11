"use client";

import React from "react";
import Link from "next/link";
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

const validationSchema = Yup.object({
  email: Yup.string().email("Invalid email format").required("Please enter your email"),
});

export default function ForgotPassword() {
  const mutation = useMutation({
    mutationFn: async (values) => {
      const response = await AuthServices.send_password_otp({ email: values.email });
      return response?.data;
    },
    onSuccess: () => {
      toast.success("Verification code sent to your email");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message ?? "Failed to send reset code");
    },
  });

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
                Forgot Password
              </div>

              <Formik
                initialValues={{ email: "" }}
                validationSchema={validationSchema}
                validateOnChange={false}
                validateOnBlur={true}
                onSubmit={(values) => mutation.mutate(values)}
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
                        disable={mutation.isPending}
                        loading={mutation.isPending}
                      >
                        Send
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

                    {mutation.isError && (
                      <TextError>
                        {mutation.error?.response?.data?.message ?? "An unexpected error occurred"}
                      </TextError>
                    )}
                  </Form>
                )}
              </Formik>
            </div>
          </div>
        </section>
      </div>

      <BackToHome />
    </>
  );
}
