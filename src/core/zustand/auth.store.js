

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const useAuth = create(
  persist(
    (set) => ({
      loggedIn: false,
      token: null,
      refreshToken: null,
      user: null,
      role: "ADMIN",
      verified: false,
      product: null,
      registerEmail: "",
      isNewUser: false, // Track if user is newly registered
      profilePromptDismissed: false, // Track if user dismissed the profile prompt

      setLoggedIn: (value) => set({ loggedIn: value }),
      setToken: (token) => set({ token }),
      setRefreshToken: (refreshToken) => set({ refreshToken }),
      setVerified: (value) => set({ verified: value }),
      setUser: (user) => set({ user, loggedIn: true }),
      setUserRoleType: (role) => set({ role }),
      setRegisterEmail: (registerEmail) => set({ registerEmail }),
      setIsNewUser: (value) => set({ isNewUser: value }),
      setProfilePromptDismissed: (value) => set({ profilePromptDismissed: value }),
      
      logout: () => {
        set({
          loggedIn: false,
          token: null,
          refreshToken: null,
          user: null,
          role: null,
          verified: false,
          product: "",
          isNewUser: false,
          profilePromptDismissed: false,
        });
        // if (typeof window !== "undefined") {
        //   window.location.replace("/login");
        // }
      },
    }),
    {
      name: "auth-store",
      storage: typeof window !== 'undefined' 
        ? createJSONStorage(() => localStorage) // Ensure this only happens in the client
        : undefined, // Avoid localStorage access during SSR
    }
  )
);

export default useAuth;
