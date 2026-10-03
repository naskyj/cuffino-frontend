import axiosInstance from "@/core/api/api";

// The recipient is resolved from the JWT on the backend - none of these take a user id, so there
// is no parameter that could point the feed at somebody else's notifications.
export const NotificationServices = {
  list: ({ unreadOnly = false, page = 0, size = 20 } = {}) =>
    axiosInstance.get(
      `/notifications/mine?unreadOnly=${unreadOnly}&page=${page}&size=${size}`
    ),
  unreadCount: () => axiosInstance.get(`/notifications/mine/unread-count`),
  markRead: (notificationId) =>
    axiosInstance.put(`/notifications/${notificationId}/read`),
  markAllRead: () => axiosInstance.put(`/notifications/mine/read-all`),
  remove: (notificationId) =>
    axiosInstance.delete(`/notifications/${notificationId}`),
};
