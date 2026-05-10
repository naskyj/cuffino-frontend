"use client";

import React from "react";
import { FiTrash2, FiCreditCard, FiPlus, FiCheck, FiCalendar } from "react-icons/fi";

// Temporary static data
const paymentMethods = [
  {
    id: 1,
    type: "visa",
    last4: "4578",
    expires: "03/2024",
    isPrimary: true,
  },
  {
    id: 2,
    type: "amex",
    last4: "4578",
    expires: "05/2024",
    isPrimary: false,
  },
  {
    id: 3,
    type: "discover",
    last4: "4578",
    expires: "07/2024",
    isPrimary: false,
  },
];

const cardBrands = {
  visa: { name: "Visa", bg: "bg-blue-50", text: "text-blue-700" },
  amex: { name: "American Express", bg: "bg-purple-50", text: "text-purple-700" },
  discover: { name: "Discover", bg: "bg-orange-50", text: "text-orange-700" },
  mastercard: { name: "Mastercard", bg: "bg-red-50", text: "text-red-700" },
};

export default function UserPayment() {
  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FiCalendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Current Plan</h2>
              <p className="text-sm text-gray-500">Manage your subscription</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-gray-900">$18</span>
                <span className="text-gray-500">/month</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Next billing date: July 20, 2024
              </p>
            </div>
            <button className="px-5 py-2.5 bg-primary/10 text-primary rounded-lg font-medium hover:bg-primary/20 transition-colors">
              Switch to Annual (Save 20%)
            </button>
          </div>
          
          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-700 flex items-center gap-2">
              <FiCheck className="w-4 h-4" />
              Your subscription is active
            </p>
          </div>
        </div>
      </div>

      {/* Payment Methods Card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FiCreditCard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Payment Methods</h2>
              <p className="text-sm text-gray-500">Manage your payment options</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {paymentMethods.length > 0 ? (
            <div className="space-y-3">
              {paymentMethods.map((method) => {
                const brand = cardBrands[method.type] || cardBrands.visa;
                return (
                  <div
                    key={method.id}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                      method.isPrimary 
                        ? "border-primary/30 bg-primary/5" 
                        : "border-gray-100 hover:border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-8 rounded flex items-center justify-center ${brand.bg}`}>
                        <FiCreditCard className={`w-5 h-5 ${brand.text}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">
                            {brand.name} ending in {method.last4}
                          </p>
                          {method.isPrimary && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-primary text-white rounded-full">
                              Primary
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">Expires {method.expires}</p>
                      </div>
                    </div>
                    <button className="w-9 h-9 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors">
                      <FiTrash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <FiCreditCard className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500">No payment methods added yet.</p>
            </div>
          )}

          <button className="mt-4 w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2 font-medium">
            <FiPlus className="w-5 h-5" />
            Add Payment Method
          </button>
        </div>
      </div>
    </div>
  );
}
