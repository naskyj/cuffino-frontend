import axiosInstance from "@/core/api/api";

export const OrdersServices = {
  convertToOrder: (userId, payload) =>
    axiosInstance.post(`/cart/${userId}/convert-to-order`, payload),
  createOrder: (payload) => axiosInstance.post("/order/add", payload),
  getOrder: (orderId) => axiosInstance.get(`/order/get/${orderId}`),
  getAllOrders: (userId) => axiosInstance.get(`/order/customer/${userId}`),
  initiatePayment: (orderId, payload) =>
    axiosInstance.post(`/payments/orders/${orderId}/initiate`, payload),
  capturePayment: (orderId, payload) =>
    axiosInstance.post(`/payments/orders/${orderId}/capture`, payload),
  updateOrderShipmentAddress: (orderId, payload) =>
    axiosInstance.put(`/order/${orderId}/shipping-address`, payload),
};
