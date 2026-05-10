"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FiCheckCircle, FiHome, FiShoppingBag } from "react-icons/fi";
import Footer from "@/components/footer";
import { Playfair_Display } from "next/font/google";
import MobileNavbar from "@/components/navbars/mobileNavabr";
import DesktopNavbar from "@/components/navbars/desktopNavbar";
import { IoChevronBack } from "react-icons/io5";
import Image from "next/image";

const playFair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair_display",
});

const CheckoutSuccessPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState("");

  useEffect(() => {
    const orderIdParam = searchParams.get("orderId");
    if (orderIdParam) {
      setOrderId(orderIdParam);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="linearGradientBackground pb-8 sm:pb-12">
        <div className="xl:px-[100px]">
          <DesktopNavbar textColor={`!text-black`} />
        </div>
        <MobileNavbar utilityClassName="px-6 md:px-9 lg:px-0 lg:px-[100px]" />
        <div className="flex sm:flex-row justify-end gap-3 sm:gap-0 pt-4 sm:pt-6 md:pt-10 px-5 md:px-8 lg:px-[100px]">
          <Link
            href="/products"
            className="text-xs sm:text-sm md:text-base text-[#3A2D28] underline"
          >
            Continue shopping
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 sm:px-6 md:px-8 lg:px-16 xl:px-24 2xl:px-32 py-8 sm:py-12 md:py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-gray-900 px-4">
            Payment Successful!
          </h1>
          <div className="flex justify-center items-center mt-8 sm:mt-12 md:mt-[60px] px-4">
            <div className="w-full max-w-md sm:max-w-lg md:max-w-xl">
              <Image
                src="/assets/images/successPage/success.svg"
                alt="Success"
                width={500}
                height={400}
                className="w-full h-auto object-contain"
              />
            </div>
          </div>

          {/* Success Message */}
          <div className="mt-8 sm:mt-12 space-y-3 px-4">
            <p className="text-lg sm:text-2xl text-primary">
              We've received your payment.
            </p>
            <div className="pt-4 sm:pt-7 space-y-2 sm:space-y-3">
              <p className="text-sm sm:text-lg text-[#3A2D28]">
                Thank you for shopping with Cuffino!
              </p>
              <p className="text-sm sm:text-lg text-[#3A2D28]">
                We'll let you know when your items have been shipped.
              </p>
            </div>
          </div>

          <div className=" sm:text-base md:text-lg text-[#3A2D28] text-center mt-12 sm:mt-16 md:mt-20 -mb-6 sm:-mb-12 lg:mb-0 px-4">
            Need our assistance?{" "}
            <Link href="/contact" className="text-primary underline">
              Contact us
            </Link>
          </div>

          {/* Order Details */}
          {/* <div className="bg-white rounded-lg shadow-lg p-6 md:p-8 mt-[60px]">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              What's Next?
            </h2>
            <div className="space-y-4 text-left">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    Order Confirmation
                  </h3>
                  <p className="text-sm text-gray-600">
                    You'll receive an email confirmation with your order details
                    shortly.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    Production Timeline
                  </h3>
                  <p className="text-sm text-gray-600">
                    Your custom pieces will be crafted within 7-14 working days.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    Shipping Updates
                  </h3>
                  <p className="text-sm text-gray-600">
                    We'll keep you updated on the progress and shipping status.
                  </p>
                </div>
              </div>
            </div>
          </div> */}

          {/* Action Buttons */}

          {/* Additional Info */}
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default CheckoutSuccessPage;
