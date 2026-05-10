"use client";

import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { ClipLoader } from "react-spinners";
import { OrdersServices } from "@/services/orders";
import useUtility from "@/core/zustand/utility";
import useAuth from "@/core/zustand/auth.store";
import DesktopNavbar from "@/components/navbars/desktopNavbar";
import MobileNavbar from "@/components/navbars/mobileNavabr";
import Footer from "@/components/footer";
import axiosInstance from "@/core/api/api";
import { useQueryClient } from "@tanstack/react-query";

// Initialize Stripe
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  console.warn(
    "Stripe publishable key is not set. Please add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to your .env file"
  );
}

const stripePromise = stripePublishableKey
  ? loadStripe(stripePublishableKey)
  : null;

// Payment Form Component
const PaymentForm = ({ orderId, clientSecret, onPaymentSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const { setTotalCartItems } = useUtility();

  // Debug: Check if Stripe is loaded
  useEffect(() => {
    if (!stripe) {
      console.log(
        "Stripe not loaded yet - waiting for Stripe.js to initialize"
      );
    } else {
      console.log("Stripe loaded successfully");
    }
    if (!elements) {
      console.log("Elements not loaded yet - waiting for Elements provider");
    } else {
      console.log("Elements loaded successfully");
    }
  }, [stripe, elements]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      setError("Payment form is not ready. Please wait...");
      return;
    }

    setIsProcessing(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);

    try {
      const { error: confirmError, paymentIntent } =
        await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: user?.username || "",
            },
          },
        });

      if (confirmError) {
        setError(confirmError.message);
        setIsProcessing(false);
        toast.error(confirmError.message);
      } else if (paymentIntent.status === "succeeded") {
        // Payment succeeded on Stripe. Pass intent up so backend can be captured
        // even if webhook delivery is delayed or unavailable.
        onPaymentSuccess(paymentIntent);
      }
    } catch (err) {
      setError(err.message);
      setIsProcessing(false);
      toast.error(err.message || "Payment failed");
    }
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit} className="w-full max-w-md">
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Details
        </label>
        <div
          className="p-4 border border-gray-300 rounded-lg bg-white"
          id="card-element-wrapper"
          style={{
            pointerEvents: "auto",
            position: "relative",
            zIndex: 1,
          }}
        >
          {!stripe || !elements ? (
            <div className="text-center py-4">
              <ClipLoader color="#A86746" size={20} />
              <p className="text-sm text-gray-500 mt-2">
                Loading payment form...
              </p>
            </div>
          ) : (
            <div style={{ pointerEvents: "auto" }}>
              <CardElement
                options={{
                  // hidePostalCode: true,
                  style: {
                    base: {
                      fontSize: "16px",
                      color: "#424770",
                      fontFamily: "system-ui, sans-serif",
                      "::placeholder": {
                        color: "#aab7c4",
                      },
                    },
                    invalid: {
                      color: "#9e2146",
                    },
                  },
                }}
              />
            </div>
          )}
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      <button
        id="submit"
        type="submit"
        disabled={!stripe || isProcessing}
        className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors flex justify-center items-center gap-2 ${
          !stripe || isProcessing
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-primary hover:bg-opacity-90"
        }`}
      >
        {isProcessing && <ClipLoader color="#ffffff" size={20} />}
        {isProcessing ? "Processing..." : "Pay"}
      </button>
    </form>
  );
};

const StripePage = () => {
  const router = useRouter();
  const { orderId, clientSecret } = useUtility();
  const { user } = useAuth();
  const [isPolling, setIsPolling] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [paymentIntentData, setPaymentIntentData] = useState(null);
  const hasValidated = useRef(false);
  const hasStartedPolling = useRef(false);
  const { setTotalCartItems } = useUtility();
  const queryClient = useQueryClient();

  // Polling function to check order status
  const checkOrderStatus = useCallback(async (orderId) => {
    const maxAttempts = 30;
    const interval = 2000; // 2 seconds

    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await OrdersServices.getOrder(orderId);
        const order = response?.data;

        const orderStatus = (order?.status || "").toUpperCase();

        if (orderStatus === "PAID" || orderStatus === "PARTIALLY_PAID") {
          return order; // Payment successful
        }

        if (orderStatus === "PENDING") {
          await new Promise((resolve) => setTimeout(resolve, interval));
          continue; // Keep polling
        }

        if (orderStatus === "CANCELLED") {
          throw new Error("Payment failed or order cancelled");
        }

        await new Promise((resolve) => setTimeout(resolve, interval));
      } catch (error) {
        if (i === maxAttempts - 1) {
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, interval));
      }
    }

    throw new Error("Payment status check timeout");
  }, []);

  // Memoize the payment success callback
  const handlePaymentSuccess = useCallback((paymentIntent) => {
    setPaymentIntentData(paymentIntent || null);
    setPaymentCompleted(true);
  }, []);

  const toLocalDateTime = () => {
    return new Date().toISOString().slice(0, 19);
  };

  // Start polling after payment is completed
  useEffect(() => {
    if (!paymentCompleted || !orderId || hasStartedPolling.current) {
      return;
    }

    hasStartedPolling.current = true;
    setIsPolling(true);

    const captureAndVerify = async () => {
      if (paymentIntentData) {
        const rawAmount =
          paymentIntentData?.amount_received ?? paymentIntentData?.amount ?? 0;
        const amountPaid = Number((rawAmount / 100).toFixed(2));
        const transactionId =
          paymentIntentData?.latest_charge || paymentIntentData?.id || "stripe";

        try {
          await OrdersServices.capturePayment(orderId, {
            paymentMethod: "CARD",
            transactionId,
            amountPaid,
            paymentDate: toLocalDateTime(),
          });
        } catch (captureError) {
          // If webhook has already marked this order paid, capture can fail safely.
          console.warn("Capture fallback failed, continuing with status polling", captureError);
        }
      }

      return checkOrderStatus(orderId);
    };

    captureAndVerify()
      .then(async (order) => {
        // Clear cart and update state BEFORE redirecting
        await axiosInstance.delete(`/cart/${user?.userId}/clear`);
        setTotalCartItems(0);
        // Invalidate cart query to ensure navbar updates
        queryClient.invalidateQueries({ queryKey: ["getCart", user?.userId] });
        toast.success("Payment successful!");
        router.replace(`/checkout/success?orderId=${orderId}`);
      })
      .catch((error) => {
        const message = error?.message || "Payment verification delayed";
        if (/failed|cancelled/i.test(message)) {
          router.replace(`/checkout/cancel?orderId=${orderId}`);
          toast.error(message);
          return;
        }

        // Stripe already confirmed payment. Avoid false failure UI when webhook is delayed.
        toast.info("Payment received. Verification is taking longer than expected.");
        router.replace(`/checkout/success?orderId=${orderId}`);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentCompleted, orderId, checkOrderStatus, paymentIntentData]); // router is stable, doesn't need to be in deps

  // Check if orderId and clientSecret exist (only run once on mount)
  useEffect(() => {
    if (hasValidated.current) {
      return;
    }

    hasValidated.current = true;

    if (!orderId) {
      toast.error("No order found. Please start checkout again.");
      router.push("/cart");
      return;
    }

    if (!clientSecret) {
      toast.error("Payment session not initialized. Please try again.");
      router.push("/cart");
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount

  if (isPolling || paymentCompleted) {
    return (
      <div className="">
        {/* Header with Navbar */}
        <div className="linearGradientBackground pb-12">
          <div className="xl:px-[100px]">
            <DesktopNavbar textColor={`!text-black`} />
          </div>
          <MobileNavbar utilityClassName="px-6 md:px-9 lg:px-[100px]" />
        </div>

        {/* Polling Content */}
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12">
          <div className="text-center">
            <ClipLoader color="#A86746" size={40} />
            <p className="text-lg font-semibold text-gray-900 mt-4">
              Verifying payment...
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Please wait while we confirm your payment
            </p>
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    );
  }

  return (
    <div className="">
      {/* Header with Navbar */}
      <div className="linearGradientBackground pb-12">
        <div className="xl:px-[100px]">
          <DesktopNavbar textColor={`!text-black`} />
        </div>
        <MobileNavbar utilityClassName="px-6 md:px-9 lg:px-[100px]" />
        {/* <div className="flex justify-between items-center pt-10 px-5 md:px-8 lg:px-[100px]">
          <div>
            <h1 className="text-2xl md:text-3xl text-primary mb-2">
              Complete Payment
            </h1>
          </div>
        </div> */}
      </div>

      {/* Payment Form Content */}
      <div className="bg-gray-50 min-h-screen md:px-9 lg:px-[100px] 2xl:px-[100px] py-12">
        <div className="flex items-center justify-center">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Complete Your Payment
              </h2>
              {!stripePublishableKey ? (
                <div className="text-center py-8">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <p className="text-red-800 font-semibold mb-2">
                      Stripe Error
                    </p>
                    {/* <p className="text-red-600 text-sm">
                      Stripe publishable key is not set. Please add{" "}
                      <code className="bg-red-100 px-2 py-1 rounded">
                        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
                      </code>{" "}
                      to your .env.local file and restart the server.
                    </p> */}
                  </div>
                </div>
              ) : clientSecret && orderId && stripePromise ? (
                <Elements
                  stripe={stripePromise}
                  options={{
                    disableLink: true,
                  }}
                >
                  <PaymentForm
                    orderId={orderId}
                    clientSecret={clientSecret}
                    onPaymentSuccess={handlePaymentSuccess}
                  />
                </Elements>
              ) : (
                <div className="text-center py-8">
                  <ClipLoader color="#A86746" size={40} />
                  <p className="mt-4 text-gray-600">Loading payment form...</p>
                  {!clientSecret && (
                    <p className="mt-2 text-sm text-red-600">
                      Waiting for payment session...
                    </p>
                  )}
                  {!orderId && (
                    <p className="mt-2 text-sm text-red-600">
                      Waiting for order ID...
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default StripePage;
