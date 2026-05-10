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
import OTPInput from "react-otp-input";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import useAuth from "@/core/zustand/auth.store";
import { Playfair_Display } from "next/font/google";
import DesktopNavbar from "@/components/navbars/desktopNavbar";
import MobileNavbar from "@/components/navbars/mobileNavabr";

const playFair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair_display",
});

export default function VerifyUser() {
  const [errorMessage, setErrorMessage] = useState("");
  const [otp, setOtp] = useState("");
  const [isWrongOtp, setIsWrongOtp] = useState(false);

  const { registerEmail, setRegisterEmail } = useAuth();
  const router = useRouter();

  const isOtpEmpty = otp.trim().length !== 6;

  const mutation = useMutation({
    mutationFn: async () => {
      return AuthServices.verify_user({ email: registerEmail, code: otp });
    },
    onSuccess: (data) => {
      setIsWrongOtp(false);
      toast.success("Verification Success, Please login");
      router.push("/login");
    },
    onError: (error) => {
      setIsWrongOtp(true);
      setErrorMessage(
        error.response?.data?.message ?? "An unexpected error occurred"
      );
      toast.error(
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
          <div className="flex items-center justify-center bg-auth-bg bg-top bg-no-repeat rounded-[14px] shadow bg-white w-full mx-4 md:mx-9 lg:mx-[250px]">
            <div className="w-full px-4 py-[70px] lg:px-20">
              {/* logo */}
              <div className={`text-primary text-center text-3xl pb-10`}>
                Verify Account
              </div>

              <div className="">
                <div className="text-center pb-4 text-sm md:text-base text-gray-600">
                  Enter the 6-digit verification code sent to your email
                </div>

                <div className="py-6 flex justify-center px-3 md:px-0">
                  <OTPInput
                    value={otp}
                    onChange={setOtp}
                    numInputs={6}
                    shouldAutoFocus={true}
                    placeholder=""
                    containerStyle="items-center justify-evenly space-x-2 md:space-x-3"
                    renderInput={(props) => (
                      <input
                        {...props}
                        className={`${
                          isWrongOtp
                            ? "border-red-500 transition ease-in-out duration-150 animate-shake rounded-[10px] text-base md:text-lg text-[#000000] border focus:outline-none font-medium focus:shadow-[0_0_3px_#A86746] !w-full !max-w-[45px] md:!max-w-[55px] h-[45px] md:h-[55px] text-center"
                            : "border-[#E6ECF7] rounded-[10px] text-base md:text-lg text-black bg-placeholder border focus:outline-none font-medium !w-full !max-w-[45px] md:!max-w-[55px] h-[45px] md:h-[55px] focus:shadow-[0_0_3px_#A86746] text-center"
                        }`}
                      />
                    )}
                  />
                </div>

                <div className="flex justify-center items-center text-center pb-4">
                  {errorMessage && <TextError>{errorMessage}</TextError>}
                </div>

                <div className="font-light pb-4">
                  <p className="text-sm text-center">
                    Didn't get the OTP?{" "}
                    <span
                      //   onClick={resendOtp}
                      className="text-primary underline cursor-pointer"
                    >
                      Resend OTP
                    </span>
                  </p>
                </div>

                <div className="flex justify-center pt-4">
                  <div className="w-full !max-w-[600px]">
                    <Button
                      className="bg-[#A86746] text-white rounded-lg !text-base"
                      type="submit"
                      disable={isOtpEmpty || mutation.isLoading}
                      loading={mutation.isLoading}
                      onClick={mutation.mutate}
                    >
                      Verify &amp; Proceed
                    </Button>
                  </div>
                </div>
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
