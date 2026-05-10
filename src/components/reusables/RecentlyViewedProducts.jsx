import React, { useState, useEffect } from "react";
import ProductCard from "./ProductCard";
import { ProductServices } from "@/services/product";
import { useQuery } from "@tanstack/react-query";

const RecentlyViewedProducts = ({ maxProducts = 4 }) => {
  const [recentlyViewed, setRecentlyViewed] = useState([]);

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

  useEffect(() => {
    // Get recently viewed products from localStorage
    const stored = localStorage.getItem("recentlyViewedProducts");
    if (stored) {
      const products = JSON.parse(stored);
      setRecentlyViewed(products.slice(0, maxProducts));
    }
  }, [maxProducts]);

  // If no recently viewed products, show some default products
  const defaultProducts = [
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
  ];

  const productsToShow =
    recentlyViewed.length > 0 ? recentlyViewed : defaultProducts;

  if (productsToShow.length === 0) {
    return null;
  }

  return (
    <div className="mb-16 flex flex-col items-center justify-center md:px-[100px] lg:px-[100px] xl:px-[150px] 2xl:px-[100px]">
      <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
        {/* {recentlyViewed.length > 0
          ? "Recently Viewed Products"
          : "Popular Products"} */}
          Popular Products
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {results?.map((product) => (
          <ProductCard key={product?.productId} product={product} />
        ))}
      </div>
    </div>
  );
};

export default RecentlyViewedProducts;
