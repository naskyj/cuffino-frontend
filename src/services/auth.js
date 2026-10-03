import axiosInstance from "@/core/api/api"

export const AuthServices = {
    register_user : (payload) => axiosInstance.post('/user/add', payload),
    login_user : (payload) => axiosInstance.post('/user/login', payload),
    verify_user: (payload) => axiosInstance.post(`/user/verify`, payload),
    send_password_otp: (payload) => axiosInstance.post(`/user/send-password-otp`, payload),
    change_password: (payload) => axiosInstance.post(`/user/change-password`, payload),
    // Forgot-password step 2. Distinct from change_password, which also requires the CURRENT
    // password - something nobody completing a "I forgot my password" flow can supply.
    reset_password: (payload) => axiosInstance.post(`/user/reset-password`, payload)
}