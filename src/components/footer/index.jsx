import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FiShoppingCart,
  FiDribbble,
  FiLinkedin,
  FiFacebook,
  FiInstagram,
  FiTwitter,
  FiMail,
  FiYoutube,
  FiGithub,
  FiGitlab,
  FiHelpCircle,
  FiBookmark,
  FiSettings,
} from "react-icons/fi";
import { Playfair_Display } from "next/font/google";

const playFair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair_display",
});

const paymentCart = [
  "/assets/images/homePage/payments/american-express.jpg",
  "/assets/images/homePage/payments/discover.jpg",
  "/assets/images/homePage/payments/mastercard.jpg",
  "/assets/images/homePage/payments/paypal.jpg",
  "/assets/images/homePage/payments/visa.jpg",
];

const footerSocial = [
  {
    icon: FiLinkedin,
    link: "http://linkedin.com/company/shreethemes",
  },
  {
    icon: FiFacebook,
    link: "https://www.facebook.com/shreethemes",
  },
  {
    icon: FiInstagram,
    link: "https://www.instagram.com/shreethemes",
  },
  {
    icon: FiTwitter,
    link: "https://twitter.com/shreethemes",
  },
  {
    icon: FiMail,
    link: "mailto:support@shreethemes.in",
  },
];

export default function Footer({utilityClassName}) {
  return (
    <footer className=" bg-primary relative text-white">
      <div className={`px-6 md:px-9 lg:px-[100px]  xl:px-[100px] 2xl:px-[100px] relative ${utilityClassName}`}>
        <div className="py-[45px] md:py-[60px]">
          <div className="">
            <div className="">
              <div
                className={`${playFair.className}  text-white flex flex-col items-start gap-2`}
              >
                <p className="uppercase text-2xl lg:text-3xl font-medium">
                  CUFFINO
                </p>
                <p className="italic text-xs font-normal">Custom Fit for Now</p>
              </div>
              <p className="mt-6 text-sm md:text-base">
                Upgrade your style with our curated sets.
                <br /> Choose confidence, embrace your unique look.
              </p>
              <ul className="list-none mt-6 space-x-2">
                {footerSocial.map((item, index) => {
                  let Icon = item.icon;
                  return (
                    <li className="inline" key={index}>
                      <Link
                        href={item.link}
                        target="_blank"
                        className="size-7 md:size-8 inline-flex items-center justify-center tracking-wide align-middle text-sm md:text-base border  rounded-md hover:text-orange-500"
                      >
                        <Icon
                          className="h-4 w-4 align-middle"
                          title="Buy Now"
                        ></Icon>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="py-[30px] px-0 border-t-[0.7px] border-white">
        <div className={`md:px-9 lg:px-[100px] xl:px-[100px] 2xl:px-[100px] relative lg:text-center ${utilityClassName}`}>
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center px-6 md:px-0">
            <div className="md:text-start lg:text-center text-sm md:text-base">
              <p className="mb-0">
                © {new Date().getFullYear()} Cuffino. Designed & Developed By{" "}
                <i className="mdi mdi-heart text-red-600"></i> {" "}
                <Link
                  href="https://shreethemes.in/"
                  target="_blank"
                  className="text-reset"
                >
                  Cuffino Technologies
                </Link>
                .
              </p>
            </div>

            <ul className="list-none   mt-6 md:mt-0 space-x-1">
              {paymentCart.map((item, index) => {
                return (
                  <li className="inline" key={index}>
                    <Link href="">
                      <Image
                        src={item}
                        width={38}
                        height={24}
                        className="max-h-6 rounded inline"
                        title="American Express"
                        alt=""
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
