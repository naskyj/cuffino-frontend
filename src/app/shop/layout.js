"use client";
import { ClipLoader } from "react-spinners";
import { Suspense } from "react";
import RequireLogin from "@/components/auth/RequireLogin";

const ShopLayout = ({ children }) => {
  return (
    <section>
      <RequireLogin>
        <Suspense
          fallback={
            <div className="flex justify-center items-center h-screen">
              <ClipLoader color="#A86746" size={40} />
            </div>
          }
        >
          {children}
        </Suspense>
      </RequireLogin>
    </section>
  );
};

export default ShopLayout;
