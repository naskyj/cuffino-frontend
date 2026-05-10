import React from "react";
import Link from "next/link";
import { IoArrowBack } from "react-icons/io5";

export default function BackToHome() {
  return (
    <div className="fixed bottom-3 end-3">
      <Link
        href="/"
        className="back-button size-9 inline-flex items-center justify-center tracking-wide align-middle duration-500 text-base text-center bg-[#3A2D28] text-white rounded-full"
      >
        <IoArrowBack className="h-4 w-4"></IoArrowBack>
      </Link>
    </div>
  );
}
