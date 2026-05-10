"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FiXCircle, FiHome, FiShoppingBag } from "react-icons/fi";
import Footer from "@/components/footer";
import MobileNavbar from "@/components/navbars/mobileNavabr";
import DesktopNavbar from "@/components/navbars/desktopNavbar";
import { FaExclamation } from "react-icons/fa6";

const CheckoutCancelPage = () => {
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
      <div className=" linearGradientBackground  pb-12">
        <div className="xl:px-[100px]">
          <DesktopNavbar textColor={`!text-black`} />
        </div>
        <MobileNavbar utilityClassName="px-6 md:px-9 lg:px-0 lg:px-[100px]" />
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 md:px-8 lg:px-16 xl:px-24 2xl:px-32 py-16">
        <div className="max-w-2xl mx-auto text-center">
          {/* Failed Icon - Big X with Red Background */}
          <div className="mb-8 flex justify-center">
            <div className="w-32 h-32 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
              <FaExclamation className="w-20 h-20 text-white" />
            </div>
          </div>

          {/* Failure Message */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Payment Unsuccessful
            </h1>
            <p className="text-lg text-gray-600 mb-4">
              Unfortunately, your payment could not be processed. Please try
              again
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/cart"
              className="flex items-center justify-center space-x-2 bg-primary text-white px-6 py-3 rounded-lg font-semibold  transition-colors"
            >
              <FiShoppingBag className="w-5 h-5" />
              <span>Return to Cart</span>
            </Link>
            {/* <Link
              href="/"
              className="flex items-center justify-center space-x-2 bg-white text-primary border-2 border-primary px-6 py-3 rounded-lg font-semibold hover:bg-primary hover:text-white transition-colors"
            >
              <FiHome className="w-5 h-5" />
              <span>Continue Shopping</span>
            </Link> */}
          </div>

          {/* Additional Info */}
          <div className="mt-20 p-4 bg-red-50 rounded-lg">
            <p className="text-sm text-red-800">
              <strong>Need help?</strong> Contact our customer support at{" "}
              <a href="mailto:support@cuffino.com" className="underline">
                support@cuffino.com
              </a>{" "}
              or call us at +1 (555) 123-4567
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default CheckoutCancelPage;
