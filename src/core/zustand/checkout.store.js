import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import axiosInstance from "../api/api";
import useAuth from "./auth.store";
import { OrdersServices } from "../../services/orders";

const useCheckout = create(
  persist(
    (set, get) => ({
      // Order details
      orderItems: [],
      orderTotal: 0,
      shippingCost: 0,
      taxAmount: 0,
      finalTotal: 0,

      // Customer information
      customerInfo: {
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
      },

      // Billing address
      billingAddress: {
        address: "",
        address2: "",
        city: "",
        state: "",
        country: "",
        zipCode: "",
      },

      // Shipping address
      shippingAddress: {
        address: "",
        address2: "",
        city: "",
        state: "",
        country: "",
        zipCode: "",
      },

      // Payment information
      paymentInfo: {
        method: "credit",
        cardHolderName: "",
        cardNumber: "",
        expiration: "",
        cvv: "",
      },

      // Checkout preferences
      preferences: {
        sameAsBilling: true,
        saveInfo: false,
        newsletter: false,
      },

      // Initialize checkout with cart items
      initializeCheckout: (cartItems, cartTotal) => {
        const shippingCost = 10.0; // Fixed shipping cost
        const taxRate = 0.08; // 8% tax rate
        const taxAmount = cartTotal * taxRate;
        const finalTotal = cartTotal + shippingCost + taxAmount;

        set({
          orderItems: cartItems,
          orderTotal: cartTotal,
          shippingCost,
          taxAmount,
          finalTotal,
        });
      },

      // Update customer information
      updateCustomerInfo: (info) => {
        set((state) => ({
          customerInfo: { ...state.customerInfo, ...info },
        }));
      },

      // Update billing address
      updateBillingAddress: (address) => {
        set((state) => ({
          billingAddress: { ...state.billingAddress, ...address },
        }));
      },

      // Update shipping address
      updateShippingAddress: (address) => {
        set((state) => ({
          shippingAddress: { ...state.shippingAddress, ...address },
        }));
      },

      // Update payment information
      updatePaymentInfo: (payment) => {
        set((state) => ({
          paymentInfo: { ...state.paymentInfo, ...payment },
        }));
      },

      // Update preferences
      updatePreferences: (preferences) => {
        set((state) => ({
          preferences: { ...state.preferences, ...preferences },
        }));
      },

      // Process order
      processOrder: async () => {
        const state = get();
        const authState = useAuth.getState();

        try {
          // Transform cart items to the required payload format
          const transformedItems = state.orderItems.map((item) => {
            // Check if it's a measurement item
            if (item.measurement) {
              return {
                productId: item.productId || item.id,
                quantity: item.quantity,
                measurement: item.measurement,
                measurementProfileId: item.measurementProfileId || 0,
                customizations: item.customizations || [],
                // Note: productName and productImage are excluded from API payload
                // They are only used for UI display purposes
              };
            } else {
              // Regular item - create minimal measurement structure
              return {
                productId: item.id,
                quantity: item.quantity,
                measurement: {
                  bodyType: "",
                  height: 0,
                  bust: 0,
                  waist: 0,
                  hips: 0,
                  shoulderWidth: 0,
                  armLength: 0,
                  legLength: 0,
                  neck: 0,
                  sleeveLength: 0,
                  inseam: 0,
                  thigh: 0,
                  calf: 0,
                  additionalNotes: "",
                  customFields: {
                    additionalProp1: "",
                    additionalProp2: "",
                    additionalProp3: "",
                  },
                },
                measurementProfileId: 0,
                customizations: [],
              };
            }
          });

          // Create the payload in the required format
          const orderPayload = {
            customerId: authState.user?.userId || 0,
            items: transformedItems,
          };

          console.log("Submitting order to /order/add:", orderPayload);

          // Make API call to /order/add endpoint
          const response = await OrdersServices.addOrder(orderPayload);
          console.log("Order submission response:", response.data);

          return {
            success: true,
            orderId: response.data.orderId || `ORD-${Date.now()}`,
            message: "Order placed successfully!",
            data: response.data,
          };
        } catch (error) {
          console.error("Error processing order:", error);
          return {
            success: false,
            message:
              error.response?.data?.message ||
              "Failed to process order. Please try again.",
            error: error.response?.data,
          };
        }
      },

      // Clear checkout data
      clearCheckout: () => {
        set({
          orderItems: [],
          orderTotal: 0,
          shippingCost: 0,
          taxAmount: 0,
          finalTotal: 0,
          customerInfo: {
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
          },
          billingAddress: {
            address: "",
            address2: "",
            city: "",
            state: "",
            country: "",
            zipCode: "",
          },
          shippingAddress: {
            address: "",
            address2: "",
            city: "",
            state: "",
            country: "",
            zipCode: "",
          },
          paymentInfo: {
            method: "credit",
            cardHolderName: "",
            cardNumber: "",
            expiration: "",
            cvv: "",
          },
          preferences: {
            sameAsBilling: true,
            saveInfo: false,
            newsletter: false,
          },
        });
      },
    }),
    {
      name: "cuffino-checkout",
      storage:
        typeof window !== "undefined"
          ? createJSONStorage(() => localStorage)
          : undefined,
    }
  )
);

export default useCheckout;
