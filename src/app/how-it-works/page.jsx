"use client";

import Image from "next/image";
import { Playfair_Display } from "next/font/google";
import DesktopNavbar from "@/components/navbars/desktopNavbar";
import MobileNavbar from "@/components/navbars/mobileNavabr";
import Footer from "@/components/footer";
import Link from "next/link";
import { FaArrowRight } from "react-icons/fa6";

const playFair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair_display",
});

const steps = [
  {
    id: 1,
    title: "Share Your Measurements",
    description:
      "Enter your exact body measurements using our easy-to-follow guide. This ensures your garment is tailored to fit you perfectly—no guessing, no standard sizes.",
    icon: "/assets/images/howItworks/measure.svg",
  },
  {
    id: 2,
    title: "Choose Your Fabric",
    description:
      "Browse our curated collection of high-quality fabrics sourced from trusted suppliers. From bold prints to elegant solids, select the fabric that best matches your style.",
    icon: "/assets/images/howItworks/fabric.svg",
  },
  {
    id: 3,
    title: "Select Your Style",
    description:
      "Pick from a wide range of modern and traditional designs, or customize a look that's uniquely yours.",
    icon: "/assets/images/howItworks/select.svg",
  },
  {
    id: 4,
    title: "Crafted by Skilled Nigerian Tailors",
    description:
      "Your order is assigned to an experienced tailor in Nigeria who brings your vision to life with expert craftsmanship and attention to detail.",
    icon: "/assets/images/howItworks/tailor.svg",
  },
  {
    id: 5,
    title: "Shipped to Your Doorstep",
    description:
      "Once complete, your custom garment is carefully packaged and shipped directly to your doorstep.",
    icon: "/assets/images/howItworks/shipped.svg",
  },
];

const badges = [
  {
    id: 1,
    title: "HANDMADE WITH CARE",
    icon: "/assets/images/homePage/productQualities/Frame41.svg",
  },
  {
    id: 2,
    title: "SUSTAINABLY SOURCED",
    icon: "/assets/images/homePage/productQualities/Frame42.svg",
  },
  {
    id: 3,
    title: "ETHICALLY TAILORED IN NIGERIA",
    icon: "/assets/images/homePage/productQualities/Frame43.svg",
  },
  {
    id: 4,
    title: "ORGANIC COTTON",
    icon: "/assets/images/homePage/productQualities/Frame44.svg",
  },
];

const productQualities = [
  {
    id: 1,
    imageUrl: "/assets/images/homePage/productQualities/Frame41.svg",
  },
  {
    id: 2,
    imageUrl: "/assets/images/homePage/productQualities/Frame42.svg",
  },
  {
    id: 3,
    imageUrl: "/assets/images/homePage/productQualities/Frame43.svg",
  },
  {
    id: 4,
    imageUrl: "/assets/images/homePage/productQualities/Frame44.svg",
  },
];

export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-white">
      <header className=" linearGradientBackground pb-12">
        <div className="xl:px-[100px]">
          <DesktopNavbar textColor={`!text-black`} />
        </div>
        <MobileNavbar utilityClassName="px-6  md:px-9 lg:px-[100px] " />
        <Link
          href="/how-it-works"
          className="  text-[24px] md:text-[30px] lg:text-[33px] text-primary flex justify-center items-center pt-[40px] lg:pt-[70px]"
        >
          <p className="text-center">How it Works</p>
        </Link>
      </header>

      {/* Header Section */}
      <div className="px-6 md:px-[100px] lg:px-[100px] 2xl:px-[100px] pt-[40px] md:pt-[60px] lg:pt-[80px] pb-[40px] md:pb-[60px]">
        <div className="flex flex-col items-center justify-center text-center">
          <h1
            className={`${playFair.className} text-[32px] md:text-[48px] lg:text-[56px] font-medium text-[#A86746] leading-tight mb-4`}
          >
            Custom Fit For Now
          </h1>
          <p className="text-base md:text-lg lg:text-xl text-[#A86746] font-normal">
            Easy. Custom. Just for you
          </p>
        </div>
      </div>

      {/* Main Content Section */}
      <div className="px-6 md:px-[100px] lg:px-[100px] 2xl:px-[100px] pb-[60px] md:pb-[80px] lg:pb-[100px]">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 xl:gap-16">
          {/* Left Side - Visual Elements */}
          <div className="flex-1 flex flex-col gap-6 lg:gap-8">
            {/* Style Image */}
            <Image
              src="/assets/images/how-it-works.png"
              alt="How it Works"
              width={500}
              height={500}
            />
          </div>

          {/* Right Side - Steps */}
          <div className="flex-1 flex flex-col gap-6 md:gap-8 lg:gap-10">
            {steps.map((step, index) => (
              <div key={step.id} className="flex gap-4 md:gap-6">
                {/* Icon */}
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 flex items-center justify-center">
                    <Image
                      src={step.icon}
                      alt={`${step.title} icon`}
                      width={48}
                      height={48}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="text-[#A86746] font-semibold text-lg md:text-xl lg:text-2xl mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-700 text-sm md:text-base lg:text-lg leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section - Five Images Grid and Text Banner */}
      <div className="px-6 md:px-[100px] lg:px-[100px] 2xl:px-[100px] pb-[60px] md:pb-[80px]">
        {/* Five Images Grid - 3 on top, 2 on bottom */}
        <div className="mb-8 md:mb-12">
          {/* Top Row - 3 Images */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6">
            <div className="relative group overflow-hidden rounded-lg shadow-lg">
              <Image
                src="/assets/images/howItworks/measure.png"
                alt="Person measuring with tape"
                width={1000}
                height={1000}
                className="w-full h-[250px] md:h-[300px] object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="relative group overflow-hidden rounded-lg shadow-lg">
              <Image
                src="/assets/images/howItworks/fabric.png"
                alt="Stacked colorful fabrics"
                width={1000}
                height={1000}
                className="w-full h-[250px] md:h-[300px] object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="relative group overflow-hidden rounded-lg shadow-lg">
              <Image
                src="/assets/images/howItworks/select.png"
                alt="Person in styled garment"
                width={1000}
                height={1000}
                className="w-full h-[250px] md:h-[300px] object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          </div>

          {/* Bottom Row - 2 Images */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="relative group overflow-hidden rounded-lg shadow-lg">
              <Image
                src="/assets/images/howItworks/tailor.png"
                alt="Skilled Nigerian tailor crafting garment"
                width={1000}
                height={1000}
                className="w-full h-[300px] md:h-[400px] object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="relative group overflow-hidden rounded-lg shadow-lg">
              <Image
                src="/assets/images/howItworks/shipped.png"
                alt="Delivery person shipping packages"
                width={600}
                height={400}
                className="w-full h-[300px] md:h-[400px] object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          </div>
        </div>
        <div className="my-12 mb-24 flex justify-center">
          <Link
            href="/shop"
            className="group inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-4 text-base font-medium text-white shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-[#8f5539] hover:shadow-md active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <span>Start Custom Order</span>
            <FaArrowRight
              className="text-base transition-transform duration-200 ease-out group-hover:translate-x-1"
              aria-hidden
            />
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
