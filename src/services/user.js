import axiosInstance from "@/core/api/api";

export const UserServices = {
    updateUser: (payload, userId) => axiosInstance.put(`/user/update/${userId}`, payload),
    getUser: (id) => axiosInstance.get(`/user/get/${id}`),
    getUserMeasurements: (id) => axiosInstance.get(`/user/measurements/${id}`),
    addUserMeasurements: (payload) => axiosInstance.post(`/user/measurements`, payload),
    updateUserMeasurements: (id, payload) => axiosInstance.put(`/user/measurements/${id}`, payload),
    deleteUserMeasurements: (id) => axiosInstance.delete(`/user/measurements/${id}`),
    getUsersAddresses: (userId) => axiosInstance.get(`/users/${userId}/addresses`),
    addAddress: (userId, payload) => axiosInstance.post(`/users/${userId}/addresses`, payload),
    getUserAddressDetails: (userId, addressId) => axiosInstance.get(`/users/${userId}/addresses/${addressId}`),
    editUserAddressDetails: (userId, addressId) => axiosInstance.put(`/users/${userId}/addresses/${addressId}`),
    deleteUserAddressDetails: (userId, addressId) => axiosInstance.delete(`/users/${userId}/addresses/${addressId}`),
    setDefaultAddress: (userId, addressId) => axiosInstance.patch(`/users/${userId}/addresses/${addressId}/set-default`)
}