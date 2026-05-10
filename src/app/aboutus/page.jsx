"use client";

import DesktopNavbar from "@/components/navbars/desktopNavbar";
import MobileNavbar from "@/components/navbars/mobileNavabr";
import Footer from "@/components/footer";
import Image from "next/image";
import { FiPhone, FiMapPin } from "react-icons/fi";
import { Playfair_Display } from "next/font/google";

const playFair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair_display",
});

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-white">
      <header className="linearGradientBackground pb-10 md:pb-12">
        <div className="xl:px-[100px]">
          <DesktopNavbar textColor="!text-black" />
        </div>
        <MobileNavbar utilityClassName="px-6 md:px-9 lg:px-[100px]" />
        <h1
          className={`${playFair.className} text-center text-[24px] md:text-[30px] lg:text-[33px] text-primary font-medium pt-[40px] lg:pt-[70px] px-6`}
        >
          About Us
        </h1>
      </header>

      <main className="px-6 md:px-9 lg:px-[100px] pb-16 md:pb-24">
        <div className="mx-auto max-w-[720px] lg:max-w-[800px]">
          <div className="relative overflow-hidden  bg-white px-6 py-10 sm:px-10 sm:py-12 md:px-14 md:py-16">
            <div
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
              aria-hidden
            >
              <Image
                src="/assets/images/aboutUs/aboutUsLogo.svg"
                alt=""
                width={420}
                height={420}
                className="h-auto w-[min(95%,420px)] opacity-[0.08] select-none"
              />
            </div>

            <div className="relative z-10 space-y-6 text-center text-[#2a2a2a] md:space-y-7">
              <p className="text-base leading-relaxed md:text-xl md:leading-relaxed">
                <span className="font-semibold text-primary">At Cuffino,</span>{" "}
                we believe fashion should be as unique as the people who wear
                it. That is why we have built a platform that connects
                customers in the US directly with skilled tailors in Nigeria,
                bringing together authentic African craftsmanship, high-quality
                fabrics, and personalized style.
              </p>

              <p className="text-base leading-relaxed md:text-xl md:leading-relaxed">
                Our process is simple; you enter your measurements, choose your
                favorite fabric, and select a style that reflects your
                personality. From there, your order is assigned to one of our
                experienced Nigerian tailors, who carefully handcrafts your
                garment with precision and care. Once complete, we ship your{" "}
                <strong className="font-semibold text-[#1a1a1a]">
                  one-of-a-kind piece
                </strong>{" "}
                straight to your door.
              </p>

              <p className="text-base leading-relaxed md:text-xl md:leading-relaxed">
                We are more than an e-commerce company, we are a bridge between
                cultures. By working with talented tailors in Nigeria, we empower
                local artisans, celebrate African fashion, and give our
                customers access to beautifully made, custom-fit clothing that
                can&apos;t be found anywhere else.
              </p>
            </div>
          </div>
        </div>

        
      </main>

      <Footer />
    </div>
  );
}
