// @ts-ignore

import { classes } from "../utils";
import { Modal } from "antd";

// interface RodalProps {
//   children: React.ReactNode;
//   isVisible: boolean;
//   customStyles?: React.CSSProperties;
//   className?: string;
//   onClose: () => void;
// }
const CustomModal = ({
  children,
  isVisible,
  customStyles,
  className = "",
  onClose,
  classProp = "",
}) => {
  return (
    <Modal
      open={isVisible}
      closable={true}
      footer={null}
      onCancel={onClose}
      modalRender={
        typeof customStyles === "function"
          ? customStyles
          : (modal) => (
              <div
                className={classes("", className)}
                style={customStyles}
              >
                {modal}
              </div>
            )
      }
      className={`!w-full max-w-[300px] md:!max-w-[800px] !max-h-[90vh] ${classProp}`}
      styles={{
        content: {
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        },
        body: {
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
        },
      }}
    >
      <div className="mt-5 w-full">{children}</div>
    </Modal>
  );
};

export default CustomModal;
