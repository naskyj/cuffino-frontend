"use client";

import React, { useEffect, useMemo } from "react";
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
import ViewCustomizationsModal from "@/components/modals/ViewCustomizationsModal";
import useUtilityII from "@/core/zustand/utilityII";

const playFair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair_display",
});

const CartPage = () => {
  // Note: Using API-based cart management instead of local cart store
  const router = useRouter();
  const [totalAmount, setTotalAmount] = useState(null);
  const [taxAmount, setTaxAmount] = useState(null);
  const [shippingCost, setShippingCost] = useState(null);
  const [totalDiscount, setTotalDiscount] = useState(null);
  const [createOrderLoader, setCreateOrderLoader] = useState(false);
  const [customizationImages, setCustomizationImages] = useState([]);
  // Set when the server rejects the order because a price changed (409 PRICE_CHANGED)
  const [priceChangeNotice, setPriceChangeNotice] = useState(null);
  const [
    isViewCustomizationsModalVisible,
    setIsViewCustomizationsModalVisible,
  ] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { clientSecret, setClientSecret, orderId, setOrderId } = useUtility();
  const { customizationImagesCustom, setCustomizationImagesCustom } =
    useUtilityII();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (user === null) {
      router.push("/login?from=/cart");
    }
  }, [user, router]);

  // Refetch cart when page becomes visible
  useEffect(() => {
    if (user?.userId) {
      queryClient.invalidateQueries({ queryKey: ["getCart", user?.userId] });
    }
  }, [user?.userId, queryClient]);

  // Removed demo items - cart should only show actual user items

  const updateCartItem = useMutation({
    mutationFn: async ({ cartItemId, quantity, customizations }) => {
      const payload = {};
      if (quantity !== undefined) {
        payload.quantity = quantity;
      }
      if (customizations !== undefined) {
        payload.customizations = customizations;
      }

      const response = await CartServices.updateCart(
        user?.userId,
        cartItemId,
        payload
      );
      return response?.data;
    },
    onSuccess: (data, variables) => {
      toast.success(variables?.successMessage || "Cart updated");
      // Refetch cart data after successful update
      queryClient.invalidateQueries({ queryKey: ["getCart", user?.userId] });
    },
    onError: (error, variables) => {
      toast.error(variables?.errorMessage || "Failed to update cart");
    },
  });

  const handleQuantityChange = (cartItemId, newQuantity) => {
    if (newQuantity < 1) {
      toast.error("Quantity must be at least 1");
      return;
    }
    if (newQuantity > 10) {
      toast.error("You can order up to 10 of one item. For larger orders, please contact us.");
      return;
    }
    updateCartItem.mutate({
      cartItemId,
      quantity: newQuantity,
      successMessage: "Quantity updated",
      errorMessage: "Failed to update quantity",
    });
  };

  const getCart = useQuery({
    queryKey: ["getCart", user?.userId],
    queryFn: async () => {
      const response = await CartServices.getCart(user?.userId);
      return response?.data;
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    enabled: !!user?.userId,
  });

  const getAddresses = useQuery({
    queryKey: ["addresses", user?.userId],
    queryFn: async () => {
      const response = await UserServices.getUsersAddresses(user?.userId);
      return response?.data || [];
    },
    enabled: !!user?.userId,
  });

  const cartItems = getCart?.data?.items || [];

  const userAddresses = getAddresses?.data || [];
  const hasAtLeastOneAddress = userAddresses.length > 0;
  const hasDefaultAddress = userAddresses.some((address) => address?.isDefault);

  const isFabricCustomization = (customization) => {
    const descriptor = `${
      customization?.customizationName || customization?.customizationType || ""
    }`.toLowerCase();
    return descriptor.includes("fabric");
  };

  const formatMoney = (value) =>
    value !== undefined && value !== null && Number.isFinite(Number(value))
      ? Number(value).toFixed(2)
      : value;

  const sumCartItems = (items) =>
    (items || []).reduce((sum, item) => {
      const unitPrice = Number(item?.unitPrice || 0);
      const quantity = Number(item?.quantity || 0);
      const itemTotal =
        item?.itemTotal !== undefined && item?.itemTotal !== null
          ? Number(item.itemTotal)
          : unitPrice * quantity;
      return sum + (Number.isFinite(itemTotal) ? itemTotal : 0);
    }, 0);

  const cartSubTotal = useMemo(() => sumCartItems(cartItems), [cartItems]);
  const hasPriceChanges = cartItems.some((item) => item?.priceChanged);

  const deleteCartItem = useMutation({
    mutationFn: async (cartItemId) => {
      const response = await CartServices.deleteCartItem(
        user?.userId,
        cartItemId
      );
      return response?.data;
    },
    onSuccess: (data) => {
      toast.success("Item deleted from cart");
      // Refetch cart data after successful deletion
      queryClient.invalidateQueries({ queryKey: ["getCart", user?.userId] });
    },
    onError: (error) => {
      toast.error("Failed to delete item from cart");
    },
  });

  const createOrder = async () => {
    if (!user?.userId) {
      toast.error("Please Sign in");
      return null;
    }
    try {
      setCreateOrderLoader(true); //starts loader, disables the checkout button until the order is created
      if (getCart?.data?.items.length === 0) return null;
      const response = await OrdersServices.convertToOrder(user?.userId); //convert order
      // convert-to-order items (pieceOption, fabricInventoryId, clothDesign, priceToken,
      // expectedUnitPrice) are passed through to /order/add unchanged
      const responseII = await OrdersServices.createOrder(response?.data); //create Order
      const createdOrderId = responseII?.data?.orderId;

      setTotalAmount(responseII?.data?.totalAmount);
      setCreateOrderLoader(false); //stops loader, enables the checkout button
      setOrderId(createdOrderId); //order id is stored in zustand, what i use for other pages
      return createdOrderId;
    } catch (error) {
      if (
        error?.response?.status === 409 &&
        error?.response?.data?.code === "PRICE_CHANGED"
      ) {
        // A price moved since it was shown: refetch the cart and make the customer confirm
        const fresh = await getCart.refetch();
        setPriceChangeNotice({ newTotal: sumCartItems(fresh?.data?.items) });
        return "PRICE_CHANGED";
      }
      // Order creation can fail before checkout (e.g. missing default address).
      // Keep cart totals usable by falling back to computed cart subtotal.
      setTotalAmount(cartSubTotal);
      if (taxAmount === null) setTaxAmount(0);
      if (totalDiscount === null) setTotalDiscount(0);
      toast.error("Failed to create order");
      return null;
    } finally {
      setCreateOrderLoader(false);
    }
  };

  // const initiatePayment = useMutation({
  //   mutationFn: async () => {
  //     if (!orderId) return;
  //     try {
  //       const response = await OrdersServices.initiatePayment(orderId, {
  //         paymentMethod: "CARD",
  //         successUrl: `https://yourapp.com/payment/success?orderId=${orderId}`,
  //         cancelUrl: `https://yourapp.com/payment/cancel?orderId=${orderId}`,
  //         returnUrl: `https://yourapp.com/payment/return?orderId=${orderId}`,
  //       });
  //       return response?.data;
  //     } catch (error) {
  //       // toast.error("Failed to initiate order");
  //     }
  //   },
  //   onSuccess: (data) => {
  //     toast.success("Order initiated successfully");
  //     setClientSecret(data?.clientSecret);
  //     router.push("/checkout/stripe");
  //   },
  //   onError: (error) => {
  //     toast.error("Failed to initiate order");
  //   },
  // });

  useEffect(() => {
    if (getCart?.isSuccess) {
      setTotalAmount(cartSubTotal);
      if (taxAmount === null) setTaxAmount(0);
      if (totalDiscount === null) setTotalDiscount(0);
      if (shippingCost === null) setShippingCost(0);
    }
  }, [getCart?.isSuccess, cartSubTotal, taxAmount, totalDiscount, shippingCost]);

  // const cartItems = getCart?.
  // const handleCheckout = async () => {
  //   if (!user) {
  //     toast.error("Please login to checkout");
  //     router.push("/login");
  //     return;
  //   }
  //   if (items.length === 0) {
  //     toast.error("Your cart is empty");
  //     return;
  //   }

  //   setIsProcessing(true);
  //   try {
  //     // Initialize checkout with cart items
  //     initializeCheckout(items, total);

  //     // Process the order directly
  //     const result = await processOrder();

  //     if (result.success) {
  //       // Only clear cart and checkout data on successful order
  //       clearCart();
  //       clearCheckout();
  //       toast.success("Order placed successfully!");

  //       // Redirect to success page
  //       router.push(`/checkout/success?orderId=${result.orderId}`);
  //     } else {
  //       // Don't clear cart on failure - keep items for retry
  //       toast.error(
  //         result.message || "Failed to process order. Please try again."
  //       );
  //       console.error("Order processing failed:", result);
  //     }
  //   } catch (error) {
  //     console.error("Checkout error:", error);
  //     // Don't clear cart on error - keep items for retry
  //     toast.error("An error occurred during checkout. Please try again.");
  //   } finally {
  //     setIsProcessing(false);
  //   }
  // };

  // const formatPrice = (price) => {
  //   return parseFloat(price.replace("$", "")).toFixed(2);
  // };

  // "Continue at new price": re-run convert-to-order (now carrying the fresh locks) and place the order
  const handleContinueAtNewPrice = async () => {
    const nextOrderId = await createOrder();
    if (nextOrderId === "PRICE_CHANGED") return; // modal stays open with the newer total
    setPriceChangeNotice(null);
    if (!nextOrderId) {
      toast.error("Unable to prepare order. Please try again.");
      return;
    }
    router.push("/checkout/order");
  };

  const calculateItemTotal = (price, quantity) => {
    return (parseFloat(price.replace("$", "")) * quantity).toFixed(2);
  };

  const handleCheckoutClick = async () => {
    if (!hasAtLeastOneAddress) {
      toast.error("Please add a delivery address before checkout");
      router.push("/user-delivery-address?source=cart&action=add");
      return;
    }

    if (!hasDefaultAddress) {
      toast.error("Please set a default delivery address before checkout");
      router.push("/user-delivery-address?source=cart&action=set-default");
      return;
    }

    // Standard flow: create order only when user proceeds to checkout.
    const nextOrderId = await createOrder();

    if (nextOrderId === "PRICE_CHANGED") return;

    if (!nextOrderId) {
      toast.error("Unable to prepare order. Please try again.");
      return;
    }

    router.push("/checkout/order");
  };

  // if (items.length === 0) {
  //   return (
  //     <div className="">
  //       <div className=" linearGradientBackground pb-12">
  //         <div className="xl:px-[100px]">
  //           <DesktopNavbar textColor={`!text-black`} />
  //         </div>
  //         <MobileNavbar utilityClassName="px-6  md:px-9 lg:px-[100px] " />
  //         <Link
  //           href="/shop"
  //           className="px-5 md:px-8 lg:px-[100px] text-[22px] lg:text-[33px] text-primary flex gap-x-1 items-center pt-[40px] lg:pt-[70px]"
  //         >
  //           <IoChevronBack className="font-black" />
  //           <p>Shop</p>
  //         </Link>
  //       </div>
  //       <div className="bg-gray-50 py-[90px] flex items-center justify-center">
  //         <div className="text-center">
  //           <div className="mb-6">
  //             <div className="mx-auto w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-4">
  //               <svg
  //                 className="w-10 h-10 text-gray-400"
  //                 fill="none"
  //                 stroke="currentColor"
  //                 viewBox="0 0 24 24"
  //               >
  //                 <path
  //                   strokeLinecap="round"
  //                   strokeLinejoin="round"
  //                   strokeWidth={2}
  //                   d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
  //                 />
  //               </svg>
  //             </div>
  //           </div>
  //           <h2 className="text-2xl font-bold text-gray-900 mb-4">
  //             Your cart is empty
  //           </h2>
  //           <p className="text-gray-600 mb-6">
  //             Add some beautiful African prints to get started!
  //           </p>
  //           <div className="pt-4">
  //             <Link
  //               href="/products"
  //               className="bg-primary text-white px-6 py-3  rounded-md font-semibold hover:bg-opacity-90 transition-colors"
  //             >
  //               Continue Shopping
  //             </Link>
  //           </div>
  //         </div>
  //       </div>
  //       <Footer />
  //     </div>
  //   );
  // }

  return (
    <div className="">
      {/* Header with Navbar */}
      <div className=" linearGradientBackground  pb-12">
        <div className="xl:px-[100px]">
          <DesktopNavbar textColor={`!text-black`} />
        </div>
        <MobileNavbar utilityClassName="px-6 md:px-9 lg:px-[100px]" />
        <div className="flex justify-between items-center pt-10 px-5 md:px-8 lg:px-[100px] ">
          <Link
            href="/cart"
            className="text-lg sm:text-[22px] lg:text-[33px] text-primary flex gap-x-1 items-center"
          >
            <IoChevronBack className="font-black" />
            <p>Products</p>
          </Link>
          <Link href="/products" className="text-primary hover:underline">
            Continue shopping
          </Link>
        </div>
      </div>

      {/* Cart Content */}
      {getCart?.isPending ? (
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : getCart?.data?.items.length === 0 ? (
        <div className="bg-gray-50 py-[90px] flex items-center justify-center">
          <div className="text-center">
            <div className="mb-6">
              <div className="mx-auto w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-10 h-10 text-gray-400"
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
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Your cart is empty
            </h2>
            <p className="text-gray-600 mb-6">
              Add some beautiful African prints to get started!
            </p>
            <div className="pt-4">
              <Link
                href="/products"
                className="bg-primary text-white px-6 py-3  rounded-md font-semibold hover:bg-opacity-90 transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 min-h-screen md:px-9 lg:px-[100px] 2xl:px-[100px] py-12">
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

          {hasPriceChanges && (
            <div className="border border-amber-300 bg-amber-50 text-amber-800 text-sm rounded-lg p-4 mb-6 mx-3 md:mx-0">
              Some prices in your cart have been updated. Please review them before checking out.
            </div>
          )}

          {/* Cart Items */}
          <div className="bg-white rounded-lg shadow-sm border mb-8">
            {/* Table Header */}
            <div className="grid grid-cols-9 md:grid-cols-12 gap-4 p-6 border-b bg-gray-50 font-semibold text-gray-700">
              <div className="col-span-3 md:col-span-6">PRODUCT</div>
              <div className="col-span-2 md:col-span-2 text-center">PRICE</div>
              <div className="col-span-2 md:col-span-2 text-center">QTY</div>
              <div className="col-span-2 md:col-span-2 text-center">TOTAL</div>
            </div>

            {/* Cart Items */}
            {cartItems?.map((item, index) => (
              <div
                key={item?.cartItemId || index}
                className="grid grid-cols-9 md:grid-cols-12 gap-4 py-6 px-3 md:px-6 md:py-6 border-b items-center text-sm md:text-base"
              >
                {(() => {
                  const itemCustomizations = item?.customizations || [];
                  const fabricInCart = itemCustomizations.find(
                    isFabricCustomization
                  );
                  const nonFabricCustomizations = itemCustomizations.filter(
                    (customization) => !isFabricCustomization(customization)
                  );
                  const selectedFabricValue = fabricInCart?.value || "";

                  return (
                    <>
                {/* Product Info */}
                <div className="col-span-3 md:col-span-6 flex items-center space-x-1 md:space-x-4">
                  <button
                    onClick={() => deleteCartItem.mutate(item?.cartItemId)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                    disabled={deleteCartItem.isLoading}
                  >
                    <FiTrash2 size={20} />
                  </button>
                  <div className="flex md:flex-row flex-col items-center gap-x-4">
                    <div className="relative w-20 h-20 rounded-md overflow-hidden">
                      <Image
                        src={item?.images[0]?.imageUrl || ""}
                        alt={item?.images[0]?.altText || "Product image"}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold pt-1 md:pt-0 text-gray-900">
                        {item?.productName}
                      </h3>
                      <p className="text-xs text-gray-600 pt-1">
                        Measurement: {item?.measurement ? "Provided" : "Not provided"}
                      </p>
                      {item?.pieceOption && (
                        <p className="text-xs text-gray-600">
                          Outfit:{" "}
                          {item.pieceOption === "THREE_PIECE"
                            ? "3-piece"
                            : "2-piece"}
                        </p>
                      )}
                      {item?.fabricName ? (
                        <p className="text-xs text-gray-600">
                          Fabric Type: {item.fabricName}
                        </p>
                      ) : selectedFabricValue && (
                        <p className="text-xs text-gray-600">
                          Fabric Type: {selectedFabricValue}
                        </p>
                      )}
                      {item?.clothDesign && (
                        <p className="text-xs text-gray-600">Cloth design</p>
                      )}
                      {nonFabricCustomizations.map((customization) => (
                        <p
                          key={`${item?.cartItemId}-${customization?.productCustomizationId}`}
                          className="text-xs text-gray-600"
                        >
                          {customization?.customizationName || "Customization"}: {customization?.value || "-"}
                        </p>
                      ))}
                      <p
                        className="text-primary cursor-pointer text-xs lg:text-sm flex justify-center items-center underline"
                        onClick={() => {
                          setIsViewCustomizationsModalVisible(true),
                            setCustomizationImagesCustom(
                              item?.customizationImages
                            );
                        }}
                      >
                        View Customizations
                      </p>
                    </div>
                  </div>
                </div>

                {/* Price */}
                <div className="col-span-2 md:col-span-2 text-center">
                  <span className="font-medium text-gray-900">
                    ${formatMoney(item?.unitPrice)}
                  </span>
                  {item?.priceChanged && (
                    <p className="text-xs text-amber-700 pt-1">
                      Price updated from ${formatMoney(item?.previousUnitPrice)} to ${formatMoney(item?.unitPrice)}
                    </p>
                  )}
                </div>

                {/* Quantity */}
                <div className="col-span-2 md:col-span-2 flex justify-center">
                  <div className="flex items-center border rounded-md">
                    <button
                      onClick={() =>
                        handleQuantityChange(
                          item?.cartItemId,
                          item?.quantity - 1
                        )
                      }
                      className="p-2 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={item?.quantity <= 1 || updateCartItem.isPending}
                    >
                      <FiMinus size={16} />
                    </button>
                    <input
                      type="number"
                      value={item?.quantity}
                      onChange={(e) => {
                        // Allow typing without immediate API call
                        const value = e.target.value;
                        if (value === "" || parseInt(value) >= 1) {
                          // Only update if valid, but don't call API yet
                        }
                      }}
                      onBlur={(e) => {
                        const newQuantity = parseInt(e.target.value) || 1;
                        if (
                          newQuantity >= 1 &&
                          newQuantity !== item?.quantity
                        ) {
                          handleQuantityChange(item?.cartItemId, newQuantity);
                        } else if (newQuantity < 1) {
                          // Reset to 1 if invalid
                          e.target.value = item?.quantity;
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.target.blur();
                        }
                      }}
                      className="w-8 sm:w-9 md:w-16 text-center border-none focus:outline-none"
                      min="1"
                      disabled={updateCartItem.isPending}
                    />
                    <button
                      onClick={() =>
                        handleQuantityChange(
                          item?.cartItemId,
                          item?.quantity + 1
                        )
                      }
                      className="p-2 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={updateCartItem.isPending}
                    >
                      <FiPlus size={16} />
                    </button>
                  </div>
                </div>

                {/* Total */}
                <div className="col-span-2 md:col-span-2 text-center">
                  <span className="font-semibold text-gray-900">
                    ${Number(
                      item?.itemTotal !== undefined && item?.itemTotal !== null
                        ? item?.itemTotal
                        : Number(item?.unitPrice || 0) * Number(item?.quantity || 0)
                    ).toFixed(2)}
                  </span>
                </div>
                    </>
                  );
                })()}
              </div>
            ))}
          </div>

          {/* Cart Summary */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold text-gray-900">
                Taxes:{" "}
              </span>
              <span className="text-base md:text-sm text-gray-600">
                {taxAmount === null ? (
                  <div className="h-4 w-12 bg-gray-300 rounded animate-pulse"></div>
                ) : (
                  `$${taxAmount.toFixed(2)}`
                )}
              </span>
            </div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold text-gray-900">
                Total Discount:{" "}
              </span>
              <span className="text-base md:text-sm text-gray-600">
                {totalDiscount === null ? (
                  <div className="h-4 w-12 bg-gray-300 rounded animate-pulse"></div>
                ) : (
                  `$${totalDiscount.toFixed(2)}`
                )}
              </span>
            </div>
            <div className="flex justify-between items-center ">
              <span className="text-lg font-semibold text-gray-900">
                Grand Total:
              </span>
              <span className="text-base md:text-sm text-gray-600">
                {totalAmount === null ? (
                  <div className="h-4 w-12 bg-gray-300 rounded animate-pulse"></div>
                ) : (
                  `$${Number(totalAmount).toFixed(2)}`
                )}
              </span>
            </div>
          </div>

          {/* Checkout Button */}
          <div className="flex justify-center ">
            <div className="w-full flex justify-center">
              <Button
                type="button"
                onClick={handleCheckoutClick}
                disable={
                  createOrderLoader ||
                  getCart?.isPending ||
                  getAddresses?.isPending ||
                  cartItems.length === 0
                }
                className={`px-12 !py-5  rounded-md font-semibold min-w-[250px] lg:!min-w-[400px] text-lg transition-colors ${"bg-primary text-white hover:bg-opacity-90"}`}
              >
                Checkout
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Price changed during checkout: explicit confirmation required */}
      {priceChangeNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Some prices have changed
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              The price of one or more items changed since you added them. Your
              new total is{" "}
              <span className="font-semibold text-gray-900">
                ${formatMoney(priceChangeNotice.newTotal)}
              </span>
              .
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button
                type="button"
                onClick={() => setPriceChangeNotice(null)}
                disabled={createOrderLoader}
                className="px-5 py-3 rounded-md border border-primary text-primary font-medium"
              >
                Back to cart
              </button>
              <button
                type="button"
                onClick={handleContinueAtNewPrice}
                disabled={createOrderLoader}
                className="px-5 py-3 rounded-md bg-primary text-white font-medium disabled:opacity-60"
              >
                {createOrderLoader ? "Please wait..." : "Continue at new price"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />
      <ViewCustomizationsModal
        isVisible={isViewCustomizationsModalVisible}
        onClose={() => setIsViewCustomizationsModalVisible(false)}
        // customizationImages={item?.customizationImages}
        onDelete={(imageId) => {
          setCustomizationImagesCustom((prev) =>
            prev.filter(
              (item) =>
                item?.imageId !== imageId
            )
          );
          // Invalidate cart query to refetch updated customization images
          if (user?.userId) {
            queryClient.invalidateQueries({
              queryKey: ["getCart", user?.userId],
            });
          }
        }}
      />
    </div>
  );
};

export default CartPage;
