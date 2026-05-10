import React from "react";
import Image from "next/image";

const OrderSummary = ({ items, subtotal, shipping, tax, total, showImages = true }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-6">Order Summary</h3>
      
      {/* Order Items */}
      <div className="space-y-4 mb-6">
        {items.map((item) => (
          <div key={item.id} className="flex items-center space-x-3">
            {showImages && (
              <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 truncate">{item.title}</h4>
              <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
              <p className="text-sm font-medium text-gray-900">
                ${(parseFloat(item.price.replace('$', '')) * item.quantity).toFixed(2)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Order Totals */}
      <div className="border-t pt-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-medium">${subtotal.toFixed(2)}</span>
        </div>
        {shipping > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Shipping</span>
            <span className="font-medium">${shipping.toFixed(2)}</span>
          </div>
        )}
        {tax > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tax</span>
            <span className="font-medium">${tax.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-lg font-bold border-t pt-3">
          <span className="text-gray-900">Total</span>
          <span className="text-primary">${total.toFixed(2)}</span>
        </div>
      </div>

      {/* Shipping Info */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Shipping Information</h4>
        <p className="text-sm text-gray-600">
          Production timeline: 7-14 working days
        </p>
        <p className="text-sm text-gray-600 mt-1">
          Please ensure accurate size measurements are provided
        </p>
      </div>
    </div>
  );
};

export default OrderSummary; 