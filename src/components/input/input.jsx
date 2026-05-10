import React, { useState } from "react";
import { ErrorMessage, FastField } from "formik";
import { FaRegEyeSlash } from "react-icons/fa";
import { IoEyeOutline } from "react-icons/io5";
import { TextError } from "../utils";


// interface InputProps {
//   value?: any;
//   type?: string;
//   id?: string;
//   onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
//   placeholder?: string;
//   name?: string;
//   accept?: string;
//   className?: string;
//   containerClassName?: string;
//   label?: string;
//   info?: string;
//   defaultValue?: string | number | readonly string[] | undefined;
//   disabled?: boolean;
//   required?: boolean;
//   max?: string | number | undefined;
//   min?: string | number | undefined;
// }

const Input = ({
  value,
  type,
  id,
  // onChange,
  placeholder,
  name = "",
  accept,
  label,
  className = "",
  containerClassName = "",
  info,
  defaultValue,
  disabled = false,
  required,
  max,
  min,
}) => {
  const [inputType, setInputType] = useState("password");
  const handleClick = () => {
    inputType === "password" ? setInputType("text") : setInputType("password");
  };
  return (
    <>
      <div className="sharp-sans flex flex-col space-y-1">
        {label && (
          <label
            htmlFor={name}
            className={
              `sharp-sans text-[14px] font-[600] max-w-[75%]`
            }
          >
            {label}
          </label>
        )}
        <div className="relative">
          <FastField
            disabled={disabled}
            className={`
              w-full py-[2px] px-2 rounded-[3px] placeholder:text-xs placeholder:text-[#B9B9B9] text-[14px] bg-placeholder border border-[#DCDFF1] focus:outline-none relative font-light min-h-[44px] focus:shadow-[0_0_3px_#E6ECF7] max-h-[44px] pr-[42px] disabled:cursor-not-allowed
              ${className}
            `}
            type={type === "password" ? inputType : type}
            id={name}
            required={required}
            autoComplete="on"
            name={name}
            placeholder={placeholder}
            // value={value}
            // onChange={onChange}
            defaultValue={defaultValue}
            accept={accept}
            max={max}
            min={min}
          />
          {type === "password" && (
            <div
              onClick={() => handleClick()}
              className="icon_button absolute right-[0px] lg:left- top-[14px] h-6 w-6 "
                
            >
              
              {
                
                inputType === "password"
                  ? <IoEyeOutline />
                  : <FaRegEyeSlash/>
              }
            </div>
          )}
        </div>
        <ErrorMessage
        name={name}
        children={(msg) => <TextError children={msg} />}
      />
      </div>
      
    </>
  );
};

export default Input;
