import axiosInstance from "@/core/api/api"

export const AuthServices = {
    register_user : (payload) => axiosInstance.post('/user/add', payload),
    login_user : (payload) => axiosInstance.post('/user/login', payload),
    verify_user: (payload) => axiosInstance.post(`/user/verify`, payload),
    change_password: (payload) => axiosInstance.post(`/user/change-password`, payload)
}