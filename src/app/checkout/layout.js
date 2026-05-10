"use client";

import { Suspense } from "react";
import { ClipLoader } from "react-spinners";

const CheckOutLayout = ({ children }) => {
  return (
    <section>
      <Suspense
        fallback={
          <div className="flex justify-center items-center h-screen">
            <ClipLoader color="#A86746" size={40} />
          </div>
        }
      >
        {children}
      </Suspense>
    </section>
  );
};

export default CheckOutLayout;
