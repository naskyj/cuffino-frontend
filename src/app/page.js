"use client";

import Image from "next/image";
import DesktopNavbar from "@/components/navbars/desktopNavbar";
import { Playfair_Display } from "next/font/google";
import Button from "@/components/button";
import { FaArrowRight, FaChevronLeft, FaChevronRight } from "react-icons/fa6";
import { MdOutlineMail } from "react-icons/md";
import Link from "next/link";
import Footer from "@/components/footer";
import ProductCard from "@/components/reusables/ProductCard";
import MobileNavbar from "@/components/navbars/mobileNavabr";
import CarouselField from "@/components/carousel";
import { useEffect, useState } from "react";
import SearchIcon from "@/components/reusables/searchIcon";
import { useRef } from "react";
import useUtility from "@/core/zustand/utility";
import useAuth from "@/core/zustand/auth.store";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ProductServices } from "@/services/product";
import { UserServices } from "@/services/user";
import CompleteProfilePromptModal from "@/components/modals/CompleteProfilePromptModal";

const playFair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair_display",
});

const shopCuffino = [
  {
    id: 1,
    text: "African Prints/ Fabric",
    imageUrl: "/assets/images/heroSection/Frame10.svg",
  },
  {
    id: 2,
    text: "Style",
    imageUrl: "/assets/images/heroSection/Frame11.svg",
  },
  {
    id: 3,
    text: "Sewing",
    imageUrl: "/assets/images/heroSection/Frame12.svg",
  },
  {
    id: 4,
    text: "Delivery",
    imageUrl: "/assets/images/heroSection/Frame19.svg",
  },
];

const ourCollection = [
  {
    id: 1,
    text: "Bridal Aso-Ebi",
    imageUrl: "/assets/images/homePage/ourCollection/collection1.svg",
  },
  {
    id: 2,
    text: "Traditional",
    imageUrl: "/assets/images/homePage/ourCollection/collection2.svg",
  },
  {
    id: 3,
    text: "Family Aso-Ebi",
    imageUrl: "/assets/images/homePage/ourCollection/collection3.svg",
  },
  {
    id: 4,
    text: "Prom",
    imageUrl: "/assets/images/homePage/ourCollection/collection4.svg",
  },
];

const ourProducts = [
  {
    id: 1,
    title: "Aso Oke Two-piece",
    price: "16.00",
    imageUrl: "/assets/images/ourProducts/Frame25.svg",
  },
  {
    id: 2,
    title: "Aso Oke Bubu",
    price: "16.00",
    imageUrl: "/assets/images/ourProducts/Frame26.svg",
  },
  {
    id: 3,
    title: "Adire Two-piece",
    price: "16.00",
    imageUrl: "/assets/images/ourProducts/Frame27.svg",
  },
  {
    id: 4,
    title: "Ankara Kimono",
    price: "16.00",
    imageUrl: "/assets/images/ourProducts/Frame28.svg",
  },
  {
    id: 5,
    title: "Aso Oke Two-piece",
    price: "16.00",
    imageUrl: "/assets/images/ourProducts/Frame25.svg",
  },
  {
    id: 6,
    title: "Aso Oke Bubu",
    price: "16.00",
    imageUrl: "/assets/images/ourProducts/Frame26.svg",
  },
  {
    id: 7,
    title: "Adire Two-piece",
    price: "16.00",
    imageUrl: "/assets/images/ourProducts/Frame27.svg",
  },
  {
    id: 8,
    title: "Ankara Kimono",
    price: "16.00",
    imageUrl: "/assets/images/ourProducts/Frame28.svg",
  },
  {
    id: 9,
    title: "Aso Oke Two-piece",
    price: "16.00",
    imageUrl: "/assets/images/ourProducts/Frame25.svg",
  },
  {
    id: 10,
    title: "Aso Oke Bubu",
    price: "16.00",
    imageUrl: "/assets/images/ourProducts/Frame26.svg",
  },
  {
    id: 11,
    title: "Adire Two-piece",
    price: "16.00",
    imageUrl: "/assets/images/ourProducts/Frame27.svg",
  },
  {
    id: 12,
    title: "Ankara Kimono",
    price: "16.00",
    imageUrl: "/assets/images/ourProducts/Frame28.svg",
  },
];

const testimonials = [
  {
    id: 1,
    quote:
      "Cuffino made it easy for me to get my custom trad outfit delivered here without any stress, and it was just how i wanted it. Top-notch!",
    name: "Adunni",
    location: "Houston",
    imageUrl:
      "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=400&fit=crop&crop=faces&q=80",
  },
  {
    id: 2,
    quote:
      "The fit was perfect and the fabric quality exceeded what I expected. Working with the team felt personal from start to finish.",
    name: "Chioma",
    location: "Atlanta",
    imageUrl:
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&h=400&fit=crop&crop=faces&q=80",
  },
  {
    id: 3,
    quote:
      "I ordered matching outfits for our family event and everything arrived on time, beautifully sewn. Cuffino is now my go-to.",
    name: "Kemi",
    location: "Dallas",
    imageUrl:
      "https://images.unsplash.com/photo-1589156191108-c762ff4b96ab?w=400&h=400&fit=crop&crop=faces&q=80",
  },
];

export default function Home() {
  const searchRef = useRef(null);
  const [placeholder, setPlaceholder] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const { search, setSearch } = useUtility();
  const { user, profilePromptDismissed, setProfilePromptDismissed } = useAuth();

  const router = useRouter();

  console.log(searchRef.current);

  useEffect(() => {
    const updatePlaceholder = () => {
      setPlaceholder(window.innerWidth < 1024 ? "Your Email" : "Email");
    };

    updatePlaceholder(); // Run on mount
    window.addEventListener("resize", updatePlaceholder);

    return () => window.removeEventListener("resize", updatePlaceholder);
  }, []);

  const getAllProducts = useQuery({
    queryKey: ["all_products"],
    queryFn: async () => {
      const response = await ProductServices.getAllProducts();
      return response.data;
    },
  });
  const allProducts = getAllProducts?.data;
  console.log("all products are", allProducts);

  // Check if user has delivery addresses
  const { data: addressesData, isLoading: isLoadingAddresses } = useQuery({
    queryKey: ["addresses", user?.userId],
    queryFn: async () => {
      const res = await UserServices.getUsersAddresses(user?.userId);
      return res?.data;
    },
    enabled: !!user?.userId,
  });

  // Check if user has measurements
  const { data: measurementsData, isLoading: isLoadingMeasurements } = useQuery(
    {
      queryKey: ["userMeasurements", user?.userId],
      queryFn: () => UserServices.getUserMeasurements(user?.userId),
      enabled: !!user?.userId,
    }
  );

  const hasAddress = addressesData && addressesData.length > 0;
  const hasMeasurement =
    measurementsData?.data && measurementsData.data.length > 0;

  // Show profile prompt for logged in users who haven't completed their profile
  useEffect(() => {
    if (
      user?.userId &&
      !profilePromptDismissed &&
      !isLoadingAddresses &&
      !isLoadingMeasurements
    ) {
      // Only show if user is missing address OR measurements
      const profileIncomplete = !hasAddress || !hasMeasurement;
      if (profileIncomplete) {
        // Small delay to ensure page loads first
        const timer = setTimeout(() => {
          setShowProfilePrompt(true);
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [
    user?.userId,
    profilePromptDismissed,
    hasAddress,
    hasMeasurement,
    isLoadingAddresses,
    isLoadingMeasurements,
  ]);

  const handleSkipProfilePrompt = () => {
    setProfilePromptDismissed(true);
    setShowProfilePrompt(false);
  };

  const handleCloseProfilePrompt = () => {
    setShowProfilePrompt(false);
  };

  const activeTestimonial = testimonials[testimonialIndex];
  const testimonialCount = testimonials.length;
  const goPrevTestimonial = () =>
    setTestimonialIndex((i) => (i - 1 + testimonialCount) % testimonialCount);
  const goNextTestimonial = () =>
    setTestimonialIndex((i) => (i + 1) % testimonialCount);

  useEffect(() => {
    const intervalMs = 6000;
    const id = setInterval(() => {
      setTestimonialIndex((i) => (i + 1) % testimonialCount);
    }, intervalMs);
    return () => clearInterval(id);
  }, [testimonialCount]);

  useEffect(() => {
    const scrollThresholdPx = 200;
    const onScroll = () => {
      setShowBackToTop(window.scrollY > scrollThresholdPx);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="">
      <MobileNavbar utilityClassName="px-6" />

      <div className="xl:bg-hero">
        <div className=" relative lg:px-[100px] bg-black/50  2xl:px-[100px]  bg-center bg-cover bg-no-repeat  xl:h-screen w-screen ">
          <DesktopNavbar isLogoBlack={false} />

          {/* hero */}
          <div className=" hidden  xl:flex flex-col items-center justify-center h-full -mt-[100px] gap-y-12">
            <div
              className={`${playFair.className} text-center leading-tight font-[500] text-[40px] text-white flex flex-col items-center`}
            >
              <h2 className="uppercase">
                YOUR CULTURE. YOUR FIT. <br /> PERFECTLY TAILORED IN NIGERIA,{" "}
                <br /> DELIVERED TO YOU
              </h2>
            </div>
            <div className="flex justify-center">
              <Link href="/shop">
                <button
                  type="button"
                  className="bg-white text-[#A86746] flex items-center px-4 py-2 text-lg rounded-lg gap-2"
                >
                  <p>Start Custom Order</p>
                  <FaArrowRight className="text-base" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* mobile search bar */}
      <div className="px-6 pt-6 xl:hidden relative">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          ref={searchRef}
          placeholder={!isFocused ? "Search within Cuffino" : ""}
          className={`border w-full placeholder:text-sm placeholder:text-[#757575] placeholder:font-[300] placeholder:pl-0 p-2 pl-10 rounded-[20px]`}
          // onFocus={() => setIsFocused(true)}
          // onBlur={() => setIsFocused(false)}
        />
        {!isFocused && (
          <button
            aria-label="Search Icon"
            className="absolute translate-y-[10px] left-9"
          >
            <SearchIcon />
          </button>
        )}
        <button
          className="absolute right-8 translate-y-[6px]"
          aria-label="Search Button"
          onClick={() => {
            if (search.length > 3) {
              router.push(`/shop?search=${search}`);
            }
          }}
        >
          <div className="flex items-center justify-center rounded-[30px] p-2 bg-black">
            <FaArrowRight className="text-sm text-white" />
          </div>
        </button>
      </div>

      {/* mobile hero */}
      <div className="px-6 pt-9 xl:hidden">
        <div className=" xl:hidden bg-hero rounded-md bg-center bg-cover bg-no-repeat w-full h-[260px] md:h-[450px]">
          <div className="flex flex-col items-center justify-center h-full gap-y-5">
            <div
              className={`${playFair.className} leading-tight font-[500] text-xl md:text-3xl text-white flex flex-col items-center`}
            >
              <h2 className="uppercase">
                YOUR CULTURE. YOUR FIT. <br /> PERFECTLY TAILORED IN NIGERIA,{" "}
                <br /> DELIVERED TO YOU
              </h2>
            </div>
            <div className="flex justify-center">
              <Link href="/shop">
                <button
                  type="button"
                  className="bg-white text-[#A86746] flex items-center px-4 py-2 text-sm rounded-lg gap-2"
                >
                  <p>Start Custom Order</p>
                  <FaArrowRight className="text-base" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* shop cuffino */}
      <div className=" md:px-[100px] px-5 lg:px-[100px] 2xl:px-[100px] py-[40px] lg:py-[70px]">
        <div className=" flex flex-col justify-center items-center">
          <h3 className="text-primary text-xl md:text-2xl lg:text-3xl font-semibold">
            Shop Cuffino
          </h3>
          <p className="text-sm md:text-base mx-auto max-w-[960px] lg:text-lg pt-4 lg:pt-6 text-center">
            At Cuffino, we offer you authentic African styles sewn just for you.
            Made for anyone in the US who values authentic, custom African
            fashion crafted by expert Nigerian tailors
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 items-center justify-center md:justify-evenly lg:space-y-8 lg:pt-6 lg:pt-12 gap-x-8">
          {shopCuffino.map((item) => (
            <div
              className={`${
                item?.id % 2 === 0 ? " mt-[100px] lg:mt-0" : ""
              } cursor-pointer flex flex-col justify-center items-center relative`}
              key={item.id}
            >
              <div className="">
                <Image
                  height={0}
                  width={0}
                  src={`${item?.imageUrl}`}
                  className="w-[110px] h-auto md:w-[140px] lg:w-auto lg:h-full"
                  alt=""
                />
                {item?.id === 2 && (
                  <Image
                    height={0}
                    width={0}
                    src="/assets/images/homePage/arrows/Arrow1.svg"
                    className="block md:hidden w-[70px] h-auto absolute -top-[25px] -left-[45px]"
                    alt=""
                  />
                )}
                {item?.id === 2 && (
                  <Image
                    height={0}
                    width={0}
                    src="/assets/images/homePage/arrows/Arrow2.svg"
                    className="block md:hidden w-[95px] h-auto absolute top-[140px] -rotate-12 -left-[55px]"
                    alt=""
                  />
                )}
                {item?.id === 4 && (
                  <Image
                    height={0}
                    width={0}
                    src="/assets/images/homePage/arrows/Arrow3.svg"
                    className="block md:hidden w-[65px] h-auto absolute top-[55px]  -left-[60px]"
                    alt=""
                  />
                )}
              </div>
              <p className="text-sm lg:text-xl pt-4">{item?.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* our collection */}
      <div className="pt-8">
        <div className="bg-primary w-screen px-6 pt-[50px] lg:pt-[90px] pb-[90px] lg:pb-[130px]">
          <div className="text-white flex flex-col justify-center items-center gap-y-5">
            <h3 className="font-semibold text-xl md:text-2xl lg:text-3xl">
              Our Collection
            </h3>
            <div className="flex flex-col text-sm md:text-base lg:text-lg font-light items-center leading-snug">
              <p className="text-center md:px-6 px-0 lg:px-0">
                Explore our curated collections designed to elevate every moment
                . <br className="hidden lg:block" /> Let Cuffino help you bring
                your style to life with timeless pieces that celebrate culture,
                heritage, and contemporary style.
              </p>
            </div>
          </div>
          <div className="flex flex-col justify-center items-center gap-y-[100px] pt-[90px]">
            {ourCollection.map((item) => (
              <div className="flex flex-col items-center gap-y-4" key={item.id}>
                <div className="">
                  <Image
                    height={0}
                    width={0}
                    src={`${item?.imageUrl}`}
                    className="w-[260px] md:w-[390px] lg:w-[450px] h-auto xl:w-auto xl:h-[80%]"
                    alt=""
                  />
                </div>
                <div className="flex flex-col">
                  <p>
                    <Link
                      href=""
                      className="  text-white text-base lg:text-2xl"
                    >
                      {item?.text}
                    </Link>
                  </p>
                  <div className="h-[1px] lg:h-[1.3px] bg-white -mt-1"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Our Products */}
      <div className="hidden lg:block pt-[80px] md:px-[100px] xl:px-[100px] 2xl:px-[100px]">
        <div className=" flex flex-col justify-center items-center gap-y-6">
          <h3 className="text-primary text-3xl font-semibold">Our Products</h3>
          <p className="text-lg">
            At Cuffino, we offer you authentic African prints sewn just for you
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5 pt-6">
            {allProducts?.map((item) => (
              <ProductCard key={item?.productId} product={item} />
            ))}
          </div>
        </div>
      </div>

      {/* Our Products mobile/tab with carousel*/}
      <div className=" lg:px-0 lg:hidden pt-[50px]">
        <div className="px-6 flex flex-col items-center justify-center items-center gap-y-4">
          <h3 className="text-primary text-xl md:text-2xl font-semibold">
            Our Products
          </h3>
          <p className="text-sm md:text-base text-center">
            At Cuffino, we offer you authentic African styles
            <br className="md:hidden" /> sewn just for you
          </p>
        </div>

        <CarouselField products={allProducts} />
      </div>

      {/* Signup for new collections */}
      <div className="bg-primary w-screen mt-[70px] py-[40px] lg:py-[75px] px-6 lg:px-0">
        <div className="flex flex-col justify-center items-center">
          <p className="text-white text-2xl lg:text-3xl font-semibold pb-4">
            Be the first to know!
          </p>
          <p className="text-white lg:text-lg text-center lg:text-left">
            Sign up and be on our list for new collections
            <br className="md:hidden" /> and exclusive offers
          </p>
          <div className="relative space-y-9 w-full ">
            <div className=" pt-8 flex justify-center">
              <input
                placeholder={placeholder}
                className="px-3 py-5 md:px-5 md:py-5 border flex justify-center items-center border-white md:border-0 bg-primary md:bg-white w-full md:max-w-[560px] placeholder:text-[#EBF0F94D] placeholder:md:text-[#94A3B8] text-white placeholder:font-light  placeholder:text-base placeholder:pl-0 placeholder:md:pl-4  rounded-md"
              />
              <div className="absolute -translate-x-[257px] translate-y-[23px] text-[#94A3B8]">
                <MdOutlineMail className="text-lg hidden lg:block" />
              </div>
            </div>
            <div className="flex justify-center ">
              <button
                type="button"
                className="bg-white md:bg-[#F9E6D0] text-black md:text-primary flex justify-center items-center w-full md:max-w-[150px] items-center px-4 py-3 lg:py-2 text-sm lg:text-lg rounded-md gap-2 font-medium lg:font-normal"
              >
                <p>Subscribe</p>
                <FaArrowRight className="text-base hidden md:block" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <section className="bg-white py-[40px] md:py-[80px] px-6 md:px-[100px] lg:px-[100px] 2xl:px-[100px]">
        <h2
          className={`${playFair.className} text-left text-xl md:text-2xl lg:text-3xl font-medium text-primary`}
        >
          Loved by Customers Across the US
        </h2>
        <div className="mt-4 h-px w-full bg-[#E5E5E5]" aria-hidden />

        <div className="mt-10 flex flex-col gap-8 md:flex-row md:items-stretch md:gap-12 lg:gap-16">
          <div className="relative mx-auto aspect-square w-full max-w-[280px] shrink-0 overflow-hidden bg-[#E8D5C4] md:mx-0 md:max-w-[200px]">
            <Image
              src={activeTestimonial.imageUrl}
              alt={`${activeTestimonial.name}, ${activeTestimonial.location}`}
              fill
              sizes="(max-width: 560px) 200px, 200px"
              className="object-cover"
            />
          </div>
          <div className="flex min-h-0 flex-1 flex-col justify-center">
            <blockquote className="text-base leading-relaxed max-w-[750px] text-[#333] md:text-lg lg:text-xl">
              <span className="font-light italic">
                &ldquo;{activeTestimonial.quote}&rdquo;
              </span>
            </blockquote>
            <p className="mt-6 text-sm font-semibold text-primary md:text-base">
              — {activeTestimonial.name}, {activeTestimonial.location}
            </p>
          </div>
        </div>

        <div
          className="mt-10 flex justify-center gap-2"
          role="tablist"
          aria-label="Testimonial slides"
        >
          {testimonials.map((_, i) => (
            <button
              key={testimonials[i].id}
              type="button"
              role="tab"
              aria-selected={i === testimonialIndex}
              aria-label={`Show testimonial ${i + 1} of ${testimonialCount}`}
              onClick={() => setTestimonialIndex(i)}
              className={`h-2.5 w-2.5 rounded-full transition-colors ${
                i === testimonialIndex ? "bg-[#333]" : "bg-[#D1D1D1]"
              }`}
            />
          ))}
        </div>

        <p className="mt-12 text-center text-sm italic text-primary md:text-base">
          Real people. Real fits. Real heritage.
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            aria-label="Previous testimonial"
            onClick={goPrevTestimonial}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E0E0E0] bg-white text-[#333] transition hover:bg-[#FAFAFA]"
          >
            <FaChevronLeft className="text-sm" />
          </button>
          <button
            type="button"
            aria-label="Next testimonial"
            onClick={goNextTestimonial}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E0E0E0] bg-white text-[#333] transition hover:bg-[#FAFAFA]"
          >
            <FaChevronRight className="text-sm" />
          </button>
        </div>
      </section>

      {showBackToTop && (
        <button
          type="button"
          onClick={() =>
            window.scrollTo({ top: 0, left: 0, behavior: "smooth" })
          }
          className="fixed bottom-6 right-6 z-50 flex items-center gap-1 rounded-md bg-white/95 px-3 py-2 text-sm text-primary shadow-md ring-1 ring-black/5 backdrop-blur-sm transition hover:bg-white hover:underline md:bottom-8 md:right-8"
          aria-label="Back to top"
        >
          Back to Top
          <span aria-hidden className="text-base leading-none">
            ↑
          </span>
        </button>
      )}

      <Footer />

      {/* Profile Completion Prompt Modal */}
      <CompleteProfilePromptModal
        isVisible={showProfilePrompt}
        onClose={handleCloseProfilePrompt}
        hasAddress={hasAddress}
        hasMeasurement={hasMeasurement}
        onSkip={handleSkipProfilePrompt}
      />
    </div>
  );
}
