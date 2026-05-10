import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const useUtility = create(
  persist(
    (set) => ({
      loggedIn: false,
      search: "",
      isSizeFormModalVisible: false,
      clientSecret: "",
      orderId: null,
      totalCartItems: 0,

      setClientSecret: (clientSecret) => set({ clientSecret }),
      setIsSizeFormModalVisible: (isSizeFormModalVisible) =>
        set({ isSizeFormModalVisible }),
      setSearch: (value) => set({ search: value }),
      setOrderId: (orderId) => set({ orderId }),
      setTotalCartItems: (totalCartItems) => set({ totalCartItems }),
    }),
    {
      name: "utility-store",
      storage:
        typeof window !== "undefined"
          ? createJSONStorage(() => localStorage) // Ensure this only happens in the client
          : undefined, // Avoid localStorage access during SSR
    }
  )
);

export default useUtility;
