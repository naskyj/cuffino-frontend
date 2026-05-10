"use client";
import Image from "next/image";
import localFont from "next/font/local";
import Link from "next/link";
import { useEffect, useState } from "react";
import { RxHamburgerMenu } from "react-icons/rx";
import { IoMdClose } from "react-icons/io";
import { Playfair_Display } from "next/font/google";
import { FiShoppingCart } from "react-icons/fi";
import SideBar from "../reusables/sideBar";
import { FaRegUser } from "react-icons/fa6";
import { IoSearch } from "react-icons/io5";
import { ProductServices } from "@/services/product";
import { CartServices } from "@/services/cart";
import { useRouter } from "next/navigation";
import useAuth from "@/core/zustand/auth.store";
import useUtility from "@/core/zustand/utility";
import { useQuery } from "@tanstack/react-query";

const playFair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair_display",
});

const MobileNavbar = ({
  utilityClassName,
  isAuthPage = false,
  isLogoBlack = true,
}) => {
  const { loggedIn, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const { totalCartItems, setTotalCartItems } = useUtility();

  // Fetch categories from API
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await ProductServices.getAllCategories();
      if (response.data) {
        const categoryData = response.data;

        // Transform API data to simple array format for mobile sidebar
        const categoryItems = categoryData.map((category) => ({
          id: category.categoryId,
          name: category.categoryName,
          link: `/shop?category=${category.categoryName}`,
        }));

        setCategories(categoryItems);
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

  return (
    <>
      <SideBar
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        categories={categories}
        loading={loading}
      />
      <div
        className={`pt-6  flex items-center xl:px-0 justify-between xl:hidden ${utilityClassName}`}
      >
        <div className="">
          <Link href={`/`}>
            <div
              className={`${playFair.className} flex flex-col items-center `}
            >
              {isLogoBlack ? (
                <div className="flex items-center">
                  <Image
                    src="/assets/logo/black-logo.svg"
                    alt="Cuffino"
                    className={`w-full h-[30px]`}
                    width={0}
                    height={0}
                  />
                </div>
              ) : (
                <div className="flex items-center">
                  <Image
                    src="/assets/logo/white-logo.svg"
                    alt="Cuffino"
                    className={`w-full h-[30px]`}
                    width={0}
                    height={0}
                  />
                </div>
              )}
              <div className="flex flex-col items-start gap-0.5">
                <p className="uppercase text-xl md:text-2xl font-medium">
                  CUFFINO
                </p>
                <p className="italic text-[9px] font-normal -mt-1">
                  Custom Fit for Now
                </p>
              </div>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-x-4">
          {/* <Link href="/login" className=" relative">
            <IoSearch className="text-xl md:text-2xl" />
          </Link> */}

          <div
            className={`${isAuthPage ? "hidden" : "flex"} items-center gap-x-4`}
          >
            <Link href="/cart" className=" relative">
              <FiShoppingCart className="text-xl md:text-2xl" />
                {totalCartItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {totalCartItems}
                </span>
              )}
            </Link>
            <Link
              href={loggedIn ? "/user-profile" : "/login"}
              className="relative"
            >
              <div className="">
                <FaRegUser className="text-xl md:text-2xl" />
              </div>
            </Link>
          </div>

          <div className="">
            <div
              className={`${!isOpen ? "block" : "hidden"}`}
              onClick={() => setIsOpen(!isOpen)}
            >
              <RxHamburgerMenu className="text-2xl md:text-2xl" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileNavbar;
