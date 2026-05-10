import React, { FC } from "react";
import { Field, ErrorMessage } from "formik";
import { TextError } from "../utils";


// interface ISelectProps {
//   label?: string;
//   labelImg?: string;
//   name?: string;
//   options?: [];
//   className?: string;
//   selectClassName?: string;
//   val?: any;
//   [key: string]: any;
// }
const SelectField = (props) => {
  const {
    label,
    name = "",
    labelImg,
    options = [],
    className = "",
    val,
    ClassName = "",
    ...rest
  } = props;
  return (
    <div className="">
      <div className={` ${ClassName}`}>
        <label
          htmlFor={name}
          className={`
            pb-1 sharp-sans text-[13px] font-[600] pointer-events-none, max-w-[75%] flex
          `}
        >
          {labelImg && <img src={labelImg} alt="icon" className="mr-2" />}
          {label}
        </label>
        <Field
          as="select"
          name={name}
          id={name}
          {...rest}
          className=
            {`sharp-sans text-black opacity-60 font-bold w-full py-[2px] px-2 rounded-[3px] text-[14px] placeholder:text-[10px] placeholder:text-[#B9B9B] bg-placeholder border border-[#DCDFF1] focus:outline-none  relative font-medium min-h-[44px] focus:shadow-[0_0_3px_#E6ECF7] max-h-[44px] pr-[42px] disabled:cursor-not-allowed
            ${className}`}
        
        >
          {options?.map(
            (option) => {
              return (
                <option
                  key={option.key}
                  value={option.value ?? option.id}
                  disabled={option.$isDisabled}
                >
                  {option.flag && option.flag}
                  {option.key && option.key}
                  {option.name && option.name}
                </option>
              );
            }
          )}
        </Field>
      </div>
      <ErrorMessage
        name={name}
        children={(msg) => <TextError children={msg} />}
      />
    </div>
  );
};

export default SelectField;
