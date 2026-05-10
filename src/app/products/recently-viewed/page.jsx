"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { IoChevronBack } from "react-icons/io5";
import ProductCard from "@/components/reusables/ProductCard";
import DesktopNavbar from "@/components/navbars/desktopNavbar";
import Footer from "@/components/footer";
import {
  getRecentlyViewed,
  clearRecentlyViewed,
} from "@/components/utils/recentlyViewedUtils";

const RecentlyViewedPage = () => {
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get recently viewed products from localStorage
    const products = getRecentlyViewed();
    setRecentlyViewed(products);
    setLoading(false);
  }, []);

  const handleClearAll = () => {
    clearRecentlyViewed();
    setRecentlyViewed([]);
  };

  if (loading) {
    return (
      <div className="">
        <div className="bg-black relative md:px-[100px] lg:px-[100px] 2xl:px-[100px] w-screen">
          <DesktopNavbar />
        </div>
        <div className="bg-gray-50 min-h-screen flex items-center justify-center">
          <div className="text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="">
      {/* Header with Navbar */}
      <div className="bg-black relative md:px-[100px] lg:px-[100px] 2xl:px-[100px] w-screen">
        <DesktopNavbar />
      </div>

      {/* Main Content */}
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:px-[100px] lg:px-[100px] 2xl:px-[100px]">
          {/* Header Section */}
          <div className="mb-8">
            {/* Back to Products */}
            <div className="mb-4">
              <Link
                href="/products"
                className="inline-flex items-center text-gray-600 hover:text-gray-900 text-lg font-medium"
              >
                <IoChevronBack className="w-5 h-5 mr-1" />
                Back to Products
              </Link>
            </div>

            {/* Page Title and Actions */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Recently Viewed Products
                </h1>
                <p className="text-gray-600">
                  {recentlyViewed.length === 0
                    ? "No recently viewed products"
                    : `Showing ${
                        recentlyViewed.length
                      } recently viewed product${
                        recentlyViewed.length !== 1 ? "s" : ""
                      }`}
                </p>
              </div>
              {recentlyViewed.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="px-4 py-2 text-sm font-medium text-red-600 border border-red-600 rounded-md hover:bg-red-50 transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          {/* Products Grid */}
          {recentlyViewed.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12">
              {recentlyViewed.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-gray-400 mb-4">
                <svg
                  className="mx-auto h-12 w-12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Recently Viewed Products
              </h3>
              <p className="text-gray-600 mb-6">
                Start browsing our products to see your recently viewed items
                here.
              </p>
              <Link
                href="/products"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-opacity-90 transition-colors"
              >
                Browse Products
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default RecentlyViewedPage;
