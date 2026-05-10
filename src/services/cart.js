import axiosInstance from "@/core/api/api";

export const CartServices = {
  addToCart: (payload, userId) =>
    axiosInstance.post(`/cart/${userId}/add/json`, payload),
  getCart: (userId) => axiosInstance.get(`/cart/${userId}`),
  updateCart: (userId, cartItemId, payload) =>
    axiosInstance.put(`/cart/${userId}/items/${cartItemId}`, payload),
  deleteCartItem: (userId, cartItemId) =>
    axiosInstance.delete(`/cart/${userId}/items/${cartItemId}`),
  clearCart: (userId) => axiosInstance.delete(`/cart/${userId}clear`),
};
