"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

// import Switcher from "../../../components/switcher";
import BackToHome from "@/components/helpers/back-to-home";
import { Form, Formik } from "formik";
import FormikControl from "@/components/formik/formikControl";
import { TextError } from "@/components/utils";
import { AuthServices } from "@/services/auth";
import { useMutation } from "@tanstack/react-query";
import * as Yup from "yup";
import Button from "@/components/button";
import { useRouter } from "next/navigation";
import useAuth from "@/core/zustand/auth.store";
import { useSearchParams } from "next/navigation";
import { Playfair_Display } from "next/font/google";
import DesktopNavbar from "@/components/navbars/desktopNavbar";
import MobileNavbar from "@/components/navbars/mobileNavabr";
import { toast } from "sonner";

const playFair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair_display",
});

export default function Login() {
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, setUser, setProfilePromptDismissed } = useAuth();

  const initialValues = {
    username: "",
    password: "",
    rememberMe: false,
  };

  const validationSchema = Yup.object({
    username: Yup.string().required("Please enter your username or email"),
    password: Yup.string().required("Please enter your password"),
    // .matches(
    //   /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*:;'><.,/?}{[\]\-_+=])(?=.{8,})/,
    //   "Must Contain 8 Characters, One Uppercase, One Lowercase, One Number and One Special Case Character"
    // ),
  });

  const mutation = useMutation({
    mutationFn: async (values) => {
      setLoading(true);
      const response = await AuthServices.login_user({
        username: values.username,
        password: values.password,
      });
      return response.data;
    },
    onSuccess: (data) => {
      localStorage.setItem("token", data?.token);
      localStorage.setItem("refreshToken", data?.refreshToken);
      localStorage.setItem("userId", data?.user?.userId);
      setUser(data?.user);
      if (useAuth.getState().setToken) {
        useAuth.getState().setToken(data?.token);
      }
      if (useAuth.getState().setRefreshToken) {
        useAuth.getState().setRefreshToken(data?.refreshToken);
      }
      setProfilePromptDismissed(false); // Reset so profile prompt shows
      toast.success("Login successful");
      const from = searchParams.get("from") || "/";
      router.push(from);
      setLoading(false);
    },
    onError: (error) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "An unexpected error occurred";

      setErrorMessage(errorMessage);
      setLoading(false);
    },
  });

  // useEffect(() => {
  //   if (user) {
  //     const from = searchParams.get("from") || "/";
  //     router.push(from); //check if there's a query parameter
  //   }
  // }, [user]);

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
          <div className="flex items-center justify-center bg-auth-bg bg-center hero-bg-position bg-no-repeat rounded-[14px] shadow bg-white w-full mx-4 md:mx-12 lg:mx-[250px]">
            <div className="w-full px-5 md:px-8 py-[70px] lg:px-20">
              {/* logo */}
              <div className={`text-primary text-center text-3xl pb-10`}>
                Login
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
                            Username or Email: <span className="text-red-500">*</span>
                          </p>
                          <FormikControl
                            control="input"
                            type="text"
                            label=""
                            name="username"
                            placeholder="Enter your username or email"
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
                        <div className="font-light -translate-y-2">
                          <p className="text-sm ">
                            Don't have an account yet?{" "}
                            <span>
                              <Link
                                href="/signup"
                                className="text-primary underline"
                              >
                                Sign Up
                              </Link>
                            </span>
                          </p>
                        </div>

                        {errorMessage && <TextError>{errorMessage}</TextError>}
                        {/* <div className="flex !pt-1 md:!pt-0 sharp-sans justify-between items-center">
                       <div className="gap-x-2 flex items-center">
                         <input
                           type="checkbox"
                           id="rememberMe"
                           className="hidden"
                           name="rememberMe"
                           onChange={formik.handleChange}
                           onBlur={formik.handleBlur}
                           checked={formik.values.rememberMe}
                         />
                         <label
                           htmlFor="rememberMe"
                           className={`w-[15px] h-[15px] lg:w-[18px] lg:h-[18px] flex items-center justify-center border border-gray-300 rounded cursor-pointer ${
                             formik.values.rememberMe
                               ? "bg-[#A86746] border-0"
                               : "bg-white"
                           }`}
                         >
                           {formik.values.rememberMe && (
                             <svg
                               className="w-3 h-3 text-white"
                               xmlns="http://www.w3.org/2000/svg"
                               fill="none"
                               viewBox="0 0 24 24"
                               stroke="currentColor"
                               strokeWidth={4}
                             >
                               <path
                                 strokeLinecap="round"
                                 strokeLinejoin="round"
                                 d="M5 13l4 4L19 7"
                               />
                             </svg>
                           )}
                         </label>
                         <label
                           htmlFor="rememberMe"
                           className="text-[#6b7280] font-[400] text-sm lg:text-base"
                         >
                           Remember Me
                         </label>
                       </div>
                       <Link
                         href={"/auth/forgot-password"}
                         className="text-sm text-primary rounded sharp-sans-bold"
                       >
                         Forgot Password?
                       </Link>
                     </div> */}

                        <div className=" flex justify-center pt-8">
                          <div className="">
                            <Button
                              className="bg-[#A86746] text-white rounded-lg !text-base min-w-[290px] lg:!min-w-[600px]"
                              type="submit"
                              disable={mutation.isLoading}
                              loading={
                                 loading
                              }
                            >
                              {formik.isSubmitting ? "Login" : "Login"}
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
