"use client";

import React from "react";
import Link from "next/link";
import { FiEdit2, FiMapPin, FiPhone, FiFileText, FiUser } from "react-icons/fi";

// Address Card Component
const AddressCard = ({ title, icon: Icon, name, address, phone, iconBg }) => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
    <div className="p-5 border-b border-gray-100 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      <button className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
        <FiEdit2 className="w-4 h-4 text-gray-600" />
      </button>
    </div>
    <div className="p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
          <FiUser className="w-5 h-5 text-gray-500" />
        </div>
        <p className="font-medium text-gray-900">{name}</p>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
            <FiMapPin className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">{address}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
            <FiPhone className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-sm text-gray-600">{phone}</p>
        </div>
      </div>
    </div>
  </div>
);

export default function UserBilling() {
  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <FiFileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Billing Information</h2>
            <p className="text-sm text-gray-500">Default addresses for checkout</p>
          </div>
        </div>
      </div>

      {/* Address Cards Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        <AddressCard
          title="Billing Address"
          icon={FiFileText}
          iconBg="bg-primary"
          name="Jesus Zamora"
          address="C/54 Northwest Freeway, Suite 558, Houston, USA 485"
          phone="+123 897 5468"
        />
        
        <AddressCard
          title="Shipping Address"
          icon={FiMapPin}
          iconBg="bg-green-500"
          name="Jesus Zamora"
          address="C/54 Northwest Freeway, Suite 558, Houston, USA 485"
          phone="+123 897 5468"
        />
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 rounded-xl p-4">
        <p className="text-sm text-blue-700">
          These addresses will be used as defaults during checkout. You can always choose a different address when placing an order.
        </p>
      </div>
    </div>
  );
}
