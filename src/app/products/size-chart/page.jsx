"use client";

import React from "react";
import Link from "next/link";
import { Playfair_Display } from "next/font/google";
import { FiArrowLeft } from "react-icons/fi";
import DesktopNavbar from "@/components/navbars/desktopNavbar";
import Footer from "@/components/footer";
import { IoChevronBack } from "react-icons/io5";
import MobileNavbar from "@/components/navbars/mobileNavabr";
import { useRouter } from "next/navigation";

const playFair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair_display",
});

const SizeChartPage = () => {
  const router = useRouter();
  const womenSizes = [
    {
      size: "XS",
      bust: "32-34",
      waist: "26-28",
      hips: "36-38",
      length: "38-40",
    },
    {
      size: "S",
      bust: "34-36",
      waist: "28-30",
      hips: "38-40",
      length: "40-42",
    },
    {
      size: "M",
      bust: "36-38",
      waist: "30-32",
      hips: "40-42",
      length: "42-44",
    },
    {
      size: "L",
      bust: "38-40",
      waist: "32-34",
      hips: "42-44",
      length: "44-46",
    },
    {
      size: "XL",
      bust: "40-42",
      waist: "34-36",
      hips: "44-46",
      length: "46-48",
    },
    {
      size: "XXL",
      bust: "42-44",
      waist: "36-38",
      hips: "46-48",
      length: "48-50",
    },
  ];

  const menSizes = [
    {
      size: "S",
      chest: "36-38",
      waist: "30-32",
      hips: "38-40",
      length: "40-42",
    },
    {
      size: "M",
      chest: "38-40",
      waist: "32-34",
      hips: "40-42",
      length: "42-44",
    },
    {
      size: "L",
      chest: "40-42",
      waist: "34-36",
      hips: "42-44",
      length: "44-46",
    },
    {
      size: "XL",
      chest: "42-44",
      waist: "36-38",
      hips: "44-46",
      length: "46-48",
    },
    {
      size: "XXL",
      chest: "44-46",
      waist: "38-40",
      hips: "46-48",
      length: "48-50",
    },
  ];

  return (
    <div className="">
      {/* Header with Navbar */}
      <div className=" linearGradientBackground  pb-12">
        <div className="xl:px-[100px]">
          <DesktopNavbar textColor={`!text-black`} />
        </div>
        <MobileNavbar utilityClassName="px-6  md:px-9 lg:px-[100px] " />
        <div className=" pt-[70px] px-6 md:px-9 lg:px-[100px] ">
          <h3 className="text-primary text-[22px] md:text-[33px]">
            Size / Measurement Chart
          </h3>
          <button
            type="button"
            onClick={() => router.back()}
            className="flex gap-x-1 items-center"
          >
            <IoChevronBack className="font-black" />
            <p>Back</p>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className=" min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:px-[100px] 2xl:px-[100px]">
          {/* Header Section */}

          {/* Women's Size Chart */}
          <div className="bg-white rounded-lg shadow-sm py-6 mb-8">
            <h2
              className={`${playFair.className} text-2xl md:text-3xl font-semibold text-gray-900 mb-8`}
            >
              Women's Size Chart
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-2 md:px-6 py-4 text-left font-semibold text-gray-900">
                      Size
                    </th>
                    <th className="border border-gray-300 px-2 md:px-6 py-4 text-left font-semibold text-gray-900">
                      Bust (inches)
                    </th>
                    <th className="border border-gray-300 px-2 md:px-6 py-4 text-left font-semibold text-gray-900">
                      Waist (inches)
                    </th>
                    <th className="border border-gray-300 px-2 md:px-6 py-4 text-left font-semibold text-gray-900">
                      Hips (inches)
                    </th>
                    <th className="border border-gray-300 px-2 md:px-6 py-4 text-left font-semibold text-gray-900">
                      Length (inches)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {womenSizes.map((item, index) => (
                    <tr
                      key={index}
                      className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      <td className="border border-gray-300 px-2 md:px-6 py-4 font-medium text-gray-900">
                        {item.size}
                      </td>
                      <td className="border border-gray-300 px-2 md:px-6 py-4 text-gray-700">
                        {item.bust}
                      </td>
                      <td className="border border-gray-300 px-2 md:px-6 py-4 text-gray-700">
                        {item.waist}
                      </td>
                      <td className="border border-gray-300 px-2 md:px-6 py-4 text-gray-700">
                        {item.hips}
                      </td>
                      <td className="border border-gray-300 px-2 md:px-6 py-4 text-gray-700">
                        {item.length}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Men's Size Chart */}
          <div className="bg-white rounded-lg shadow-sm py-6 mb-8">
            <h2
              className={`${playFair.className} text-2xl md:text-3xl font-semibold text-gray-900 mb-8`}
            >
              Men's Size Chart
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-2 md:px-6 py-4 text-left font-semibold text-gray-900">
                      Size
                    </th>
                    <th className="border border-gray-300 px-2 md:px-6 py-4 text-left font-semibold text-gray-900">
                      Chest (inches)
                    </th>
                    <th className="border border-gray-300 px-2 md:px-6 py-4 text-left font-semibold text-gray-900">
                      Waist (inches)
                    </th>
                    <th className="border border-gray-300 px-2 md:px-6 py-4 text-left font-semibold text-gray-900">
                      Hips (inches)
                    </th>
                    <th className="border border-gray-300 px-2 md:px-6 py-4 text-left font-semibold text-gray-900">
                      Length (inches)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {menSizes.map((item, index) => (
                    <tr
                      key={index}
                      className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      <td className="border border-gray-300 px-2 md:px-6 py-4 font-medium text-gray-900">
                        {item.size}
                      </td>
                      <td className="border border-gray-300 px-2 md:px-6 py-4 text-gray-700">
                        {item.chest}
                      </td>
                      <td className="border border-gray-300 px-2 md:px-6 py-4 text-gray-700">
                        {item.waist}
                      </td>
                      <td className="border border-gray-300 px-2 md:px-6 py-4 text-gray-700">
                        {item.hips}
                      </td>
                      <td className="border border-gray-300 px-2 md:px-6 py-4 text-gray-700">
                        {item.length}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Measurement Guide */}
          <div className="bg-white rounded-lg shadow-sm py-8">
            <h2
              className={`${playFair.className} text-3xl font-semibold text-gray-900 mb-6`}
            >
              MEASUREMENT GUIDE
            </h2>
            <div className="space-y-4 text-gray-700">
              <div className="flex items-start">
                <span className="text-orange-500 mr-3 mt-1">•</span>
                <p>
                  <strong>Bust/Chest:</strong> Measure around the fullest part
                  of your bust/chest, keeping the tape horizontal.
                </p>
              </div>
              <div className="flex items-start">
                <span className="text-orange-500 mr-3 mt-1">•</span>
                <p>
                  <strong>Waist:</strong> Measure around your natural waistline,
                  keeping the tape comfortably loose.
                </p>
              </div>
              <div className="flex items-start">
                <span className="text-orange-500 mr-3 mt-1">•</span>
                <p>
                  <strong>Hips:</strong> Measure around the fullest part of your
                  hips, keeping the tape horizontal.
                </p>
              </div>
              <div className="flex items-start">
                <span className="text-orange-500 mr-3 mt-1">•</span>
                <p>
                  <strong>Length:</strong> Measure from the shoulder to the
                  desired hem length.
                </p>
              </div>
              <div className="flex items-start">
                <span className="text-orange-500 mr-3 mt-1">•</span>
                <p>
                  <strong>Shoulder:</strong> Measure across the back from
                  shoulder point to shoulder point.
                </p>
              </div>
              <div className="flex items-start">
                <span className="text-orange-500 mr-3 mt-1">•</span>
                <p>
                  <strong>Sleeve Length:</strong> Measure from the shoulder
                  point to the desired sleeve length.
                </p>
              </div>
            </div>

            <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3
                className={`${playFair.className} text-xl font-semibold text-gray-900 mb-3`}
              >
                Tips for Accurate Measurements
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Use a flexible measuring tape</li>
                <li>• Stand naturally with your arms at your sides</li>
                <li>• Don't pull the tape too tight or leave it too loose</li>
                <li>• Have someone help you for more accurate measurements</li>
                <li>• Measure over light clothing or underwear</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default SizeChartPage;
