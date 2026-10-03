"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  FiBell,
  FiCreditCard,
  FiPackage,
  FiRotateCcw,
  FiHelpCircle,
  FiEdit3,
} from "react-icons/fi";

import { NotificationServices } from "@/services/notifications";

// This page used to be a set of on/off toggles (mentions, follows, shares, weekly digest) held in
// local state - they saved nowhere, nothing read them, and none of them corresponded to anything
// Cuffino actually sends. It's now the real feed: order progress, payments and refunds, returns,
// and support replies, served per-recipient from the backend.

const PAGE_SIZE = 20;

const TYPE_META = {
  ORDER_PLACED: { icon: FiPackage, label: "Order", tint: "bg-blue-50 text-blue-600" },
  ORDER_STATUS: { icon: FiPackage, label: "Order", tint: "bg-indigo-50 text-indigo-600" },
  PAYMENT: { icon: FiCreditCard, label: "Payment", tint: "bg-green-50 text-green-600" },
  RETURN: { icon: FiRotateCcw, label: "Return", tint: "bg-orange-50 text-orange-600" },
  SUPPORT: { icon: FiHelpCircle, label: "Support", tint: "bg-purple-50 text-purple-600" },
  MEASUREMENT: { icon: FiEdit3, label: "Measurement", tint: "bg-teal-50 text-teal-600" },
  SYSTEM: { icon: FiBell, label: "Update", tint: "bg-gray-100 text-gray-600" },
};

const formatWhen = (iso) => {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return "";

  const minutes = Math.floor((Date.now() - then.getTime()) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 60 * 24) return `${Math.floor(minutes / 60)}h ago`;
  if (minutes < 60 * 24 * 7) return `${Math.floor(minutes / (60 * 24))}d ago`;
  return then.toLocaleString();
};

export default function UserNotification() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [unreadOnly, setUnreadOnly] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["notifications", { page, unreadOnly }],
    queryFn: async () => {
      const response = await NotificationServices.list({
        page,
        unreadOnly,
        size: PAGE_SIZE,
      });
      return response?.data;
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["notifications"] });

  const markRead = useMutation({
    mutationFn: (id) => NotificationServices.markRead(id),
    onSuccess: invalidate,
  });

  const markAllRead = useMutation({
    mutationFn: () => NotificationServices.markAllRead(),
    onSuccess: (response) => {
      const count = response?.data?.markedRead ?? 0;
      toast.success(count > 0 ? `Marked ${count} as read` : "Nothing left to mark");
      invalidate();
    },
    onError: () => toast.error("Couldn't mark your notifications read"),
  });

  const remove = useMutation({
    mutationFn: (id) => NotificationServices.remove(id),
    onSuccess: invalidate,
    onError: () => toast.error("Couldn't remove that notification"),
  });

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  const openNotification = (notification) => {
    if (!notification.read) {
      // Fire and forget - landing on the page the notification points at matters more than
      // whether the read flag made it.
      markRead.mutate(notification.notificationId);
    }
    if (notification.link) {
      router.push(notification.link);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FiBell className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
              <p className="text-sm text-gray-500">
                {unreadCount > 0
                  ? `${unreadCount} unread`
                  : "You're all caught up"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={unreadOnly}
                onChange={(event) => {
                  setUnreadOnly(event.target.checked);
                  setPage(0);
                }}
                className="h-4 w-4 rounded border-gray-300"
              />
              Unread only
            </label>
            <button
              type="button"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending || unreadCount === 0}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Mark all read
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-10 text-center text-sm text-gray-500">
            Loading your notifications...
          </div>
        ) : isError ? (
          <div className="p-10 text-center text-sm text-red-600">
            We couldn&apos;t load your notifications. Please refresh and try again.
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center">
            <FiBell className="mx-auto h-8 w-8 text-gray-300" />
            <p className="mt-3 text-sm font-medium text-gray-900">
              {unreadOnly ? "No unread notifications" : "Nothing here yet"}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              We&apos;ll let you know here when your order moves, a payment or refund goes
              through, or support replies to you.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {notifications.map((notification) => {
              const meta = TYPE_META[notification.type] || TYPE_META.SYSTEM;
              const Icon = meta.icon;
              return (
                <li key={notification.notificationId}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => openNotification(notification)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openNotification(notification);
                      }
                    }}
                    className={`flex cursor-pointer items-start gap-4 px-6 py-4 transition-colors hover:bg-gray-50 ${
                      notification.read ? "" : "bg-primary/5"
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${meta.tint}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h6
                        className={`text-sm ${
                          notification.read
                            ? "text-gray-700"
                            : "font-semibold text-gray-900"
                        }`}
                      >
                        {notification.title}
                      </h6>
                      {notification.message && (
                        <p className="mt-0.5 text-xs text-gray-500">
                          {notification.message}
                        </p>
                      )}
                      <p className="mt-1 text-[11px] text-gray-400">
                        {formatWhen(notification.createdAt)}
                      </p>
                    </div>

                    {!notification.read && (
                      <span
                        className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-primary"
                        aria-label="Unread"
                      />
                    )}
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        remove.mutate(notification.notificationId);
                      }}
                      className="flex-shrink-0 rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700"
                      aria-label={`Remove notification: ${notification.title}`}
                    >
                      &times;
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {(data?.totalPages ?? 0) > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(current - 1, 0))}
              disabled={page === 0}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {page + 1} of {data?.totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((current) => current + 1)}
              disabled={page + 1 >= (data?.totalPages ?? 1)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
