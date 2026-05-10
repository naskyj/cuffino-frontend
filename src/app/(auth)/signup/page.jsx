"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useMutation } from "@tanstack/react-query";

import BackToHome from "@/components/helpers/back-to-home";
// import Switcher from "../../../components/switcher";
import FormikControl from "@/components/formik/formikControl";
import { AuthServices } from "@/services/auth";
import { TextError } from "@/components/utils";
import Button from "@/components/button";
import useAuth from "@/core/zustand/auth.store";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Playfair_Display } from "next/font/google";
import DesktopNavbar from "@/components/navbars/desktopNavbar";
import MobileNavbar from "@/components/navbars/mobileNavabr";

const playFair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair_display",
});

export default function Signup() {
  const [errorMessage, setErrorMessage] = useState("");

  const { registerEmail, setRegisterEmail } = useAuth();
  const router = useRouter();

  const initialValues = {
    username: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    // acceptTerms: false,
  };

  const validationSchema = Yup.object({
    username: Yup.string()
      .required("Please enter your username")
      .test(
        "not-email",
        "Username cannot be an email address",
        (value) => {
          if (!value) return true;
          return !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);
        }
      ),
    email: Yup.string()
      .email("Invalid email format")
      .required("Please enter your email")
      .test(
        "not-same-as-username",
        "Email must be different from username",
        function (value) {
          return value?.toLowerCase() !== this.parent.username?.toLowerCase();
        }
      ),
    phoneNumber: Yup.string().matches(
      /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{4,10}$/,
      "Please enter a valid phone number"
    ),
    password: Yup.string()
      .required("Please enter your password")
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*:;'><.,/?}{[\]\-_+=])(?=.{8,})/,
        "Must Contain 8 Characters, One Uppercase, One Lowercase, One Number and One Special Case Character"
      ),
    confirmPassword: Yup.string()
      .required("Please confirm your password")
      .oneOf([Yup.ref("password")], "Passwords must match"),

    // acceptTerms: Yup.bool().oneOf(
    //   [true],
    //   "You must accept the terms and conditions"
    // ),
  });

  const mutation = useMutation({
    mutationFn: async (values) => {
      const { confirmPassword, ...submitValues } = values;
      return AuthServices.register_user({ ...submitValues });
    },
    onSuccess: (data) => {
      setRegisterEmail(data?.data?.data?.email);
      toast.success("Verification code sent to your email");
      router.push("/verify");
    },
    onError: (error) => {
      console.error("Registration failed", error);
      setErrorMessage(
        error.response?.data?.message ?? "An unexpected error occurred"
      );
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
            utilityClassName="px-6  md:px-9 lg:px-[100px] text-white"
            isAuthPage={true}
            isLogoBlack={false}
          />
        </div>

        <section className="pt-9 pb-36 flex items-center justify-center ">
          <div className="flex items-center justify-center bg-auth-bg bg-center  bg-no-repeat rounded-[14px] shadow bg-white w-full mx-4 md:mx-12 lg:mx-[250px]">
            <div className="w-full px-5 md:px-8 py-[70px] lg:px-20">
              {/* logo */}
              <div className={`text-primary text-center text-3xl pb-10`}>
                Sign Up
              </div>

              <div className="">
                <Formik
                  initialValues={initialValues}
                  validationSchema={validationSchema}
                  validateOnChange={false}
                  validateOnBlur={true}
                  onSubmit={(values) => mutation.mutate(values)}
                >
                  {(formik) => {
                    return (
                      <Form className="space-y-[20px] ">
                        <div>
                          <p className="text-base md:text-lg pb-1 font-normal">
                            Username: <span className="text-red-500">*</span>
                          </p>
                          <FormikControl
                            control="input"
                            type="text"
                            label=""
                            name="username"
                            placeholder=""
                            className=" !w-full"
                          />
                        </div>

                        <div>
                          <p className="text-base md:text-lg pb-1 font-normal">
                            Email Address:{" "}
                            <span className="text-red-500">*</span>
                          </p>
                          <FormikControl
                            control="input"
                            type="email"
                            label=""
                            name="email"
                            placeholder=""
                            className=" !w-full"
                          />
                        </div>

                        <div>
                          <p className="text-base md:text-lg pb-1 font-normal">
                            Phone Number:{" "}
                            <span className="text-gray-400 text-sm font-light">(optional)</span>
                          </p>
                          <FormikControl
                            control="input"
                            type="tel"
                            label=""
                            name="phoneNumber"
                            placeholder="+1 234 567 8900"
                            className=" !w-full"
                          />
                        </div>

                        <div>
                          <p className="text-base md:text-lg pb-1 font-normal">
                            Password: <span className="text-red-500">*</span>
                          </p>
                          <FormikControl
                            control="input"
                            type="password"
                            label=""
                            name="password"
                            placeholder=""
                            className=" !w-full"
                          />
                        </div>

                        <div>
                          <p className="text-base md:text-lg pb-1 font-normal">
                            Confirm Password: <span className="text-red-500">*</span>
                          </p>
                          <FormikControl
                            control="input"
                            type="password"
                            label=""
                            name="confirmPassword"
                            placeholder=""
                            className=" !w-full"
                          />
                        </div>

                        <div className="font-light -translate-y-2">
                          <p className="text-sm ">
                            Already have an account?{" "}
                            <span>
                              <Link
                                href="/login"
                                className="text-primary underline"
                              >
                                Sign In
                              </Link>
                            </span>
                          </p>
                        </div>

                        {errorMessage && <TextError>{errorMessage}</TextError>}

                        <div className=" flex justify-center pt-8">
                          <div className="">
                            <Button
                              className="bg-[#A86746] text-white rounded-lg !text-base min-w-[290px] lg:!min-w-[600px]"
                              type="submit"
                              disable={mutation.isLoading}
                              loading={mutation.isLoading}
                            >
                              {formik.isSubmitting ? "Register" : "Register"}
                            </Button>
                          </div>
                        </div>
                      </Form>
                    );
                  }}
                </Formik>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* <Switcher /> */}
      <BackToHome />
    </>
  );
}
