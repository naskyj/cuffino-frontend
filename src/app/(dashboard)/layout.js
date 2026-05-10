"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import useAuth from "@/core/zustand/auth.store";
import { usePathname, useRouter } from "next/navigation";
import DesktopNavbar from "@/components/navbars/desktopNavbar";
import MobileNavbar from "@/components/navbars/mobileNavabr";
import { IoChevronBack, IoHomeOutline } from "react-icons/io5";
import Usertab from "@/components/reusables/user-tab";

const pageTitleMap = {
  "/user-account": "Account",
  "/user-profile": "Profile",
  "/user-billing": "Billing",
  "/user-payment": "Payment",
  "/user-notification": "Notifications",
  "/user-setting": "Settings",
  "/user-measurement": "Measurements",
  "/user-orders": "Orders",
  "/user-delivery-address": "Delivery Address"
};

// Skeleton loader component
const ContentSkeleton = () => (
  <div className="animate-pulse space-y-6">
    <div className="h-8 bg-gray-200 rounded-lg w-1/3"></div>
    <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
    </div>
    <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    </div>
  </div>
);

const DashboardLayout = ({ children }) => {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  // Wait for client-side hydration to complete
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Only check authentication after component has mounted (hydration complete)
    if (isMounted && !user) {
      router.push(`/login?from=${encodeURIComponent(pathname)}`);
    }
  }, [user, router, pathname, isMounted]);

  // Show loading state during hydration or if user is not authenticated
  if (!isMounted || !user) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  const pageTitle = pageTitleMap[pathname] || "Dashboard";

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header Section */}
      <div className="linearGradientBackground">
        <div className="xl:px-[100px]">
          <DesktopNavbar textColor={`!text-black`} />
        </div>
        <MobileNavbar utilityClassName="px-6 md:px-9 lg:px-[100px]" />
        
        {/* Breadcrumb & Title */}
        <div className="px-5 md:px-8 lg:px-[100px] pt-8 pb-10 lg:pt-12 lg:pb-14">
          {/* Breadcrumb */}
          {/* <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
            <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1">
              <IoHomeOutline className="w-4 h-4" />
              <span>Home</span>
            </Link>
            <span>/</span>
            <span className="text-gray-700">{pageTitle}</span>
          </div> */}
          
          {/* Page Title */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="w-10 h-10 rounded-full bg-white/80 border border-gray-100 flex items-center justify-center hover:bg-white hover:border-primary/20 transition-all shadow-sm"
            >
              <IoChevronBack className="w-5 h-5 text-primary" />
            </Link>
            <h1 className="text-2xl lg:text-3xl font-semibold text-gray-900">
              {pageTitle}
            </h1>
          </div>
        </div>
      </div>

      {/* Main Content Section */}
      <section className="relative py-16 lg:py-24">
        <div className="px-4 md:px-8 lg:px-[100px] xl:px-[120px] -mt-2">
          <div className="flex flex-col md:flex-row gap-6 lg:gap-8">
            {/* Sidebar */}
            <Usertab />

            {/* Main Content */}
            <div className="flex-1 min-w-0 mt-6 md:mt-0">
              <Suspense fallback={<ContentSkeleton />}>
                {children}
              </Suspense>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DashboardLayout;
