import React from "react";
import { FC, ReactNode } from "react";


// type props = {
//   text?: string;
//   disable?: boolean;
//   loading?: boolean;
//   children?: ReactNode;
//   type?: "button" | "submit" | "reset" | undefined;
//   className?: string;
//   loadingClassName?: string;
//   onClick?: (e?: any) => void;
// };

const Button = ({
  text,
  disable,
  loading = false,
  children,
  type,
  className = "",
  loadingClassName = "",
  onClick,
}) => {
  return (
    <button
      type={type}
      disabled={disable || loading}
      //when importing Button into a component always specify the bg and color
      className={
        `dm-sans flex justify-center cursor-pointer items-center disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto overflow-hidden relative h-[49.36px]  text-[14.1px] font-semibold  px-[30px] py-[20px]
        ${className}`
      }
      onClick={onClick}
    >
      {loading ? (
        <svg
          className={`
            animate-spin -ml-1 mr-1 h-5 w-5 text-white
            ${loadingClassName}`
          }
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      ) : null}
      {text}
      {children}
    </button>
  );
};

export default Button;
