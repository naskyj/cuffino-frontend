import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const useCart = create(
  persist(
    (set, get) => ({
      items: [],
      total: 0,

      addToCart: (product, quantity = 1) => {
        set((state) => {
          const existingItem = state.items.find(
            (item) => item.id === product.id
          );

          if (existingItem) {
            // Update quantity if item already exists
            const updatedItems = state.items.map((item) =>
              item.id === product.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            );
            return {
              items: updatedItems,
              total: updatedItems.reduce(
                (sum, item) =>
                  sum + parseFloat(item.price.replace("$", "")) * item.quantity,
                0
              ),
            };
          } else {
            // Add new item
            const newItem = { ...product, quantity };
            const updatedItems = [...state.items, newItem];
            return {
              items: updatedItems,
              total: updatedItems.reduce(
                (sum, item) =>
                  sum + parseFloat(item.price.replace("$", "")) * item.quantity,
                0
              ),
            };
          }
        });
      },

  

      addMeasurementItem: (measurementData) => {
        console.log("Cart store - adding measurement item:", measurementData);
        set((state) => {
          // Check if item with same productId already exists
          const existingItem = state.items.find(
            (item) => item.productId === measurementData.productId
          );

          const newItem = {
            id: measurementData.productId, // Use productId as id for cart display
            title:
              measurementData.productName ||
              `Custom Product #${measurementData.productId}`, // Use actual product name
            price: measurementData.price,
            imageUrl:
              measurementData.productImage ||
              "/assets/images/ourProducts/Frame25.svg", // Use actual product image
            quantity: measurementData.quantity,
            // Keep measurement data for backend processing
            productId: measurementData.productId,
            measurement: measurementData.measurement,
            measurementProfileId: measurementData.measurementProfileId || 0,
            customizations: measurementData.customizations || [],
          };

          let updatedItems;
          if (existingItem) {
            // Update existing item with new measurement data
            updatedItems = state.items.map((item) =>
              item.productId === measurementData.productId ? newItem : item
            );
            console.log(
              "Cart store - updated existing measurement item:",
              newItem
            );
          } else {
            // Add new item
            updatedItems = [...state.items, newItem];
            console.log("Cart store - new measurement item created:", newItem);
          }

          const newTotal = updatedItems.reduce((sum, item) => {
            const priceValue = parseFloat(item.price?.replace("$", "") || "0");
            const quantity = item.quantity || 1;
            const itemTotal = priceValue * quantity;
            console.log(
              `Item ${item.id}: price=${priceValue}, quantity=${quantity}, total=${itemTotal}`
            );
            return sum + itemTotal;
          }, 0);

          console.log("Cart store - updated items:", updatedItems);
          console.log("Cart store - new total:", newTotal);

          return {
            items: updatedItems,
            total: newTotal,
          };
        });
      },

      removeFromCart: (productId) => {
        set((state) => {
          const updatedItems = state.items.filter(
            (item) => item.id !== productId
          );
          return {
            items: updatedItems,
            total: updatedItems.reduce(
              (sum, item) =>
                sum + parseFloat(item.price.replace("$", "")) * item.quantity,
              0
            ),
          };
        });
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(productId);
          return;
        }

        set((state) => {
          const updatedItems = state.items.map((item) =>
            item.id === productId ? { ...item, quantity } : item
          );
          return {
            items: updatedItems,
            total: updatedItems.reduce(
              (sum, item) =>
                sum + parseFloat(item.price.replace("$", "")) * item.quantity,
              0
            ),
          };
        });
      },

      clearCart: () => {
        console.log("Cart store - clearing all items");
        set({ items: [], total: 0 });
      },

      getCartItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    {
      name: "cuffino-cart",
      storage:
        typeof window !== "undefined"
          ? createJSONStorage(() => localStorage)
          : undefined,
    }
  )
);

export default useCart;
