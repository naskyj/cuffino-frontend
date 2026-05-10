"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import useAuth from "@/core/zustand/auth.store";

import {
  FiUser,
  FiSettings,
  FiLogOut,
  FiFileText,
  FiShoppingBag,
} from "react-icons/fi";
import { GrMapLocation } from "react-icons/gr";

const navItems = [
  { href: "/user-profile", label: "Profile", icon: FiUser, slug: "user-profile" },
  { href: "/user-measurement", label: "Measurements", icon: FiFileText, slug: "user-measurement" },
  { href: "/user-orders", label: "Orders", icon: FiShoppingBag, slug: "user-orders" },
  { href: "/user-delivery-address", label: "Delivery Address", icon: GrMapLocation, slug: "user-delivery-address" },
  { href: "/user-setting", label: "Settings", icon: FiSettings, slug: "user-setting" },
];

export default function Usertab() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isActive = (slug) => pathname.includes(slug.toLowerCase());

  // Get user initials for avatar
  const getInitials = () => {
    if (user?.username) {
      return user.username.slice(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userId");
    }
    if (logout) logout();
  };

  return (
    <div className="w-full md:w-72 lg:w-80 flex-shrink-0">
      <div className="sticky top-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {/* User Info Section */}
          <div className="p-5 bg-gradient-to-br from-primary/5 to-primary/10 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-lg">
                {getInitials()}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">
                  {user?.username || "User"}
                </h3>
                <p className="text-sm text-gray-500 truncate">
                  {user?.email || ""}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-3">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.slug);
                
                return (
                  <li key={item.slug}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                        active
                          ? "bg-primary text-white shadow-sm"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      <span className={`flex items-center justify-center w-8 h-8 rounded-lg ${
                        active 
                          ? "bg-white/20" 
                          : "bg-gray-100"
                      }`}>
                        <Icon className={`w-4 h-4 ${active ? "text-white" : "text-gray-500"}`} />
                      </span>
                      <span className="font-medium text-sm">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* Divider */}
            <div className="my-3 border-t border-gray-100"></div>

            {/* Logout */}
            <Link
              href="/login"
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
            >
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100">
                <FiLogOut className="w-4 h-4 text-gray-500" />
              </span>
              <span className="font-medium text-sm">Sign Out</span>
            </Link>
          </nav>
        </div>
      </div>
    </div>
  );
}
