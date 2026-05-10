"use client";

import React from "react";
import Link from "next/link";
import { userFvtItem, userOrder } from "@/app/data/data";
import { FiTrash2, FiShoppingBag, FiHeart, FiChevronRight, FiPackage } from "react-icons/fi";

// Status Badge Component
const StatusBadge = ({ status }) => {
  const statusStyles = {
    Delivered: "bg-green-50 text-green-700",
    Processing: "bg-blue-50 text-blue-700",
    Canceled: "bg-red-50 text-red-700",
  };

  const dotStyles = {
    Delivered: "bg-green-500",
    Processing: "bg-blue-500",
    Canceled: "bg-red-500",
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusStyles[status] || "bg-gray-50 text-gray-700"}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotStyles[status] || "bg-gray-500"}`}></span>
      {status}
    </span>
  );
};

export default function UserAccount() {
  return (
    <div className="space-y-6">
      {/* Recent Orders Section */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FiShoppingBag className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
                <p className="text-sm text-gray-500">Your latest order activity</p>
              </div>
            </div>
            <Link href="/user-orders" className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1">
              View All
              <FiChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Order</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {userOrder && userOrder.length > 0 ? (
                userOrder.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                          <FiPackage className="w-4 h-4 text-gray-500" />
                        </div>
                        <span className="font-medium text-gray-900">#{item.no}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.date}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{item.total}</span>
                      <span className="text-gray-400 text-sm ml-1">{item.item}</span>
                    </td>
                    <td className="px-6 py-4">
                      <Link href="#" className="text-primary hover:text-primary/80 font-medium text-sm flex items-center gap-1">
                        View
                        <FiChevronRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-3">
                      <FiPackage className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-gray-500">No orders yet</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Favorites Section */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                <FiHeart className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Favorite Items</h2>
                <p className="text-sm text-gray-500">Items you've saved for later</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {userFvtItem && userFvtItem.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {userFvtItem.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-all"
                >
                  <div className="w-16 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    <img
                      src={item.image}
                      alt="Product"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <Link href="" className="font-medium text-gray-900 hover:text-primary truncate block">
                      Ladies Top
                    </Link>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-primary font-semibold">$16.00</span>
                      <span className="text-gray-400 text-sm line-through">$21.00</span>
                    </div>
                  </div>

                  <button className="w-9 h-9 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors flex-shrink-0">
                    <FiTrash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <FiHeart className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No favorites yet</h3>
              <p className="text-sm text-gray-500">Items you save will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
