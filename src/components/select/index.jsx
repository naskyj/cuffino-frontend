"use client";

import Select from "react-select";

const CustomSelect = ({ value, placeholder, options, onChange, width, borderStyle, textColor }) => {
  return (
    <div className="text-sm md:text-base h-8 md:h-10 w-full py-0">
      <Select
        components={{
          IndicatorSeparator: () => null,
        }}
        options={options}
        onChange={onChange}
        value={value}
        placeholder={placeholder}
        styles={{
          control: (baseStyles) => ({
            ...baseStyles,
            border: borderStyle ? `1px solid #A8674699 `: `1px solid #A86746 `,
            "&:hover": {
              border: borderStyle ? `1px solid #A8674699 `: `1px solid #A86746 `,
            },
            
            color: textColor ? "#000" : "#A86746",
            height: "100%",
            minHeight: "unset",
            // minHeight: "12px",
            // [`@media (min-width: 640px)`]: { minHeight: "32px" },
            // [`@media (min-width: 768px)`]: { minHeight: "40px" }, // Remove default minHeight
            borderRadius: "8px",
            boxShadow: "none",
            width: `${width}`,
            padding: borderStyle ? "5px 0px 5px 0px" : "inherit",
          }),
          menu: (baseStyles) => ({
            ...baseStyles,
            border: "none",
            marginTop: "0px",
            color: textColor ? "#000" : "#A86746",
            width: "100%",
            fontSize: "900",
            marginTop: "5px",
          }),
          placeholder: (baseStyles) => ({
            ...baseStyles,
            border: "none",
            color: textColor ? "#B9B9B9" : "#A86746",
            fontSize: textColor ? "14px" : "inherit",
            paddingLeft: borderStyle ? "4px" : "0px",
            fontWeight: "400",
          }),
          singleValue: (baseStyles) => ({
            ...baseStyles,
            color: textColor ? "#000" : "#A86746",
            fontWeight: "400",
            fontSize: textColor ? "14px" : "inherit",
            paddingLeft: textColor ? "4px" : "0px",
          }),
          input: (baseStyles) => ({
            ...baseStyles,
            color: textColor ? "#000" : "#A86746",
            padding: "inherit",
          }),
          valueContainer: (base) => ({
            ...base,
            paddingTop: "-10px", // default padding
            paddingBottom: "-10px",
            paddingLeft: "4px",
            [`@media (min-width: 640px)`]: {
              // sm breakpoint
              paddingTop: "3px", // default padding
              paddingBottom: "3px", // default padding
              paddingLeft: "4px",
            },
            [`@media (min-width: 768px)`]: {
              // md breakpoint
              paddingTop: "3px", // default padding
              paddingBottom: "3px", // default padding
              paddingLeft: "4px",
            },
          }),
          // the dropdown arrow icon
          dropdownIndicator: (baseStyles) => ({
            ...baseStyles,
            color: textColor ? "#B9B9B9" : "#A86746",
            "&:hover": {
              color: textColor ? "#B9B9B9" : "#A86746",
            },
          }),
          option: (baseStyles, { isFocused }) => ({
            ...baseStyles,
            backgroundColor: isFocused ? "#A86746" : "white",
            color: isFocused ? "white" : "#A86746",
            fontSize: textColor ? "14px" : "inherit",
            //   "&:hover": {
            //     backgroundColor: "#00013A",
            //     color: "white",
            //   },
          }),
        }}
      />
    </div>
  );
};

export default CustomSelect;
