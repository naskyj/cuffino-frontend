"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import useAuth from "@/core/zustand/auth.store";
import { SupportServices } from "@/services/support";
import { OrdersServices } from "@/services/orders";
import {
  FiHelpCircle,
  FiPlus,
  FiX,
  FiMessageCircle,
  FiClock,
} from "react-icons/fi";

// A2 (RISK_REGISTER.md) / SOP_CUSTOMER_SUPPORT.md: lets a customer raise and track a support
// issue in-app instead of it only going wherever email/WhatsApp happens to land.

const CATEGORY_OPTIONS = [
  { value: "ORDER_STATUS", label: "Where is my order?" },
  { value: "PRODUCT_FABRIC_QUESTION", label: "Product or fabric question" },
  { value: "ACCOUNT_LOGIN", label: "Account / login issue" },
  { value: "FIT_QUALITY_CONCERN", label: "Fit or quality concern" },
  { value: "PRODUCTION_DELAY", label: "Production delay" },
  { value: "TAILOR_ISSUE", label: "Tailor-side issue" },
  { value: "PAYMENT_REFUND", label: "Payment or refund" },
  { value: "DISPUTE_CHARGEBACK", label: "Dispute / chargeback" },
  { value: "DATA_PRIVACY_LEGAL", label: "Data privacy / legal" },
  { value: "OTHER", label: "Something else" },
];

const STATUS_CONFIG = {
  OPEN: { bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-500", label: "Open" },
  IN_PROGRESS: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500", label: "In Progress" },
  RESOLVED: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500", label: "Resolved" },
  CLOSED: { bg: "bg-gray-50", text: "text-gray-600", dot: "bg-gray-400", label: "Closed" },
};

const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.OPEN;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
      {config.label}
    </span>
  );
};

export default function UserSupport() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    subject: "",
    category: "ORDER_STATUS",
    orderId: "",
    issueDescription: "",
  });
  const [error, setError] = useState("");

  const { data: ticketsData, isLoading } = useQuery({
    queryKey: ["getMyTickets", user?.userId],
    queryFn: async () => {
      const response = await SupportServices.getMyTickets(user?.userId);
      return Array.isArray(response?.data) ? response.data : [];
    },
    enabled: !!user?.userId,
  });

  const { data: ordersData } = useQuery({
    queryKey: ["getAllOrders", user?.userId],
    queryFn: async () => {
      const response = await OrdersServices.getAllOrders(user?.userId);
      return Array.isArray(response?.data) ? response.data : response?.data?.data || [];
    },
    enabled: !!user?.userId && isModalOpen,
  });

  const tickets = Array.isArray(ticketsData) ? ticketsData : [];
  const orders = Array.isArray(ordersData) ? ordersData : [];

  const resetForm = () =>
    setForm({ subject: "", category: "ORDER_STATUS", orderId: "", issueDescription: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.subject.trim() || !form.issueDescription.trim()) {
      setError("Please fill in a subject and description.");
      return;
    }
    setSubmitting(true);
    try {
      await SupportServices.createTicket({
        subject: form.subject.trim(),
        issueDescription: form.issueDescription.trim(),
        category: form.category,
        orderId: form.orderId ? Number(form.orderId) : undefined,
      });
      queryClient.invalidateQueries({ queryKey: ["getMyTickets", user?.userId] });
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to submit your ticket. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <FiHelpCircle className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Support</h2>
            <p className="text-sm text-gray-500">
              We typically respond within 12 hours. For order or fit concerns, include the order number.
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <FiPlus className="w-4 h-4" />
          New Ticket
        </button>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center text-gray-500">
          Loading your tickets...
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12">
          <div className="text-center">
            <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FiMessageCircle className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No support tickets yet</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              Have a question about an order, fit, or anything else? Open a ticket and we&apos;ll get back to you.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <Link
              key={ticket.ticketId}
              href={`/user-support/${ticket.ticketId}`}
              className="block bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:border-primary/30 hover:shadow-md transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-gray-400">
                      #{ticket.ticketId}
                    </span>
                    <h3 className="font-semibold text-gray-900">{ticket.subject}</h3>
                    <StatusBadge status={ticket.status} />
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-1">{ticket.issueDescription}</p>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-2">
                    <FiClock className="w-3.5 h-3.5" />
                    <span>Opened {formatDate(ticket.createdAt)}</span>
                    {ticket.orderId && <span> &middot; Order #{ticket.orderId}</span>}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center rounded-t-2xl">
              <h2 className="text-xl font-semibold text-gray-900">New Support Ticket</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <FiX size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="Short summary of the issue"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Related order (optional)
                </label>
                <select
                  value={form.orderId}
                  onChange={(e) => setForm((f) => ({ ...f, orderId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="">Not order-related</option>
                  {orders.map((order) => (
                    <option key={order.orderId} value={order.orderId}>
                      Order #{order.orderId}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Tell us what&apos;s going on
                </label>
                <textarea
                  value={form.issueDescription}
                  onChange={(e) => setForm((f) => ({ ...f, issueDescription: e.target.value }))}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="As much detail as you can share helps us respond faster"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:opacity-90 disabled:opacity-60"
                >
                  {submitting ? "Submitting..." : "Submit Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
