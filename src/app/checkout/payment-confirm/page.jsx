"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { IoChevronBack } from "react-icons/io5";
import DesktopNavbar from "@/components/navbars/desktopNavbar";
import Footer from "@/components/footer";
import MobileNavbar from "@/components/navbars/mobileNavabr";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import useAuth from "@/core/zustand/auth.store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { OrdersServices } from "@/services/orders";
import useUtility from "@/core/zustand/utility";
import Button from "@/components/button";

const PaymentConfirmPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { orderId, clientSecret, setClientSecret } = useUtility();
  const queryClient = useQueryClient();
  const [taxAmount, setTaxAmount] = useState(null);
  const [totalDiscount, setTotalDiscount] = useState(null);
  const [totalAmount, setTotalAmount] = useState(null);

  // Fetch order details
  const getOrder = useQuery({
    queryKey: ["getOrder", orderId],
    queryFn: async () => {
      if (!orderId) return null;
      const response = await OrdersServices.getOrder(orderId);
      return response?.data;
    },
    enabled: !!orderId,
  });

  // Update state when order data is available
  useEffect(() => {
    if (getOrder?.data) {
      setTaxAmount(getOrder?.data?.tax);
      setTotalDiscount(getOrder?.data?.discountTotal);
      setTotalAmount(getOrder?.data?.totalPrice);
    }
  }, [getOrder?.data]);

  // Initiate payment mutation
  const initiatePayment = useMutation({
    mutationFn: async () => {
      if (!orderId) return;
      const response = await OrdersServices.initiatePayment(orderId, {
        paymentMethod: "CARD",
        successUrl: `https://yourapp.com/payment/success?orderId=${orderId}`,
        cancelUrl: `https://yourapp.com/payment/cancel?orderId=${orderId}`,
        returnUrl: `https://yourapp.com/payment/return?orderId=${orderId}`,
      });
      return response?.data;
    },
    onSuccess: (data) => {
      setClientSecret(data?.clientSecret);
      queryClient.invalidateQueries({ queryKey: ["getOrder", orderId] });
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message || "Failed to initiate payment"
      );
    },
  });

  // Auto-initiate payment on page load to calculate tax
  useEffect(() => {
    if (orderId && !clientSecret) {
      initiatePayment.mutate();
    }
  }, [orderId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  };

  // Format order number
  const formatOrderNumber = (orderId) => {
    if (!orderId) return "0000";
    return String(orderId).padStart(4, "0");
  };

  const orderData = getOrder?.data;

  const grandTotal = orderData?.grandTotal ?? orderData?.finalizedTotal ?? null;
  const isCalculating = initiatePayment.isPending || (initiatePayment.isSuccess && getOrder.isFetching);

  return (
    <div className="">
      {/* Header with Navbar */}
      <div className="linearGradientBackground pb-12">
        <div className="xl:px-[100px]">
          <DesktopNavbar textColor={`!text-black`} />
        </div>
        <MobileNavbar utilityClassName="px-6 md:px-9 lg:px-[100px]" />
        <div className="flex justify-between items-center pt-10 px-5 md:px-8 lg:px-[100px]">
          <Link
            href="/checkout/order"
            className="text-[22px] lg:text-[33px] text-primary flex gap-x-1 items-center"
          >
            <IoChevronBack className="font-black" />
            <p>Checkout</p>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="min-h-screen bg-white py-12">
        {getOrder?.isPending ? (
          <div className="flex justify-center items-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : !orderData ? (
          <div className="flex justify-center items-center h-screen">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                No order found
              </h2>
              <Link
                href="/cart"
                className="text-primary hover:underline font-semibold"
              >
                Return to cart
              </Link>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto px-4 md:px-6 lg:px-8">
            {/* Title */}
            <h1 className="text-3xl font-semibold text-center mb-4">
              Pay for Order
            </h1>

            {/* Confirmation Message */}
            <p className="text-center text-[#3A2D28] mb-8">
              We'll let you know when your payment has been received.
            </p>

            {/* Order Summary Box */}
            <div className="bg-[#FFFAFA] rounded-lg p-9 mb-8 border border-[#F9E6D0]">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-[#3A2D28]">
                    ORDER NUMBER:
                  </span>
                  <span className="font-semibold text-[#3A2D28]">
                    {formatOrderNumber(orderData?.orderId)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-[#3A2D28]">DATE:</span>
                  <span className="font-semibold text-[#3A2D28]">
                    {formatDate(orderData?.orderDate)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-[#3A2D28]">SUBTOTAL:</span>
                  <span className="font-semibold text-[#3A2D28]">
                    ${(orderData?.totalPrice ?? 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-[#3A2D28]">TAX:</span>
                  <span className="font-semibold text-[#3A2D28]">
                    {isCalculating ? (
                      <div className="h-4 w-12 bg-gray-300 rounded animate-pulse inline-block" />
                    ) : (
                      `$${(taxAmount ?? 0).toFixed(2)}`
                    )}
                  </span>
                </div>
                {(totalDiscount ?? 0) > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-[#3A2D28]">DISCOUNT:</span>
                    <span className="font-semibold text-green-600">
                      -${totalDiscount.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center border-t border-[#F9E6D0] pt-4">
                  <span className="font-semibold text-[#3A2D28]">TOTAL:</span>
                  <span className="font-bold text-[#3A2D28] text-lg">
                    {isCalculating ? (
                      <div className="h-5 w-20 bg-gray-300 rounded animate-pulse inline-block" />
                    ) : (
                      `$${grandTotal?.toFixed(2) || "0.00"}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-[#3A2D28]">
                    PAYMENT METHOD:
                  </span>
                  <span className="font-semibold text-[#3A2D28]">
                    Credit Card
                  </span>
                </div>
              </div>
            </div>



            {/* Instructional Text */}
            <p className="text-center text-[#3A2D28] mb-8">
              Thank you for your order, please click the button below to proceed
              with payment.
            </p>

            {/* Pay Now Button */}
            <div className="flex justify-center mb-8">
              <Button
                type="button"
                onClick={() => router.push("/checkout/stripe")}
                disable={!clientSecret || isCalculating}
                className={`px-12 !py-5 rounded-md font-semibold text-lg transition-colors ${
                  !clientSecret || isCalculating
                    ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                    : "bg-primary text-white hover:bg-opacity-90"
                }`}
              >
                {isCalculating ? "Calculating total..." : "Pay Now"}
              </Button>
            </div>

            {/* Assistance Link */}
            <div className="text-center">
              <p className="text-[#3A2D28]">
                Need our assistance?{" "}
                <Link href="/contact" className="text-primary hover:underline">
                  Contact us
                </Link>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default PaymentConfirmPage;

