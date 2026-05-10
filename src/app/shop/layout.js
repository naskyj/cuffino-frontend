"use client";
import { ClipLoader } from "react-spinners";
import { Suspense } from "react";

const ShopLayout = ({ children }) => {
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

export default ShopLayout;
