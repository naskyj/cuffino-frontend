"use client";

import Link from "next/link";
import Footer from "@/components/footer";
import Image from "next/image";
import DesktopNavbar from "@/components/navbars/desktopNavbar";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";
import CustomSelect from "@/components/select";
import { useState } from "react";
import MobileNavbar from "@/components/navbars/mobileNavabr";
import ProductCard from "@/components/reusables/ProductCard";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/core/api/api";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ProductServices } from "@/services/product";
import { ClipLoader } from "react-spinners";

const filterCategories = [
  { label: "Popular", value: "popular" },
  { label: "Most Bought", value: "most_bought" },
];

const ourProducts = [
  {
    id: 1,
    title: "Aso Oke Two-piece",
    price: "$16.00",
    imageUrl: "/assets/images/ourProducts/Frame25.svg",
  },
  {
    id: 2,
    title: "Aso Oke Bubu",
    price: "$16.00",
    imageUrl: "/assets/images/ourProducts/Frame26.svg",
  },
  {
    id: 3,
    title: "Adire Two-piece",
    price: "$16.00",
    imageUrl: "/assets/images/ourProducts/Frame27.svg",
  },
  {
    id: 4,
    title: "Ankara Kimono",
    price: "$16.00",
    imageUrl: "/assets/images/ourProducts/Frame28.svg",
  },
  {
    id: 5,
    title: "Aso Oke Two-piece",
    price: "$16.00",
    imageUrl: "/assets/images/ourProducts/Frame25.svg",
  },
  {
    id: 6,
    title: "Aso Oke Bubu",
    price: "$16.00",
    imageUrl: "/assets/images/ourProducts/Frame26.svg",
  },
  {
    id: 7,
    title: "Adire Two-piece",
    price: "$16.00",
    imageUrl: "/assets/images/ourProducts/Frame27.svg",
  },
  {
    id: 8,
    title: "Ankara Kimono",
    price: "$16.00",
    imageUrl: "/assets/images/ourProducts/Frame28.svg",
  },
  {
    id: 9,
    title: "Aso Oke Two-piece",
    price: "$16.00",
    imageUrl: "/assets/images/ourProducts/Frame25.svg",
  },
  {
    id: 10,
    title: "Aso Oke Bubu",
    price: "$16.00",
    imageUrl: "/assets/images/ourProducts/Frame26.svg",
  },
  {
    id: 11,
    title: "Adire Two-piece",
    price: "$16.00",
    imageUrl: "/assets/images/ourProducts/Frame27.svg",
  },
  {
    id: 12,
    title: "Ankara Kimono",
    price: "$16.00",
    imageUrl: "/assets/images/ourProducts/Frame28.svg",
  },
];

const Shop = () => {
  const [currentPage, setCurrentPage] = useState(1);

  const searchParams = useSearchParams();
  const search = searchParams.get("search");
  const category = searchParams.get("category");
  const totalProducts = 40; // As shown in the image
  const productsPerPage = 16;
  const totalPages = Math.ceil(totalProducts / productsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const searchedProducts = useQuery({
    queryKey: ["SearchedProducts", search, category],
    queryFn: async () => {
      console.log("Fetching with search:", search);
      const { data } = await ProductServices.searchProducts({
        name: search,
        category,
      });
      return data;
    },
    // enabled: !!search || !!category, // ensure query only runs when search param exists
    onSuccess: (data) => {
      console.log("Fetched data:", data);
      toast.success("Products fetched successfully");
    },
  });

  const results = searchedProducts.data;
  return (
    <>
      {searchedProducts.isLoading ? (
        <div className="flex justify-center items-center h-screen">
          <ClipLoader color="#A86746" size={40} />
        </div>
      ) : (
        <div className="">
          <div className=" linearGradientBackground pb-12">
            <div className="xl:px-[100px]">
              <DesktopNavbar textColor={`!text-black`} />
            </div>
            <MobileNavbar utilityClassName="px-6  md:px-9 lg:px-[100px] " />
            <Link
              href="/shop"
              className="px-5 md:px-8 lg:px-[100px] text-[22px] lg:text-[33px] text-primary flex gap-x-1 items-center pt-[40px] lg:pt-[70px]"
            >
              <IoChevronBack className="font-black" />
              <p>Shop</p>
            </Link>
          </div>

          {/* Sort by */}
          <div className="pt-[40px] md:pt-[70px] flex flex-col gap-y-3 md:gap-y-0 md:flex-row md:justify-between px-6 md:px-9 lg:px-[100px] 2xl:px-[100px] text-primary">
            <div className="text-base lg:text-xl font-light ">
              Showing results for {search ? `"${search}"` : category || "all products"}
            </div>
            <div className="flex items-center gap-x-2">
              <p className="text-base lg:text-lg font-light pt-1 md:pt-0">
                Sort by:
              </p>
              <div className="">
                <CustomSelect
                  placeholder="Featured"
                  options={filterCategories}
                  width="170px"
                />
              </div>
            </div>
          </div>

          {/* products */}
          <div className="w-full pt-7 md:px-9 lg:px-[100px] 2xl:px-[100px]">
            <div className=" flex flex-col justify-center items-center">
              {!results || results.length === 0 ? (
                <div className="w-full px-6 md:px-0 py-16 text-center">
                  <div className="max-w-md mx-auto">
                    <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg
                        className="w-12 h-12 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      No items found
                    </h3>
                    <p className="text-gray-500">
                      {search
                        ? `We couldn't find any products matching "${search}". Try adjusting your search terms.`
                        : "We couldn't find any products. Please try a different category or filter."}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="w-full px-6 md:px-0 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5 pt-6">
                  {results.map((item) => (
                    <ProductCard key={item?.productId} product={item} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Pagination */}
          {/* <div className="flex justify-center items-center space-x-2 pt-[90px]">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <IoChevronBack className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentPage === page
                    ? "bg-[#F9E6D0] text-primary"
                    : "border border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <IoChevronForward className="w-4 h-4" />
            </button>
          </div> */}

          {/* footer */}
          <div className="pt-[80px]">
            <Footer />
          </div>
        </div>
      )}
    </>
  );
};

export default Shop;
