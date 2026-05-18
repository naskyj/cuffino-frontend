"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { FiTrash2, FiMinus, FiPlus } from "react-icons/fi";
import { Playfair_Display } from "next/font/google";
import DesktopNavbar from "@/components/navbars/desktopNavbar";
import Footer from "@/components/footer";
import useUtility from "@/core/zustand/utility";
import { IoChevronBack } from "react-icons/io5";
import MobileNavbar from "@/components/navbars/mobileNavabr";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import useAuth from "@/core/zustand/auth.store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CartServices } from "@/services/cart";
import { OrdersServices } from "@/services/orders";
import { UserServices } from "@/services/user";
import Button from "@/components/button";
import AddressFormModal from "@/components/modals/AddressFormModal";

const playFair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair_display",
});

const OrderCheckoutPage = () => {
  // Note: Using API-based cart management instead of local cart store
  const router = useRouter();
  const [totalAmount, setTotalAmount] = useState(null);
  const [taxAmount, setTaxAmount] = useState(null);
  const [shippingCost, setShippingCost] = useState(null);
  const [totalDiscount, setTotalDiscount] = useState(null);
  const [createOrderLoader, setCreateOrderLoader] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const { user, setUser } = useAuth();
  const queryClient = useQueryClient();
  const { clientSecret, setClientSecret, orderId, setOrderId } = useUtility();
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);

  // Refetch cart when page becomes visible
  useEffect(() => {
    if (user?.userId) {
      queryClient.invalidateQueries({ queryKey: ["getCart", user?.userId] });
    }
  }, [user?.userId, queryClient]);

  // Removed demo items - cart should only show actual user items

  // Fetch user's delivery addresses
  const { data: addresses, isLoading: isLoadingAddresses } = useQuery({
    queryKey: ["addresses", user?.userId],
    queryFn: async () => {
      const res = await UserServices.getUsersAddresses(user?.userId);
      return res?.data || [];
    },
    enabled: !!user?.userId,
    onSuccess: (data) => {
      // Set default address as selected initially
      if (data && data.length > 0 && !selectedAddressId) {
        const defaultAddress = data.find(addr => addr.isDefault);
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.addressId);
        } else {
          setSelectedAddressId(data[0].addressId);
        }
      }
    },
  });

  const handleQuantityChange = (cartItemId, newQuantity) => {
    if (newQuantity < 1) {
      toast.error("Quantity must be at least 1");
      return;
    }
    updateCartItem.mutate({ cartItemId, quantity: newQuantity });
  };

  const getOrder = useQuery({
    queryKey: ["getOrders", orderId],
    queryFn: async () => {
      // if (!getCart?.data?.cartId) return;
      const response = await OrdersServices.getOrder(orderId);
      return response?.data;
    },
    enabled: !!orderId,
  });

  // Order shipment address update mutation
  const updateOrderShipmentMutation = useMutation({
    mutationFn: async (addressId) => {
      const response = await OrdersServices.updateOrderShipmentAddress(orderId, {
        addressId: addressId,
      });
      return response?.data;
    },
    onSuccess: (data) => {
      toast.success("Delivery address updated successfully");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to update delivery address");
    },
  });

  const handleAddressSelect = (addressId) => {
    setSelectedAddressId(addressId);
  };

  const handlePayNowClick = async () => {
    if (!selectedAddressId) {
      toast.error("Please select a delivery address");
      return;
    }

    try {
      await updateOrderShipmentMutation.mutateAsync(selectedAddressId);
      // Navigate to payment confirmation page
      router.push("/checkout/payment-confirm");
    } catch (error) {
      console.error("Error updating order shipment address:", error);
    }
  };

  //   useEffect(() => {
  //     createOrder();
  //   }, [getCart?.data?.cartId]);

  // Update state when order data is available
  useEffect(() => {
    if (getOrder?.data) {
      setTaxAmount(getOrder?.data?.tax);
      setShippingCost(getOrder?.data?.shippingFee);
      setTotalDiscount(getOrder?.data?.discountTotal);
      setTotalAmount(getOrder?.data?.totalPrice);
    }
  }, [getOrder?.data]);

  const orderItems = getOrder?.data?.items || [];

  const computeGrandTotal = (order) => {
    if (!order) return null;
    if (order.finalizedTotal !== null && order.finalizedTotal !== undefined) {
      return Number(order.finalizedTotal);
    }
    return (
      Number(order.totalPrice || 0) +
      Number(order.tax || 0) +
      Number(order.shippingFee || 0) -
      Number(order.discountTotal || 0)
    );
  };

  const grandTotal = computeGrandTotal(getOrder?.data);

  return (
    <div className="">
      {/* Header with Navbar */}
      <div className=" linearGradientBackground  pb-12">
        <div className="xl:px-[100px]">
          <DesktopNavbar textColor={`!text-black`} />
        </div>
        <MobileNavbar utilityClassName="px-6 md:px-9 lg:px-[100px]" />
        <div className="flex sm:flex-row justify-between items-center gap-3 sm:gap-0 pt-6 sm:pt-10 px-5 md:px-8 lg:px-[100px]">
          <Link
            href="/cart"
            className="text-lg sm:text-[22px] lg:text-[33px] text-primary flex gap-x-1 items-center"
          >
            <IoChevronBack className="font-black" />
            <p>Cart</p>
          </Link>
          <Link
            href="/products"
            className="text-sm sm:text-base text-primary hover:underline"
          >
            Continue shopping
          </Link>
        </div>
      </div>
      <div className="">
        <h2 className="text-2xl sm:text-3xl font-semibold pt-6 sm:pt-10 pb-4 sm:pb-5 text-center px-4">
          Your Order
        </h2>

        {/* Cart Content */}
        {getOrder?.isPending ? (
          <div className="flex justify-center items-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : getOrder?.data?.items.length === 0 ? (
          <div className="bg-gray-50 py-12 sm:py-[90px] flex items-center justify-center px-4">
            <div className="text-center max-w-md">
              <div className="mb-6">
                <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                  <svg
                    className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                </div>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                No order found
              </h2>
              <p className="text-gray-600 mb-6 text-sm sm:text-base">
                Add some beautiful African prints to get started!
              </p>
              <div className="pt-4">
                <Link
                  href="/products"
                  className="inline-block bg-primary text-white px-6 py-3 rounded-md font-semibold hover:bg-opacity-90 transition-colors text-sm sm:text-base"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white min-h-screen px-4 sm:px-6 md:px-9 lg:px-[100px] 2xl:px-[100px] py-6 sm:py-12">
            {/* Cart Header */}
            {/* <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Cart</h1>
            <Link href="/products" className="text-primary hover:underline">
              ← Product
            </Link>
          </div>
          <Link 
            href="/products" 
            className="text-primary hover:underline font-medium"
          >
            Continue shopping
          </Link>
        </div> */}

            {/* Production Timeline Notice */}
            <div className="border border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 p-4 sm:p-5 mb-6 sm:mb-8 rounded-lg">
              <p className="text-amber-800 text-xs sm:text-sm font-semibold mb-1 uppercase tracking-wide">
                Handcrafted with care — Your timeline
              </p>
              <p className="text-amber-700 text-xs sm:text-sm leading-relaxed">
                Every piece is made to order. Standard garments are lovingly crafted and delivered within{" "}
                <span className="font-semibold">45 days</span>. Orders with custom measurements or
                personalised customisations — where the magic truly happens — are ready within{" "}
                <span className="font-semibold">70 days</span>. Please ensure your sizes and measurements
                are accurate before placing your order.
              </p>
            </div>

            {/* Cart Items */}

            <div className="bg-white rounded-lg shadow-sm border mb-6 sm:mb-8">
              {/* Table Header */}
              <div className="gap-4 p-4 sm:p-6 border-b bg-gray-50 font-semibold text-gray-700">
                <div className="col-span-3 md:col-span-6 text-primary text-sm sm:text-base">
                  PRODUCT
                </div>
              </div>

              {/* Cart Items */}
              {orderItems?.map((item) => (
                <div
                  key={item?.orderItemId}
                  className="gap-4 py-4 sm:py-6 px-3 sm:px-6 border-b items-center text-sm sm:text-base"
                >
                  {/* Product Info */}
                  <div className="flex items-center space-x-2 sm:space-x-4">
                    <div className="relative w-20 h-20 sm:h-24 sm:w-24 rounded-md overflow-hidden flex-shrink-0">
                      <Image
                        src={item?.productImages[0]?.imageUrl || ""}
                        alt={item?.productImages[0]?.altText || "Product image"}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-primary text-sm sm:text-base break-words">
                        {`${item?.productName} x${item?.quantity}`}
                      </h3>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="bg-white shadow-sm p-1 bg-[#F8F8F8] !rounded-[10px] mb-8 sm:mb-20">
              <div className="flex justify-between items-center py-3 sm:py-4 px-4 sm:px-6 bg-[#F8F8F8] border-b border-[#F9E6D0]">
                <span className="text-base sm:text-lg font-semibold text-primary">
                  Taxes:{" "}
                </span>
                <span className="text-sm sm:text-base text-primary">
                  {taxAmount === null ? (
                    <div className="h-4 w-12 bg-gray-300 rounded animate-pulse"></div>
                  ) : (
                    `$${taxAmount.toFixed(2)}`
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 sm:py-4 px-4 sm:px-6 bg-[#F8F8F8] border-b border-[#F9E6D0]">
                <span className="text-base sm:text-lg font-semibold text-primary">
                  Total Discount:{" "}
                </span>
                <span className="text-sm sm:text-base text-primary">
                  {totalDiscount === null ? (
                    <div className="h-4 w-12 bg-gray-300 rounded animate-pulse"></div>
                  ) : (
                    `$${totalDiscount.toFixed(2)}`
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 sm:py-4 px-4 sm:px-6 bg-[#F8F8F8]">
                <span className="text-base sm:text-lg font-semibold text-primary">
                  Grand Total:
                </span>
                <span className="text-sm sm:text-base text-primary">
                  {grandTotal === null || grandTotal === undefined ? (
                    <div className="h-4 w-12 bg-gray-300 rounded animate-pulse"></div>
                  ) : (
                    `$${grandTotal.toFixed(2)}`
                  )}
                </span>
              </div>
            </div>

            {/* Delivery Address Selection */}
            <div className="bg-white shadow-sm p-4 sm:p-6 mb-6 sm:mb-8 rounded-lg">
              <h3 className="text-lg font-semibold text-primary mb-4">Delivery Address</h3>

              {isLoadingAddresses ? (
                <div className="flex justify-center items-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : addresses && addresses.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-gray-700 text-sm mb-3">Select your delivery address:</p>
                  {addresses.map((address) => (
                    <div
                      key={address.addressId}
                      className={`border rounded-lg p-3 cursor-pointer transition-all ${
                        selectedAddressId === address.addressId
                          ? "border-primary bg-primary/5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => handleAddressSelect(address.addressId)}
                    >
                      <div className="flex items-start">
                        <input
                          type="radio"
                          name="deliveryAddress"
                          checked={selectedAddressId === address.addressId}
                          onChange={() => handleAddressSelect(address.addressId)}
                          className="mt-1 mr-3 text-primary focus:ring-primary"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 text-sm">
                            {address.streetAddress}
                          </div>
                          {address.addressLine2 && (
                            <div className="text-xs text-gray-600">
                              {address.addressLine2}
                            </div>
                          )}
                          <div className="text-xs text-gray-500">
                            {address.city}, {address.state} {address.postalCode}
                            {address.country && `, ${address.country}`}
                          </div>
                          {address.label && (
                            <div className="text-xs text-gray-500 mt-1 italic">
                              {address.label}
                            </div>
                          )}
                          {address.isDefault && (
                            <span className="inline-block mt-1 py-0.5 px-2 text-xs font-semibold bg-primary text-white rounded">
                              Default
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="mb-3">
                    <svg
                      className="mx-auto h-8 w-8 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm mb-3">
                    No delivery addresses found. Add one to continue.
                  </p>
                </div>
              )}

              <div className="mt-4">
                <Button
                  type="button"
                  className="w-full sm:w-auto bg-gray-200 text-gray-700 rounded"
                  onClick={() => setShowAddAddressModal(true)}
                >
                  Add New Address
                </Button>
              </div>
            </div>

            {/* Checkout Button */}

            {/* terms and conditions */}
            <div className="bg-[#F8F8F8] rounded-lg mb-8 sm:mb-20">
              <div className="p-4 sm:p-6 text-primary flex justify-between items-center text-base sm:text-lg font-semibold border-b border-[#F9E6D0] pb-3 sm:pb-4">
                <p>Payment via</p>
                <p className="sm:pr-[90px]">Credit Card</p>
              </div>
              <div className="p-4 sm:p-6">
                <p className="text-[#3A2D28] text-sm sm:text-base">
                  Estimated time to shipping and delivery - 3 months from time
                  of receiving order
                </p>
              </div>
              <div className="flex items-start sm:items-center p-4 sm:p-6">
                <div className="flex items-start sm:items-center">
                  <input
                    type="checkbox"
                    id="terms"
                    className="mr-2 mt-1 sm:mt-0 flex-shrink-0"
                  />
                  <label
                    htmlFor="terms"
                    className="text-[#3A2D28] text-xs sm:text-sm sm:text-base leading-relaxed"
                  >
                    I have read and agree to the website{" "}
                    <span className="text-primary font-light underline">
                      terms and conditions
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-center items-center px-4">
              <div className="">
              <Button
                type="button"
                onClick={handlePayNowClick}
                disable={!orderId || !selectedAddressId || createOrderLoader || updateOrderShipmentMutation.isLoading}
                className="bg-[#A86746] text-white rounded-lg !text-base min-w-[290px] lg:!min-w-[600px]"
              >
                {updateOrderShipmentMutation.isLoading ? "Updating Address..." : "Pay Now"}
              </Button>
              </div>
            
            </div>
          </div>
        )}
      </div>
      {/* Footer */}
      <Footer />

      {/* Add Address Modal */}
      <AddressFormModal
        isVisible={showAddAddressModal}
        onClose={() => setShowAddAddressModal(false)}
        onSubmit={async (values, actions) => {
          try {
            await UserServices.addAddress(user.userId, {
              streetAddress: values.streetAddress,
              addressLine2: values.addressLine2 || "",
              city: values.city,
              state: values.state,
              postalCode: values.postalCode,
              country: values.country,
              label: values.label || "",
              isDefault: values.isDefault,
            });
            // Refetch addresses
            queryClient.invalidateQueries({ queryKey: ["addresses", user.userId] });
            setShowAddAddressModal(false);
            actions.setSubmitting(false);
          } catch (err) {
            actions.setSubmitting(false);
            throw err;
          }
        }}
        submitLabel="Add Address"
      />
    </div>
  );
};

export default OrderCheckoutPage;
