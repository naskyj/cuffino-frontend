"use client";

import Image from "next/image";
import localFont from "next/font/local";
import Link from "next/link";
import { Playfair_Display } from "next/font/google";
import CustomDropdown from "../customDropdown";
import { FiShoppingCart, FiSearch } from "react-icons/fi";
import { FaArrowRight } from "react-icons/fa";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { FaRegUser } from "react-icons/fa";
import { ProductServices } from "@/services/product";
import { CartServices } from "@/services/cart";
import useAuth from "@/core/zustand/auth.store";
import useUtility from "@/core/zustand/utility";
import { useQuery } from "@tanstack/react-query";

const playFair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair_display",
});

const DesktopNavbar = ({
  isLogoBlack = true,
  textColor,
  isAuthPage = false,
}) => {
  const [mounted, setMounted] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [search, setSearch] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const searchRef = useRef(null);
  const { loggedIn, user } = useAuth();

  const router = useRouter();
  const { totalCartItems, setTotalCartItems } = useUtility();
  const pathname = usePathname(); // e.g., "/shop"
  const page = pathname.replace("/", "").toLowerCase();

  const isActive = (slug) =>
    page.includes(slug.toLowerCase()) ? "text-primary" : "";

  const navLinkClass =
    "font-normal text-lg hover:font-semibold transition-[font-weight] duration-200 ease-out";

  // Fetch categories from API
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await ProductServices.getAllCategories();
      if (response.data) {
        const categoryData = response.data;

        // Keep dropdown payload simple and route from menu onClick handler.
        const collectionItems = categoryData.map((category) => ({
          key: category.categoryName,
          label: category.categoryName,
        }));

        setCategories(collectionItems);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      // Fallback to empty array if API fails
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch cart and update totalCartItems
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

  // Update totalCartItems when cart data is available
  useEffect(() => {
    if (getCart?.data?.items) {
      setTotalCartItems(getCart?.data?.totalItems || 0);
    } else if (!user?.userId) {
      // Reset to 0 if user is not logged in
      setTotalCartItems(0);
    }
  }, [getCart?.data, user?.userId, setTotalCartItems]);

  useEffect(() => {
    setMounted(true);
    fetchCategories();
  }, []);

  useEffect(() => {
    const routes = ["/", "/how-it-works", "/shop", "/aboutus", "/cart"];
    routes.forEach((route) => router.prefetch(route));
    router.prefetch(loggedIn ? "/user-profile" : "/login");
  }, [router, loggedIn]);

  const handleCollectionSelect = (categoryName) => {
    if (!categoryName) {
      return;
    }
    router.push(`/shop?category=${encodeURIComponent(categoryName)}`);
  };

  return (
    <div className="hidden xl:block">
      <div className="flex justify-center">
        <div
          className={`text-white w-full flex justify-between items-center pt-10 ${textColor}`}
        >
          <Link href={`/`}>
            <div className={`${playFair.className} flex flex-col items-center`}>
              {isLogoBlack ? (
                <div className="flex items-center">
                  <Image
                    src="/assets/logo/black-logo.svg"
                    alt="Cuffino"
                    className={`w-full h-[40px]`}
                    width={0}
                    height={0}
                  />
                </div>
              ) : (
                <div className="flex items-center">
                  <Image
                    src="/assets/logo/white-logo.svg"
                    alt="Cuffino"
                    className={`w-full h-[40px]`}
                    width={0}
                    height={0}
                  />
                </div>
              )}
              <div className="flex flex-col items-start gap-2">
                <p className="uppercase text-3xl font-medium">CUFFINO</p>
                <p className="italic text-xs font-normal -mt-1">
                  Custom Fit for Now
                </p>
              </div>
            </div>
          </Link>

          <div className=" xl:ml-[85px] font-bold flex gap-x-9 text-[15px] smallLaptopNavMargin">
            <Link href="/" className={`${navLinkClass} ${isActive("home")}`}>
              Home
            </Link>
            <Link
              href="/how-it-works"
              className={`${navLinkClass} ${isActive("how-it-works")}`}
            >
              How It Works
            </Link>
            <div className={isActive("collection")}>
              <CustomDropdown
                items={categories}
                heading={"Collection"}
                onItemClick={handleCollectionSelect}
              />
            </div>
            <Link href="/shop" className={`${navLinkClass} ${isActive("shop")}`}>
              Shop
            </Link>
            {/* <div className={`font-normal text-lg ${isActive("products")}`}>
              <Link href="/products">Products</Link>
            </div> */}
            {/* <div className={`font-normal text-lg ${isActive("pages")}`}>
              <Link href="">Pages</Link>
            </div> */}
            <Link
              href="/aboutus"
              className={`${navLinkClass} ${isActive("aboutus")}`}
            >
              About Us
            </Link>
          </div>
          <div
            className={`pl-12 ${
              isAuthPage ? "hidden" : "flex"
            } items-center gap-4`}
          >
            {/* Search Icon */}
            <button
              onClick={() => {
                setShowSearch(!showSearch);
                if (!showSearch) {
                  setTimeout(() => searchRef.current?.focus(), 100);
                }
              }}
              className="relative rounded-md p-0.5 transition-transform duration-200 ease-out hover:scale-110"
              aria-label="Search"
            >
              <FiSearch size={24} />
            </button>

            {/* Cart Icon */}
            <Link
              href="/cart"
              className="relative rounded-md p-0.5 transition-transform duration-200 ease-out hover:scale-110"
            >
              <div className="">
                <FiShoppingCart size={24} />
                {totalCartItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {totalCartItems}
                  </span>
                )}
              </div>
            </Link>

            {/* user icon */}
            <Link
              href={loggedIn ? "/user-profile" : "/login"}
              className="relative rounded-md p-0.5 transition-transform duration-200 ease-out hover:scale-110"
            >
              <div className="">
                <FaRegUser size={24} />
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Search Bar Dropdown */}
      {showSearch && (
        <div className="px-6 pb-4 absolute right-[100px]">
          <div className=" w-[400px]">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              ref={searchRef}
              placeholder={!isFocused ? "Search within Cuffino" : ""}
              className="border w-full placeholder:text-sm placeholder:text-[#757575] placeholder:font-[300] placeholder:pl-0 p-2 pl-8 rounded-[20px]"
              // onFocus={() => setIsFocused(true)}
              // onBlur={() => setIsFocused(false)}
            />
            {!isFocused && (
              <button
                aria-label="Search Icon"
                className="absolute translate-y-[14px] left-9"
              >
                <FiSearch className="text-gray-400" />
              </button>
            )}
            <button
              className="absolute right-8 translate-y-[6px]"
              aria-label="Search Button"
              onClick={() => {
                if (search.length > 3) {
                  router.push(`/shop?search=${search}`);
                  setShowSearch(false);
                  setSearch("");
                }
              }}
            >
              <div className="flex items-center justify-center rounded-[30px] p-2 bg-black">
                <FaArrowRight className="text-sm text-white" />
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default DesktopNavbar;
