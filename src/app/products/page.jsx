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
import { ProductServices } from "@/services/product";

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

const ProductsPage = () => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalProducts = 40; // As shown in the image
  const productsPerPage = 16;
  const totalPages = Math.ceil(totalProducts / productsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const allProducts = useQuery({
    queryKey: ["AllProducts"],
    queryFn: async () => {
      const { data } = await ProductServices.getAllProducts();
      return data;
    },
    onSuccess: (data) => {
      console.log("Fetched data:", data);
      toast.success("Products fetched successfully");
    },
  });

  const results = allProducts.data;

  return (
    <div className="">
      <div className="  linearGradientBackground pb-12">
        <div className="xl:px-[100px]">
          <DesktopNavbar textColor={`!text-black`} />
        </div>
        <MobileNavbar utilityClassName="px-6 md:px-9 lg:px-[100px]" />
        <Link
          href="/"
          className="px-5 md:px-8 lg:px-[100px] text-[22px] lg:text-[33px] text-primary flex gap-x-1 items-center pt-[40px] lg:pt-[70px]"
        >
          <IoChevronBack className="font-black" />
          <p>Home</p>
        </Link>
      </div>

      {/* Sort by */}
      <div className="pt-[40px] md:pt-[70px] flex flex-col gap-y-3 md:gap-y-0 md:flex-row md:justify-between px-6 md:px-9 lg:px-[100px] 2xl:px-[100px] text-primary">
        <div className="text-base lg:text-xl font-light ">
          Showing 1-16 of 40 products
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
          <div className="w-full px-6 md:px-0 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5 pt-6">
            {results?.map((item) => (
              <ProductCard key={item.productId} product={item} />
            ))}
          </div>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center space-x-2 pt-[90px]">
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
      </div>

      {/* footer */}
      <div className="pt-[80px]">
        <Footer />
      </div>
    </div>
  );
};

export default ProductsPage;