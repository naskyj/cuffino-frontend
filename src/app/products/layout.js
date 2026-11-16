"use client";
import RequireLogin from "@/components/auth/RequireLogin";

const ProductsLayout = ({ children }) => <RequireLogin>{children}</RequireLogin>;

export default ProductsLayout;
