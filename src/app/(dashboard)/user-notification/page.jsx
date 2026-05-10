"use client";

import React, { useState } from "react";
import { FiBell, FiMail, FiTag, FiMessageSquare, FiUsers, FiActivity } from "react-icons/fi";

// Toggle Switch Component
const ToggleSwitch = ({ id, checked, onChange }) => (
  <label className="relative inline-flex items-center cursor-pointer">
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={onChange}
      className="sr-only peer"
    />
    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
  </label>
);

// Notification Item Component
const NotificationItem = ({ icon: Icon, title, description, id, checked, onChange }) => (
  <div className="flex items-center justify-between py-4">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-gray-500" />
      </div>
      <div>
        <h6 className="text-sm font-medium text-gray-900">{title}</h6>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </div>
    <ToggleSwitch id={id} checked={checked} onChange={onChange} />
  </div>
);

export default function UserNotification() {
  const [notifications, setNotifications] = useState({
    mentions: false,
    follows: true,
    shares: false,
    messages: false,
    sales: true,
    news: false,
    weekly: true,
    unsubscribe: false,
  });

  const handleToggle = (key) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Account Notifications */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FiBell className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Account Notifications</h2>
              <p className="text-sm text-gray-500">Manage your account activity alerts</p>
            </div>
          </div>
        </div>

        <div className="p-6 divide-y divide-gray-100">
          <NotificationItem
            icon={FiUsers}
            title="Mentions"
            description="Get notified when someone mentions you"
            id="mentions"
            checked={notifications.mentions}
            onChange={() => handleToggle('mentions')}
          />
          <NotificationItem
            icon={FiUsers}
            title="New Followers"
            description="Get notified when someone follows you"
            id="follows"
            checked={notifications.follows}
            onChange={() => handleToggle('follows')}
          />
          <NotificationItem
            icon={FiActivity}
            title="Activity Shares"
            description="Get notified when someone shares your activity"
            id="shares"
            checked={notifications.shares}
            onChange={() => handleToggle('shares')}
          />
          <NotificationItem
            icon={FiMessageSquare}
            title="Direct Messages"
            description="Get notified when you receive a message"
            id="messages"
            checked={notifications.messages}
            onChange={() => handleToggle('messages')}
          />
        </div>
      </div>

      {/* Marketing Notifications */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <FiMail className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Marketing Notifications</h2>
              <p className="text-sm text-gray-500">Stay updated with our latest offers</p>
            </div>
          </div>
        </div>

        <div className="p-6 divide-y divide-gray-100">
          <NotificationItem
            icon={FiTag}
            title="Sales & Promotions"
            description="Be the first to know about sales and special offers"
            id="sales"
            checked={notifications.sales}
            onChange={() => handleToggle('sales')}
          />
          <NotificationItem
            icon={FiMail}
            title="Company News"
            description="Updates about our company and new features"
            id="news"
            checked={notifications.news}
            onChange={() => handleToggle('news')}
          />
          <NotificationItem
            icon={FiBell}
            title="Weekly Digest"
            description="Weekly summary of your account activity"
            id="weekly"
            checked={notifications.weekly}
            onChange={() => handleToggle('weekly')}
          />
        </div>
      </div>

      {/* Email Preferences Info */}
      <div className="bg-gray-50 rounded-xl p-4">
        <p className="text-sm text-gray-500 text-center">
          You can also manage your email preferences from your email client by clicking unsubscribe at the bottom of our emails.
        </p>
      </div>
    </div>
  );
}
