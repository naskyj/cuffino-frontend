"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import useAuth from "@/core/zustand/auth.store";
import { OrdersServices } from "@/services/orders";
import { FiX, FiShoppingBag, FiChevronRight, FiPackage, FiCalendar } from "react-icons/fi";

// Status badge component
const StatusBadge = ({ status }) => {
  const statusConfig = {
    pending: { bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-500" },
    processing: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
    shipped: { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500" },
    delivered: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
    paid: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
    cancelled: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
  };

  const config = statusConfig[status?.toLowerCase()] || statusConfig.pending;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
      {status || "Pending"}
    </span>
  );
};

export default function UserOrders() {
  const { user } = useAuth();
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch all orders
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ["getAllOrders", user?.userId],
    queryFn: async () => {
      const response = await OrdersServices.getAllOrders(user?.userId);
      return Array.isArray(response?.data) ? response.data : response?.data?.data || [];
    },
    enabled: !!user?.userId,
  });

  // Fetch selected order details
  const { data: orderDetails, isLoading: isLoadingOrderDetails } = useQuery({
    queryKey: ["getOrder", selectedOrderId],
    queryFn: async () => {
      const response = await OrdersServices.getOrder(selectedOrderId);
      return response?.data;
    },
    enabled: !!selectedOrderId && isModalOpen,
  });

  const orders = Array.isArray(ordersData) ? ordersData : [];

  const handleOrderClick = (orderId) => {
    setSelectedOrderId(orderId);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedOrderId(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount, currency = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  // Skeleton loader
  const OrderSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
          <div className="flex justify-between items-start">
            <div className="space-y-3">
              <div className="h-5 w-32 bg-gray-200 rounded"></div>
              <div className="h-4 w-24 bg-gray-200 rounded"></div>
            </div>
            <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <FiShoppingBag className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Order History</h2>
            <p className="text-sm text-gray-500">
              {orders.length > 0 ? `${orders.length} order${orders.length > 1 ? 's' : ''} found` : 'Track and manage your orders'}
            </p>
          </div>
        </div>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <OrderSkeleton />
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12">
          <div className="text-center">
            <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FiPackage className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No orders yet</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              When you place your first order, it will appear here. Start shopping to see your order history.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div
              key={order.orderId}
              onClick={() => handleOrderClick(order.orderId)}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/5 flex items-center justify-center flex-shrink-0">
                    <FiPackage className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">
                        Order #{order.orderId}
                      </h3>
                      <StatusBadge status={order.status} />
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                      <FiCalendar className="w-3.5 h-3.5" />
                      <span>{formatDate(order.orderDate)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 pl-16 sm:pl-0">
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">
                      {formatCurrency(order.totalPrice, order.currency)}
                    </p>
                    <p className="text-xs text-gray-500">{order.itemCount || ''} items</p>
                  </div>
                  <FiChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order Details Modal - keeping inner content as requested */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center rounded-t-2xl">
              <h2 className="text-xl font-semibold text-gray-900">
                Order Details
              </h2>
              <button
                onClick={closeModal}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {isLoadingOrderDetails ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : orderDetails ? (
                <>
                  {/* Order Items */}
                  <div className="bg-white rounded-lg shadow-sm border mb-6">
                    {/* Table Header */}
                    <div className="gap-4 p-6 border-b bg-gray-50 font-semibold text-gray-700">
                      <div className="col-span-3 md:col-span-6 text-primary">
                        PRODUCT
                      </div>
                    </div>

                    {/* Order Items */}
                    {orderDetails.items?.map((item) => (
                      <div
                        key={item?.orderItemId}
                        className="gap-4 py-6 px-3 md:px-6 md:py-6 border-b items-center text-sm md:text-base"
                      >
                        {/* Product Info */}
                        <div className="flex items-center space-x-1 md:space-x-4">
                          <div className="flex md:flex-row flex-col items-center gap-x-4">
                            <div className="relative w-20 h-20 rounded-md overflow-hidden">
                              <Image
                                src={item?.productImages[0]?.imageUrl || ""}
                                alt={item?.productImages[0]?.altText || "Product image"}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div>
                              <h3 className="font-semibold pt-1 md:pt-0 text-primary">
                                {`${item?.productName} ${" "} ${" "} x${
                                  item?.quantity
                                }`}
                              </h3>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Summary */}
                  <div className="bg-white shadow-sm p-1 bg-[#F8F8F8] !rounded-[10px]">
                    <div className="md:flex md:justify-between md:items-center py-4 px-6 bg-[#F8F8F8] border-b border-[#F9E6D0]">
                      <span className="text-lg font-semibold text-primary">
                        Taxes:{" "}
                      </span>
                      <span className="text-base md:text-sm text-primary">
                        {orderDetails.tax === null ||
                        orderDetails.tax === undefined ? (
                          <div className="h-4 w-12 bg-gray-300 rounded animate-pulse"></div>
                        ) : (
                          formatCurrency(orderDetails.tax, orderDetails.currency)
                        )}
                      </span>
                    </div>
                    <div className="md:flex md:justify-between md:items-center py-4 px-6 bg-[#F8F8F8] border-b border-[#F9E6D0]">
                      <span className="text-lg font-semibold text-primary">
                        Total Discount:{" "}
                      </span>
                      <span className="text-base md:text-sm text-primary">
                        {orderDetails.discountTotal === null ||
                        orderDetails.discountTotal === undefined ? (
                          <div className="h-4 w-12 bg-gray-300 rounded animate-pulse"></div>
                        ) : (
                          formatCurrency(
                            orderDetails.discountTotal,
                            orderDetails.currency
                          )
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-4 px-6 bg-[#F8F8F8]">
                      <span className="text-lg font-semibold text-primary">
                        Grand Total:
                      </span>
                      <span className="text-base md:text-sm text-primary">
                        {!orderDetails.totalPrice ? (
                          <div className="h-4 w-12 bg-gray-300 rounded animate-pulse"></div>
                        ) : (
                          formatCurrency(
                            orderDetails.totalPrice,
                            orderDetails.currency
                          )
                        )}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">Failed to load order details.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

