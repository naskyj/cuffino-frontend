import { Playfair_Display } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { TfiClose } from "react-icons/tfi";
import CustomDropdown from "../customDropdown";
import { MdArrowDropDown } from "react-icons/md";
import { useState } from "react";

const playFair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair_display",
});
//the md:-mx-[100px ]is because of the padding:100px put in the main page

const navs = [
  {
    id: 0,
    title: "Home",
    link: "/",
  },
  {
    id: 1,
    title: "How It Works",
    link: "/how-it-works",
  },
  {
    id: 2,
    title: "Collection",
    link: "/shop?category=all",
  },
  {
    id: 3,
    title: "Shop",
    link: "/shop",
  },
  {
    id: 4,
    title: "About Us",
    link: "/aboutus",
  },
];

const SideBar = ({ isOpen, setIsOpen, categories = [], loading = false }) => {
  const [openDropDown, setOpenDropDown] = useState(false);
  const handleNavClick = () => {
    setIsOpen(false);
  };

  return (
    <div
      className={` ${
        isOpen ? " translate-x-0  " : " -translate-x-full "
      }  xl:px-0 xl:hidden pt-5  w-screen 
      transform transition-transform duration-300 z-50 fixed overflow-y-auto h-screen bg-white `}
    >
      <div className="flex justify-between items-center px-6">
        <div className="">
          <Link href={`/`} onClick={handleNavClick}>
            <div
              className={`${playFair.className} leading-[5px]  flex flex-col items-start `}
            >
              <p className="uppercase text-xl font-medium">CUFFINO</p>
              <p className="italic text-[9px] font-normal">
                Custom Fit for Now
              </p>
            </div>
          </Link>
        </div>
        <TfiClose
          onClick={() => setIsOpen(false)}
          className="text-2xl text-[#00000] font-light"
        />
      </div>

      <hr className="mt-4" />

      <div className="font-bold text-lg ">
        <div className="flex items-center justify-between border-b px-6 py-3">
          <Link href="/" onClick={handleNavClick}>Home</Link>
          <div
            className="bg-[#EFEFEF] pb-1 w-[35px] h-[35px] flex font-medium justify-center 
            items-center text-2xl"
          >
            +
          </div>
        </div>
        <Link href="/how-it-works" onClick={handleNavClick}>
          <p className="border-b px-6 py-3 text-lg">How It Works</p>
        </Link>
        <div
          onClick={() => setOpenDropDown((open) => !open)}
          className={`text-lg flex items-center justify-between px-6 border-b py-3 ${
            openDropDown ? "!border-0" : ""
          }`}
        >
          <p>Collection</p>
          <MdArrowDropDown />
        </div>
        <div
          className={`!font-normal text-base overflow-hidden transition-all duration-500 ease-in 
                ${openDropDown ? "max-h-96" : "max-h-0"}
            `}
        >
          <ul className="px-6 py-1 space-y-2 ">
            {loading ? (
              <li className="text-gray-500">Loading categories...</li>
            ) : categories.length > 0 ? (
              categories.map((category) => (
                <li
                  key={category.id}
                  className="cursor-pointer hover:text-[#A86746] transition-colors"
                >
                  <Link href={category.link} onClick={handleNavClick}>
                    {category.name}
                  </Link>
                </li>
              ))
            ) : (
              <li className="text-gray-500">No categories available</li>
            )}
          </ul>
        </div>
        <Link href="/shop" onClick={handleNavClick}>
          <p className="border-b px-6 py-3 text-lg">Shop</p>
        </Link>
        <Link href="/aboutus" onClick={handleNavClick}>
          <p className="border-b px-6 py-3 text-lg">About Us</p>
        </Link>
        {/* {navs.map((item) => (
          <Link key={item.id} href={item?.link}>
            <p className="text-lg border-b px-6 py-3">{item?.title}</p>
          </Link>
        ))} */}
      </div>
    </div>
  );
};

export default SideBar;
