import React, { useState } from "react";
import { ErrorMessage, FastField, Field } from "formik";
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

  // Why the show/hide-password eye did nothing: FastField implements shouldComponentUpdate and
  // only re-renders when its OWN formik state changes (value/error/touched/isSubmitting) or the
  // prop COUNT changes. Clicking the eye changes `inputType`, which changes the value of the
  // `type` prop but not how many props there are - so FastField skipped the re-render and the
  // input stayed type="password" forever. Password inputs therefore use the ordinary Field,
  // which re-renders with its parent; everything else keeps FastField's optimisation.
  const FieldComponent = type === "password" ? Field : FastField;
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
          <FieldComponent
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
            <button
              type="button"
              onClick={handleClick}
              aria-label={inputType === "password" ? "Show password" : "Hide password"}
              aria-pressed={inputType !== "password"}
              // tabIndex -1 so tabbing goes straight from the password field to the submit
              // button, the way people actually fill a login form.
              tabIndex={-1}
              className="icon_button absolute right-3 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center text-gray-500 hover:text-gray-800 cursor-pointer"
            >
              {inputType === "password" ? <IoEyeOutline /> : <FaRegEyeSlash />}
            </button>
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
