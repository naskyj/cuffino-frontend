import React from "react";
import { ErrorMessage, Field } from "formik";
import { TextError } from "../utils";

const Textarea = ({
  name = "",
  label,
  placeholder,
  className = "",
  rows = 4,
  disabled = false,
  required,
}) => {
  return (
    <div className="sharp-sans flex flex-col space-y-1">
      {label && (
        <label
          htmlFor={name}
          className="sharp-sans text-[14px] font-[600] pointer-events-none max-w-[75%]"
        >
          {label}
        </label>
      )}
      <Field
        as="textarea"
        disabled={disabled}
        className={`w-full py-2 px-3 rounded-[3px] placeholder:text-xs placeholder:text-[#B9B9B9] text-[14px] bg-placeholder border border-[#DCDFF1] focus:outline-none relative font-light min-h-[100px] focus:shadow-[0_0_3px_#E6ECF7] resize-none disabled:cursor-not-allowed ${className}`}
        id={name}
        name={name}
        placeholder={placeholder}
        rows={rows}
        required={required}
      />
      <ErrorMessage
        name={name}
        children={(msg) => <TextError children={msg} />}
      />
    </div>
  );
};

export default Textarea;
