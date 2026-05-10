"use client";

import React, { useState, useEffect } from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useRouter } from "next/navigation";
import DesktopNavbar from "@/components/navbars/desktopNavbar";
import Footer from "@/components/footer";
import Input from "@/components/input/input";
import SelectField from "@/components/input/select";
import { Playfair_Display } from "next/font/google";
import { IoArrowBack, IoChevronBack } from "react-icons/io5";
import { FiLoader } from "react-icons/fi";
import useCart from "@/core/zustand/cart.store";
import useCheckout from "@/core/zustand/checkout.store";
import Link from "next/link";
import MobileNavbar from "@/components/navbars/mobileNavabr";

const playFair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair_display",
});

const validationSchema = Yup.object({
  firstName: Yup.string().required("First name is required"),
  lastName: Yup.string().required("Last name is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  address: Yup.string().required("Address is required"),
  zipCode: Yup.string().required("Zip code is required"),
  cardHolderName: Yup.string().required("Card holder name is required"),
  cardNumber: Yup.string().required("Card number is required"),
  expiration: Yup.string().required("Expiration date is required"),
  cvv: Yup.string().required("CVV is required"),
});

const countries = [
  { key: "USA", value: "USA" },
  { key: "Canada", value: "Canada" },
  { key: "UK", value: "UK" },
  { key: "Australia", value: "Australia" },
];

const states = [
  { key: "California", value: "California" },
  { key: "New York", value: "New York" },
  { key: "Texas", value: "Texas" },
  { key: "Florida", value: "Florida" },
];

const CheckoutPage = () => {
  const router = useRouter();
  const { items: cartItems, total: cartTotal } = useCart();
  const { initializeCheckout, processOrder, clearCheckout } = useCheckout();

  const [paymentMethod, setPaymentMethod] = useState("credit");
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [saveInfo, setSaveInfo] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize checkout with cart items
  useEffect(() => {
    if (cartItems.length > 0) {
      initializeCheckout(cartItems, cartTotal);
    }
  }, [cartItems, cartTotal, initializeCheckout]);

  // Redirect if cart is empty
  useEffect(() => {
    if (cartItems.length === 0) {
      router.push("/cart");
    }
  }, [cartItems.length, router]);

  const initialValues = {
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    address: "",
    address2: "",
    country: "USA",
    state: "California",
    zipCode: "",
    cardHolderName: "",
    cardNumber: "",
    expiration: "",
    cvv: "",
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    setIsProcessing(true);
    try {
      const result = await processOrder();
      if (result.success) {
        // Clear cart and checkout data
        useCart.getState().clearCart();
        clearCheckout();
        // Redirect to success page
        router.push(`/checkout/success?orderId=${result.orderId}`);
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("An error occurred during checkout. Please try again.");
    } finally {
      setIsProcessing(false);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}

      <div className=" linearGradientBackground  pb-12">
        <div className="xl:px-[100px]">
          <DesktopNavbar textColor={`!text-black`} />
        </div>
        <MobileNavbar utilityClassName="px-6 md:px-9 lg:px-[100px]" />
        <Link
          href="/cart"
          className="px-5 md:px-8 lg:px-[100px] text-[22px] lg:text-[33px] text-primary flex gap-x-1 items-center pt-[40px] lg:pt-[70px]"
        >
          <IoChevronBack className="font-black" />
          <p>Cart</p>
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 md:px-9 lg:px-[100px] 2xl:px-32 py-4 md:py-8">
        {/* Checkout Form */}
        <div className=" mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 md:p-8 lg:p-12">
            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
            >
              {({ isSubmitting }) => (
                <Form className="space-y-8">
                  {/* Billing Address Section */}
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">
                      Billing address
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4 md:gap-y-6 md:gap-x-12">
                      <Input
                        label="First Name : *"
                        name="firstName"
                        placeholder="First name"
                        required
                        className="w-full"
                      />

                      <Input
                        label="Last Name : *"
                        name="lastName"
                        placeholder="Last Name"
                        required
                        className="w-full"
                      />

                      <Input
                        label="Username :"
                        name="username"
                        placeholder="Username"
                        className="w-full"
                      />

                      <Input
                        label="Your Email : *"
                        name="email"
                        type="email"
                        placeholder="Email"
                        required
                        className="w-full"
                      />

                      <Input
                        label="Address : *"
                        name="address"
                        placeholder="Address"
                        required
                        className="w-full"
                      />

                      <Input
                        label="Address 2 :"
                        name="address2"
                        placeholder="Address"
                        className="w-full"
                      />
                    </div>

                    {/* Checkboxes */}
                    <div className="mt-6 space-y-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="sameAsBilling"
                          checked={sameAsBilling}
                          onChange={(e) => setSameAsBilling(e.target.checked)}
                          className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                        <label
                          htmlFor="sameAsBilling"
                          className="ml-2 text-sm text-gray-700"
                        >
                          Shipping address is the same as my billing address
                        </label>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="saveInfo"
                          checked={saveInfo}
                          onChange={(e) => setSaveInfo(e.target.checked)}
                          className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                        <label
                          htmlFor="saveInfo"
                          className="ml-2 text-sm text-gray-700"
                        >
                          Save this information for next time
                        </label>
                      </div>
                    </div>

                    {/* Location Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-4 md:gap-y-6 md:gap-x-12 mt-6">
                      <SelectField
                        label="Country :"
                        name="country"
                        options={countries}
                      />

                      <SelectField
                        label="State :"
                        name="state"
                        options={states}
                      />

                      <Input
                        label="Zip Code : *"
                        name="zipCode"
                        placeholder="Zip"
                        type="number"
                        required
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Payment Section */}
                  <div className="border-t pt-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">
                      Payment
                    </h2>

                    {/* Payment Method Selection */}
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="credit"
                          name="paymentMethod"
                          value="credit"
                          checked={paymentMethod === "credit"}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                        />
                        <label
                          htmlFor="credit"
                          className="ml-2 text-sm text-gray-700"
                        >
                          Credit card
                        </label>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="debit"
                          name="paymentMethod"
                          value="debit"
                          checked={paymentMethod === "debit"}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                        />
                        <label
                          htmlFor="debit"
                          className="ml-2 text-sm text-gray-700"
                        >
                          Debit card
                        </label>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="paypal"
                          name="paymentMethod"
                          value="paypal"
                          checked={paymentMethod === "paypal"}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                        />
                        <label
                          htmlFor="paypal"
                          className="ml-2 text-sm text-gray-700"
                        >
                          PayPal
                        </label>
                      </div>
                    </div>

                    {/* Card Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4 md:gap-y-6 md:gap-x-12">
                      <Input
                        label="Account Holder Name : *"
                        name="cardHolderName"
                        placeholder="Name"
                        required
                        className="w-full"
                      />

                      <Input
                        label="Credit card number : *"
                        name="cardNumber"
                        placeholder="**** **** **** ****"
                        type="number"
                        required
                        className="w-full"
                      />

                      <Input
                        label="Expiration : *"
                        name="expiration"
                        placeholder="MM/YY"
                        required
                        className="w-full"
                      />

                      <Input
                        label="CVV : *"
                        name="cvv"
                        placeholder="123"
                        type="number"
                        required
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="border-t pt-8">
                    <button
                      type="submit"
                      disabled={isSubmitting || isProcessing}
                      className="w-full bg-primary text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      {isProcessing && (
                        <FiLoader className="w-5 h-5 animate-spin" />
                      )}
                      <span>
                        {isProcessing
                          ? "Processing Order..."
                          : "Continue to Checkout"}
                      </span>
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default CheckoutPage;
