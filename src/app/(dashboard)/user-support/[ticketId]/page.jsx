"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { SupportServices } from "@/services/support";
import { FiArrowLeft, FiClock, FiTag, FiUser, FiAlertTriangle } from "react-icons/fi";

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

const formatDateTime = (dateString) => {
  if (!dateString) return null;
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const categoryLabel = (category) =>
  category
    ? category
        .split("_")
        .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
        .join(" ")
    : "General";

export default function TicketDetailPage() {
  const params = useParams();
  const ticketId = params?.ticketId;

  const { data: ticket, isLoading, isError } = useQuery({
    queryKey: ["supportTicket", ticketId],
    queryFn: async () => {
      const response = await SupportServices.getTicket(ticketId);
      return response?.data || null;
    },
    enabled: !!ticketId,
  });

  return (
    <div className="space-y-6">
      <Link
        href="/user-support"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        <FiArrowLeft className="w-4 h-4" />
        Back to Support
      </Link>

      {isLoading ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center text-gray-500">
          Loading ticket...
        </div>
      ) : isError || !ticket ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <p className="text-gray-900 font-medium mb-1">Ticket not found</p>
          <p className="text-sm text-gray-500">
            This ticket doesn&apos;t exist, or isn&apos;t associated with your account.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-xs font-medium text-gray-400 mb-1">
                  Ticket #{ticket.ticketId}
                </p>
                <h1 className="text-xl font-semibold text-gray-900">{ticket.subject}</h1>
              </div>
              <StatusBadge status={ticket.status} />
            </div>

            <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4 text-sm text-gray-500">
              <div className="flex items-center gap-1.5">
                <FiClock className="w-4 h-4" />
                <span>Opened {formatDateTime(ticket.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FiTag className="w-4 h-4" />
                <span>{categoryLabel(ticket.category)}</span>
              </div>
              {ticket.orderId && (
                <div className="flex items-center gap-1.5">
                  <span>Order #{ticket.orderId}</span>
                </div>
              )}
              {ticket.assignedAgentName && (
                <div className="flex items-center gap-1.5">
                  <FiUser className="w-4 h-4" />
                  <span>Assigned to {ticket.assignedAgentName}</span>
                </div>
              )}
            </div>

            {ticket.slaBreached && ticket.status !== "RESOLVED" && ticket.status !== "CLOSED" && (
              <div className="mt-4 flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <FiAlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>This ticket has passed its expected response time - we&apos;re on it.</span>
              </div>
            )}
          </div>

          <div className="p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-2">What you told us</h2>
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {ticket.issueDescription}
            </p>

            {ticket.resolvedAt && (
              <div className="mt-6 pt-6 border-t border-gray-100 text-sm text-gray-500">
                Resolved {formatDateTime(ticket.resolvedAt)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
