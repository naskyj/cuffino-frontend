"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import useAuth from "@/core/zustand/auth.store";

// Shopping needs the customer's saved measurements, so these pages are for signed-in customers only.
const RequireLogin = ({ children }) => {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  // Wait for client-side hydration: the login lives in localStorage
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !user) {
      const here = `${pathname}${window.location.search}`;
      router.replace(`/login?from=${encodeURIComponent(here)}`);
    }
  }, [user, router, pathname, isMounted]);

  if (!isMounted || !user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return children;
};

export default RequireLogin;
