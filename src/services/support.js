import axiosInstance from "@/core/api/api";

// A2 (RISK_REGISTER.md) / SOP_CUSTOMER_SUPPORT.md: the customer-facing side of the support
// ticket system - before this there was no in-app way to raise an issue and have it tracked.
export const SupportServices = {
  createTicket: (payload) => axiosInstance.post("/support/tickets", payload),
  getMyTickets: (customerId) =>
    axiosInstance.get(`/support/tickets/mine?customerId=${customerId}`),
  getTicket: (ticketId) => axiosInstance.get(`/support/tickets/${ticketId}`),
};
