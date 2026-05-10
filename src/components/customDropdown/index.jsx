"use client";

import { Dropdown } from "antd";
import { MdArrowDropDown } from "react-icons/md";

const CustomDropdown = ({
  items,
  placement,
  heading,
  onOpenChange,
  onItemClick,
}) => {

  return (
    <>
      <Dropdown
        onOpenChange={onOpenChange}
        className=""
        menu={{
          items,
          onClick: ({ key }) => {
            if (onItemClick) {
              onItemClick(key);
            }
          },
        }}
        trigger={["click", "hover"]}
        placement={placement ?? "bottom"}
        buttonsRender={false}
        overlayClassName="bg-[#fff000] shadow-lg rounded-md"
      >
        <a
          onClick={(e) => {
            e.preventDefault();
          }}
          className="flex cursor-pointer items-center lg:text-base xl:text-lg font-normal hover:font-semibold transition-[font-weight] duration-200 ease-out"
        >
          {heading}
          <MdArrowDropDown />
        </a>
      </Dropdown>
    </>
  );
};

export default CustomDropdown;
