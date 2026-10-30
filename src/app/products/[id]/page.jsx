"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { IoChevronBack } from "react-icons/io5";
import DesktopNavbar from "@/components/navbars/desktopNavbar";
import Footer from "@/components/footer";
import Image from "next/image";
import ProductCard from "@/components/reusables/ProductCard";
import RecentlyViewedProducts from "@/components/reusables/RecentlyViewedProducts";
import { addToRecentlyViewed } from "@/components/utils/recentlyViewedUtils";
import useCart from "@/core/zustand/cart.store";
import { toast } from "sonner";
import MobileNavbar from "@/components/navbars/mobileNavabr";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/core/api/api";
import { ProductServices } from "@/services/product";
import { InventoryServices, PricingServices } from "@/services/product";
import { useParams, useRouter } from "next/navigation";
import { ClipLoader } from "react-spinners";
import MeasurementFormModal from "@/components/modals/MeasurementFormModal";
import ImageCustomizationModal from "@/components/modals/ImageCustomizationModal";
import ViewCustomizationsModal from "@/components/modals/ViewCustomizationsModal";
import { CartServices } from "@/services/cart";
import useAuth from "@/core/zustand/auth.store";
import { useQueryClient } from "@tanstack/react-query";
import useUtility from "@/core/zustand/utility";
import CustomSelect from "@/components/select";
import useUtilityII from "@/core/zustand/utilityII";

const ProductDetailPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedHeight, setSelectedHeight] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSizeCustomization, setSelectedSizeCustomization] =
    useState("");
  const [selectedColorCustomization, setSelectedColorCustomization] =
    useState("");
  const [selectedFabricCustomization, setSelectedFabricCustomization] =
    useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [activeImage, setActiveImage] = useState(0);
  const [isMeasurementModalVisible, setIsMeasurementModalVisible] =
    useState(false);
  const [hasCompletedMeasurement, setHasCompletedMeasurement] = useState(false);
  const [savedMeasurementData, setSavedMeasurementData] = useState(null);
  const [isAddedToCart, setIsAddedToCart] = useState(false);
  const [
    isImageCustomizationModalVisible,
    setIsImageCustomizationModalVisible,
  ] = useState(false);
  const [customizationImages, setCustomizationImages] = useState([]);
  const [
    isViewCustomizationsModalVisible,
    setIsViewCustomizationsModalVisible,
  ] = useState(false);
  const { setTotalCartItems } = useUtility();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { customizationImagesCustom, setCustomizationImagesCustom } =
    useUtilityII();

  // Dynamic pricing: the customer picks outfit / fabric / cloth design and the
  // server returns a single total. The site never computes a price itself.
  const [pieceOption, setPieceOption] = useState(null);
  const [fabricInventoryId, setFabricInventoryId] = useState(null);
  const [clothDesign, setClothDesign] = useState(false);
  const [quote, setQuote] = useState(null);
  const [isQuoteLoading, setIsQuoteLoading] = useState(false);
  const [quoteFailed, setQuoteFailed] = useState(false);
  const [quoteRetry, setQuoteRetry] = useState(0);
  const quoteRequestId = useRef(0);

  // Mock product data - in a real app, this would come from an API
  const product = {
    id: id,
    title: "Aso Oke Bubu",
    price: "$16.00",
    mainImage: "/assets/images/ourProducts/Frame25.svg",
    thumbnails: [
      "/assets/images/ourProducts/Frame25.svg",
      "/assets/images/ourProducts/Frame26.svg",
    ],
    description:
      "Oversized bubu gown with a V-neck line and bell sleeve above the elbow, with bilateral pockets. No zipper at back or sides.",
    fabric: "Aso-Oke",
    sizes: ["XS", "S", "M", "L", "XL"],
    heights: [
      "5'0\" - 5'3\"",
      "5'4\" - 5'7\"",
      "5'8\" - 5'11\"",
      "6'0\" - 6'3\"",
    ],
    colors: ["Green", "Blue", "Red", "Yellow"],
  };

  // Similar products data
  const similarProducts = [
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

  const handleQuantityChange = (increment) => {
    const newQuantity = quantity + increment;
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
      // Reset added to cart status when quantity changes
      setIsAddedToCart(false);
    }
  };

  const handleSaveMeasurements = (measurementData) => {
    const selectedCustomizations = [];

    if (selectedColorCustomization && colorCustomization?.customizationId) {
      selectedCustomizations.push({
        productCustomizationId: colorCustomization.customizationId,
        value: selectedColorCustomization,
      });
    }

    if (selectedSizeCustomization && sizeCustomization?.customizationId) {
      selectedCustomizations.push({
        productCustomizationId: sizeCustomization.customizationId,
        value: selectedSizeCustomization,
      });
    }

    if (!isDynamic && selectedFabricCustomization && fabricCustomization?.customizationId) {
      selectedCustomizations.push({
        productCustomizationId: fabricCustomization.customizationId,
        value: selectedFabricCustomization,
      });
    }

    const measurementDataWithCustomizations = {
      ...measurementData,
      customizations: selectedCustomizations,
    };
    setSavedMeasurementData(measurementDataWithCustomizations);
    // Reset added to cart status when measurements are updated
    setIsAddedToCart(false);
  };

  const handleAddToCart = async () => {
    if (!user?.userId) {
      toast.error("Please login to add item to cart");
      return;
    }

    if (!hasCompletedMeasurement || !savedMeasurementData) {
      toast.error("Please complete measurements first");
      setIsMeasurementModalVisible(true);
      return;
    }

    try {
      const selectedCustomizations = [];

      if (selectedColorCustomization && colorCustomization?.customizationId) {
        selectedCustomizations.push({
          productCustomizationId: colorCustomization.customizationId,
          value: selectedColorCustomization,
        });
      }

      if (selectedSizeCustomization && sizeCustomization?.customizationId) {
        selectedCustomizations.push({
          productCustomizationId: sizeCustomization.customizationId,
          value: selectedSizeCustomization,
        });
      }

      if (!isDynamic && selectedFabricCustomization && fabricCustomization?.customizationId) {
        selectedCustomizations.push({
          productCustomizationId: fabricCustomization.customizationId,
          value: selectedFabricCustomization,
        });
      }

      // Use the current quantity from state, not from savedMeasurementData
      // Add customizations from product page state
      const measurementDataToSend = {
        ...savedMeasurementData,
        quantity: quantity,
        customizations: selectedCustomizations,
        // Include uploaded customization images
        customizationImages: customizationImages,
      };

      if (isDynamic) {
        measurementDataToSend.pieceOption = pieceOption;
        measurementDataToSend.fabricInventoryId = fabricInventoryId;
        measurementDataToSend.clothDesign = options?.clothDesignOffered
          ? clothDesign
          : false;
        // Only send the lock if it was issued for exactly these choices
        const quoteMatches =
          quote?.priceToken &&
          quote.pieceOption === pieceOption &&
          quote.fabricInventoryId === fabricInventoryId &&
          quote.quantity === quantity &&
          (quote.clothDesign ?? false) ===
            (options?.clothDesignOffered ? clothDesign : false);
        measurementDataToSend.priceToken = quoteMatches ? quote.priceToken : null;
      }

      const response = await CartServices.addToCart(
        measurementDataToSend,
        user?.userId
      );

      setTotalCartItems(response?.data?.totalItems);

      // Invalidate cart query to refetch cart data
      queryClient.invalidateQueries({ queryKey: ["getCart", user?.userId] });

      toast.success("Item added to cart successfully!");

      // Mark as added to cart
      setIsAddedToCart(true);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to add item to cart"
      );
      console.error("Error adding to cart:", error);
    }
  };

  // Track this product as recently viewed
  useEffect(() => {
    const productForTracking = {
      id: product.id,
      title: product.title,
      price: product.price,
      imageUrl: product.mainImage,
    };
    addToRecentlyViewed(productForTracking);
  }, [product.id, product.title, product.price, product.mainImage]);

  const productById = useQuery({
    queryKey: ["ProductById", id],
    queryFn: async () => {
      // console.log("Fetching with search:", search);
      const { data } = await ProductServices.getProductById(id);
      return data;
    },
    enabled: !!id,
    onSuccess: (data) => {
      console.log("Fetched data:", data);
      toast.success("Product fetched successfully");
    },
  });

  const result = productById.data;

  const pricingOptions = useQuery({
    queryKey: ["PricingOptions", id],
    queryFn: async () => {
      const { data } = await PricingServices.getOptions(id);
      return data;
    },
    enabled: !!id,
    retry: false,
  });

  const options = pricingOptions.data;
  const isDynamic = options?.dynamicPricing === true;

  // Seed the choices with the server defaults once the options arrive
  useEffect(() => {
    if (!options?.dynamicPricing) return;
    // Functional updates so a background refetch never resets the customer's picks
    setPieceOption(
      (prev) =>
        prev ||
        options.defaultPieceOption ||
        options.pieceOptions?.[0]?.option ||
        null
    );
    setFabricInventoryId(
      (prev) =>
        prev ??
        options.defaultFabricInventoryId ??
        options.fabrics?.[0]?.inventoryId ??
        null
    );
  }, [options]);

  // Re-quote (debounced) whenever a choice or the quantity changes. Stale
  // responses are ignored and in-flight requests aborted.
  useEffect(() => {
    if (!isDynamic || !pieceOption) return;
    const requestId = ++quoteRequestId.current;
    const controller = new AbortController();
    setIsQuoteLoading(true);

    const timer = setTimeout(async () => {
      try {
        const { data } = await PricingServices.getQuote(
          {
            productId: Number(id),
            pieceOption,
            fabricInventoryId,
            clothDesign: options?.clothDesignOffered ? clothDesign : false,
            quantity,
          },
          { signal: controller.signal }
        );
        if (requestId !== quoteRequestId.current) return;
        setQuote(data);
        setQuoteFailed(false);
        setIsQuoteLoading(false);
        // The server may resolve an unoffered choice to an offered one: adopt it
        if (data?.pieceOption && data.pieceOption !== pieceOption) {
          setPieceOption(data.pieceOption);
        }
        if (
          data?.fabricInventoryId != null &&
          data.fabricInventoryId !== fabricInventoryId
        ) {
          setFabricInventoryId(data.fabricInventoryId);
        }
        if (
          options?.clothDesignOffered &&
          typeof data?.clothDesign === "boolean" &&
          data.clothDesign !== clothDesign
        ) {
          setClothDesign(data.clothDesign);
        }
      } catch (error) {
        if (requestId !== quoteRequestId.current) return;
        if (error?.code === "ERR_CANCELED") return;
        // Keep showing the last known price; the user can retry
        setQuoteFailed(true);
        setIsQuoteLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [isDynamic, id, pieceOption, fabricInventoryId, clothDesign, quantity, quoteRetry]);

  const pieceSelectOptions = (options?.pieceOptions || []).map((item) => ({
    value: item.option,
    label: item.label,
  }));
  const fabricSelectOptions = (options?.fabrics || []).map((fabric) => ({
    value: fabric.inventoryId,
    label: fabric.name,
    imageUrl: fabric.imageUrl,
  }));
  const clothDesignSelectOptions = [
    { value: false, label: "None" },
    { value: true, label: "Add cloth design" },
  ];
  const selectedFabric = fabricSelectOptions.find(
    (option) => option.value === fabricInventoryId
  );

  // Only the single total is ever shown; fall back to the starting price until the first quote lands
  const displayedPrice = isDynamic
    ? quote?.total ?? options?.startingPrice ?? null
    : result?.price;

    const allInventory = useQuery({
      queryKey: ["AllInventory"],
      queryFn: async () => {
        const { data } = await InventoryServices.getAllInventory();
        return data;
      },
      staleTime: 5 * 60 * 1000,
    });

  const getCustomizationByKeyword = (keywords) => {
    return (
      result?.customizations?.find((customization) => {
        const descriptor = `${
          customization?.name || ""
        } ${customization?.description || ""} ${customization?.customizationType || ""}`.toLowerCase();
        return keywords.some((keyword) => descriptor.includes(keyword));
      }) || null
    );
  };

  const mapOptions = (rawValue) =>
    (rawValue || "")
      .split(",")
      .map((value) => value.trim())
      .filter((value) => value.length > 0)
      .map((value) => ({ value, label: value }));

  const colorCustomization = getCustomizationByKeyword(["color", "colour"]);
  const sizeCustomization = getCustomizationByKeyword(["size"]);
  const fabricCustomization = getCustomizationByKeyword(["fabric", "material", "textile"]);

  // Process customizations for dropdowns
  const selectCustomColor = mapOptions(colorCustomization?.customizationValue);
  const selectCustomSize = mapOptions(sizeCustomization?.customizationValue);

  const defaultFabricOptions = (
    result?.defaultFabrics || result?.productFabrics || []
  )
    .map((fabric) =>
      fabric?.materialName || fabric?.inventory?.materialName || ""
    )
    .filter((fabric) => fabric.length > 0)
    .map((fabric) => ({ value: fabric, label: fabric }));

  const fabricFromCustomization = mapOptions(
    fabricCustomization?.customizationValue
  );

  const selectFabricOptions = [
    ...fabricFromCustomization,
    ...defaultFabricOptions,
  ].filter(
    (option, index, arr) =>
      arr.findIndex((item) => item.value === option.value) === index
  );

    // All inventory items as fabric options (so user can choose any available fabric)
    const allInventoryFabricOptions = (allInventory.data || [])
      .map((item) => item?.materialName || "")
      .filter((name) => name.length > 0)
      .map((name) => ({ value: name, label: name }));

    // Merge: product-specific fabrics first (default), then all inventory fabrics
    const mergedFabricOptions = [
      ...selectFabricOptions,
      ...allInventoryFabricOptions.filter(
        (opt) => !selectFabricOptions.some((s) => s.value === opt.value)
      ),
    ];

  useEffect(() => {
    if (!isDynamic && !selectedFabricCustomization && mergedFabricOptions.length > 0) {
      setSelectedFabricCustomization(mergedFabricOptions[0].value);
    }
  }, [isDynamic, selectedFabricCustomization, mergedFabricOptions.length]);

  return (
    <>
      {productById.isLoading ? (
        <div className="flex justify-center items-center h-screen">
          <ClipLoader color="#A86746" size={40} />
        </div>
      ) : productById.isError || !result ? (
        <div className="linearGradientBackground min-h-screen">
          <div className="xl:px-[150px]">
            <DesktopNavbar textColor={`!text-black `} />
          </div>
          <MobileNavbar utilityClassName="px-6 md:px-9 lg:px-[100px]" />
          <div className="flex flex-col items-center gap-y-4 px-6 pt-32 text-center">
            <h1 className="text-2xl md:text-3xl font-bold text-black">
              This style isn&apos;t available
            </h1>
            <p className="text-black/70">
              It may have been removed or isn&apos;t on sale right now.
            </p>
            <Link href="/shop" className="text-primary underline">
              Back to the shop
            </Link>
          </div>
        </div>
      ) : (
        <div className="">
          {/* Header with Navbar */}
          <div className="linearGradientBackground  pb-12">
            <div className="xl:px-[150px]">
              <DesktopNavbar textColor={`!text-black `} />
            </div>
            <MobileNavbar utilityClassName="px-6 md:px-9 lg:px-[100px]" />
            <Link
              href="/products"
              className="px-5 md:px-8 lg:px-[150px] text-[22px] lg:text-[33px] text-primary flex gap-x-1 items-center pt-[40px] lg:pt-[70px]"
            >
              <IoChevronBack className="font-black" />
              <p>Products</p>
            </Link>
          </div>

          {/* Main Content */}

          <div className="  py-12 px-6 md:px-9 lg:px-[100px] xl:px-[150px] 2xl:px-[150px]">
            {/* Product Details */}

            <div className="flex flex-col md:flex-row md:justify-center md:items-start md:gap-x-12 lg:gap-x-16 mb-16">
              {/* Product Images */}
              <div className="space-y-4 md:w-[420px] lg:w-[500px] shrink-0">
                {/* Main Image */}
                <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg bg-[#F3E3D3]">
                  <Image
                    fill
                    sizes="(max-width: 768px) 100vw, 500px"
                    src={
                      result?.images?.[activeImage]?.imageUrl ||
                      result?.images?.[0]?.imageUrl ||
                      "/assets/images/fabric-placeholder.svg"
                    }
                    className="object-cover object-top"
                    alt={result?.name || "Product Image"}
                  />
                </div>
                {/* Thumbnail Images */}
                {result?.images?.length > 1 && (
                  <div className="grid grid-cols-5 gap-2">
                    {result.images.map((thumbnail, index) => (
                      <button
                        type="button"
                        key={index}
                        onClick={() => setActiveImage(index)}
                        className={`relative aspect-square overflow-hidden rounded-md border-2 ${
                          index === activeImage
                            ? "border-primary"
                            : "border-transparent"
                        }`}
                      >
                        <Image
                          fill
                          sizes="100px"
                          src={thumbnail.imageUrl}
                          className="object-cover object-top"
                          alt={`${result?.name} ${index + 1}`}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="pt-7 md:pt-0 space-y-5 md:w-[450px]">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-black">
                    {result?.name}
                  </h1>
                  <p
                    className={`text-xl md:text-2xl font-semibold text-primary pt-4 md:pt-6 transition-opacity ${
                      isDynamic && isQuoteLoading ? "opacity-60" : ""
                    }`}
                  >
                    {isDynamic
                      ? displayedPrice != null
                        ? `$${Number(displayedPrice).toFixed(2)}`
                        : "..."
                      : `$ ${displayedPrice}`}
                  </p>
                  {isDynamic && quoteFailed && (
                    <p className="text-xs text-gray-500 pt-1">
                      Couldn&apos;t refresh the price, showing the last known price.{" "}
                      <button
                        type="button"
                        onClick={() => setQuoteRetry((n) => n + 1)}
                        className="text-primary underline"
                      >
                        Retry
                      </button>
                    </p>
                  )}
                </div>

                <div className="">
                  <p className="text-black leading-relaxed mb-4">
                    {result?.description}
                  </p>
                  {!isDynamic && selectFabricOptions.length > 0 && (
                    <p className="text-gray-600 pt-2">
                      <strong>Fabric Type:</strong>{" "}
                      {selectFabricOptions.map((option) => option.label).join(", ")}
                    </p>
                  )}
                  {/* <p className="text-gray-600">
                    <strong>Custom sizing available</strong>
                  </p> */}
                </div>

                {isDynamic && (
                  <>
                    {pieceSelectOptions.length > 0 && (
                      <div>
                        <label className="text-base sm:text-lg font-medium text-gray-900 block">
                          Outfit
                        </label>
                        <CustomSelect
                          className="w-full"
                          options={pieceSelectOptions}
                          borderStyle={true}
                          onChange={(option) => {
                            setPieceOption(option?.value || null);
                            setIsAddedToCart(false);
                          }}
                          value={pieceSelectOptions.find(
                            (option) => option.value === pieceOption
                          )}
                        />
                      </div>
                    )}

                    {fabricSelectOptions.length > 0 && (
                      <div className="pt-4">
                        <label className="text-base sm:text-lg font-medium text-gray-900 block">
                          Fabric
                        </label>
                        <CustomSelect
                          className="w-full"
                          options={fabricSelectOptions}
                          borderStyle={true}
                          formatOptionLabel={(option) => (
                            <div className="flex items-center gap-x-2">
                              {option.imageUrl && (
                                <img
                                  src={option.imageUrl}
                                  alt=""
                                  className="w-6 h-6 rounded object-cover"
                                />
                              )}
                              <span>{option.label}</span>
                            </div>
                          )}
                          onChange={(option) => {
                            setFabricInventoryId(option?.value ?? null);
                            setIsAddedToCart(false);
                          }}
                          value={selectedFabric}
                        />
                      </div>
                    )}

                    {options?.clothDesignOffered && (
                      <div className="pt-4">
                        <label className="text-base sm:text-lg font-medium text-gray-900 block">
                          Cloth design
                        </label>
                        <CustomSelect
                          className="w-full"
                          options={clothDesignSelectOptions}
                          borderStyle={true}
                          onChange={(option) => {
                            setClothDesign(option?.value === true);
                            setIsAddedToCart(false);
                          }}
                          value={clothDesignSelectOptions.find(
                            (option) => option.value === clothDesign
                          )}
                        />
                      </div>
                    )}
                  </>
                )}

                {!isDynamic && !pricingOptions.isLoading && mergedFabricOptions.length > 0 && (
                  <div>
                    <label className="text-base sm:text-lg font-medium text-gray-900 block">
                      Available Fabric <span className="text-red-600">*</span>
                    </label>
                    <CustomSelect
                      className="w-full"
                      options={mergedFabricOptions}
                      borderStyle={true}
                      onChange={(option) => {
                        setSelectedFabricCustomization(option?.value || "");
                        setIsAddedToCart(false);
                      }}
                      value={mergedFabricOptions.find(
                        (option) => option.value === selectedFabricCustomization
                      )}
                    />
                  </div>
                )}

                {/* Size Selection */}
                <div className="pt-4">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                      Measurements <span className="text-red-600">*</span>
                    </h3>
                    <Link
                      href="/products/size-chart"
                      className="text-primary text-sm"
                    >
                      Size chart available
                    </Link>
                  </div>
                  <input
                    value={
                      hasCompletedMeasurement
                        ? "✓ Measurements Completed"
                        : selectedSize
                    }
                    onChange={(e) => setSelectedSize(e.target.value)}
                    className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-primary ${
                      hasCompletedMeasurement
                        ? "border-[#A8674699] text-primary"
                        : "border-[#A8674699]"
                    }`}
                    placeholder={
                      hasCompletedMeasurement
                        ? "Measurements completed"
                        : "Click to add measurements"
                    }
                    onClick={() => setIsMeasurementModalVisible(true)}
                    readOnly
                  />
                  {!hasCompletedMeasurement && (
                    <p className="text-sm text-red-600 mt-1">
                      ⚠️ Measurements required before adding to cart
                    </p>
                  )}
                </div>

                {/* Height Selection */}
                {/* <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    Height *
                  </h3>
                  <select
                    value={selectedHeight}
                    onChange={(e) => setSelectedHeight(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Please choose</option>
                    {product.heights.map((height) => (
                      <option key={height} value={height}>
                        {height}
                      </option>
                    ))}
                  </select>
                </div> */}

                {/* Color Selection */}
                {/* <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    Color
                  </h3>
                  <select
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Please choose</option>
                    {product.colors.map((color) => (
                      <option key={color} value={color}>
                        {color}
                      </option>
                    ))}
                  </select>
                </div> */}

                {/* Customizations */}
                {selectCustomColor.length > 0 && (
                  <div>
                    <label className="text-base sm:text-lg font-medium  text-gray-900  block">
                      {colorCustomization?.description || colorCustomization?.name} <span className="text-red-600">*</span>
                    </label>
                    <CustomSelect
                      className="w-full"
                      options={selectCustomColor}
                      borderStyle={true}
                      // textColor={true}
                      onChange={(option) => {
                        setSelectedColorCustomization(option?.value || "");
                        setIsAddedToCart(false);
                      }}
                      value={selectCustomColor.find(
                        (option) => option.value === selectedColorCustomization
                      )}
                    />
                  </div>
                )}

                {selectCustomSize.length > 0 && (
                  <div className="pt-4">
                    <label className="text-base sm:text-lg font-medium text-gray-900  block">
                      {sizeCustomization?.description || sizeCustomization?.name} <span className="text-red-600">*</span>
                    </label>
                    <CustomSelect
                      className="w-full !text-black !border-black"
                      borderStyle={true}
                      // textColor={true}
                      options={selectCustomSize}
                      onChange={(option) => {
                        setSelectedSizeCustomization(option?.value || "");
                        setIsAddedToCart(false);
                      }}
                      value={selectCustomSize.find(
                        (option) => option.value === selectedSizeCustomization
                      )}
                    />
                  </div>
                )}

                {/* Quantity Selector */}
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 pt-4">
                    Quantity
                  </h3>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleQuantityChange(-1)}
                      className="w-10 h-10 border border-[#A8674699] text-primary rounded-md flex items-center justify-center hover:bg-gray-50"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => {
                        setQuantity(parseInt(e.target.value) || 1);
                        setIsAddedToCart(false);
                      }}
                      className="w-20 h-10 border border-[#A8674699] rounded-md text-center focus:outline-none focus:ring-2 focus:ring-primary"
                      min="1"
                    />
                    <button
                      onClick={() => handleQuantityChange(1)}
                      className="w-10 h-10 border border-[#A8674699] text-primary rounded-md flex items-center justify-center hover:bg-gray-50"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Image Customization Section */}
                <div className="pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                      Image Customization
                    </h3>
                    {/* View Customizations link */}
                    {customizationImages.length > 0 && (
                      <div className="">
                        <button
                          type="button"
                          onClick={() =>
                            setIsViewCustomizationsModalVisible(true)
                          }
                          className="w-full text-primary text-sm font-medium hover:underline"
                        >
                          View Customizations ({customizationImagesCustom?.length})
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsImageCustomizationModalVisible(true)}
                    className="w-full border-2 border-dashed border-primary text-primary py-3 px-6 rounded-md font-medium hover:bg-primary/5 transition-colors"
                  >
                    + Add Image Customization
                  </button>
                </div>

                {/* Add to Cart Button */}
                <div className="pt-6">
                  { isAddedToCart ? (
                    <div className="space-y-3">
                      <button
                        disabled={!hasCompletedMeasurement}
                        onClick={() => router.push("/cart")}
                        className={`w-full ${!hasCompletedMeasurement ? "bg-gray-500" : "bg-primary"} text-white py-3 px-6 rounded-md font-semibold hover:bg-opacity-90 transition-colors`}
                      >
                        View Cart
                      </button>
                      {/* <button
                        onClick={() => setIsMeasurementModalVisible(true)}
                        className="w-full bg-gray-500 text-white py-2 px-6 rounded-md font-semibold hover:bg-opacity-90 transition-colors text-sm"
                      >
                        Update Measurements
                      </button> */}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <button
                        disabled={!hasCompletedMeasurement}
                        onClick={handleAddToCart}
                        className={`w-full ${!hasCompletedMeasurement ? "bg-gray-300 cursor-not-allowed" : "bg-primary"} text-white py-3 px-6 rounded-md font-semibold hover:bg-opacity-90 transition-colors`}
                      >
                        Add to Cart
                      </button>
                      {/* <button
                        onClick={() => setIsMeasurementModalVisible(true)}
                        className="w-full bg-gray-500 text-white py-2 px-6 rounded-md font-semibold hover:bg-opacity-90 transition-colors text-sm"
                      >
                        Update Measurements
                      </button> */}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Product Information Tabs */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-16">
              {/* Tab Navigation */}
              <div className="lg:col-span-1  shadow-xl z-1 rounded-lg py-3 px-3 border-[0.1px] border-primary">
                <div className="space-y-2">
                  <button
                    onClick={() => setActiveTab("description")}
                    className={`w-full text-left p-3 rounded-md transition-colors ${
                      activeTab === "description"
                        ? "bg-primary text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    Description
                  </button>
                  <button
                    onClick={() => setActiveTab("care")}
                    className={`w-full text-left p-3 rounded-md transition-colors ${
                      activeTab === "care"
                        ? "bg-primary text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    Care Instruction
                  </button>
                  <button
                    onClick={() => setActiveTab("information")}
                    className={`w-full text-left p-3 rounded-md transition-colors ${
                      activeTab === "information"
                        ? "bg-primary text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    Information
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="lg:col-span-3 shadow-xl z-1 rounded-lg border-[0.1px] border-primary">
                <div className="bg-white p-6 rounded-lg">
                  {activeTab === "description" && (
                    <div>
                      <p className="text-gray-600 leading-relaxed">
                        {result?.description}
                      </p>
                    </div>
                  )}
                  {activeTab === "care" && (
                    <div>
                      <p className="text-gray-600">
                        Care instructions will be displayed here.
                      </p>
                    </div>
                  )}
                  {activeTab === "information" && (
                    <div>
                      <p className="text-gray-600">
                        Additional product information will be displayed here.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recently Viewed Products */}
          </div>

          <RecentlyViewedProducts maxProducts={4} />
          {/* Footer */}
          <Footer utilityClassName="xl:px-[150px]" />
        </div>
      )}

      {/* Measurement Form Modal */}
      <MeasurementFormModal
        isVisible={isMeasurementModalVisible}
        onClose={() => setIsMeasurementModalVisible(false)}
        productId={id}
        productPrice={`$${displayedPrice}`}
        productName={result?.name}
        productImage={result?.images?.[0]?.imageUrl}
        quantity={quantity}
        onMeasurementComplete={() => setHasCompletedMeasurement(true)}
        onSave={handleSaveMeasurements}
      />

      {/* Image Customization Modal */}
      <ImageCustomizationModal
        isVisible={isImageCustomizationModalVisible}
        onClose={() => setIsImageCustomizationModalVisible(false)}
        currentImageCount={customizationImages.length}
        onUploaded={(uploadedItem) => {
          setCustomizationImages((prev) => [...prev, uploadedItem]);
          setIsAddedToCart(false);
        }}
      />

      {/* View Customizations Modal */}
      <ViewCustomizationsModal
        isVisible={isViewCustomizationsModalVisible}
        onClose={() => setIsViewCustomizationsModalVisible(false)}
        customizationImages={customizationImages}
        onDelete={(imageId) => {
          setCustomizationImagesCustom((prev) =>
            prev.filter(
              (item) => item.imageId !== imageId
            )
          );
        }}
      />
    </>
  );
};

export default ProductDetailPage;
