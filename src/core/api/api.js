import axios from "axios";
import useAuth from "@/core/zustand/auth.store";

// Retrieve the base url from environment variables or set a default
const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Create an Axios instance with a base URL and default headers
const axiosInstance = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to include the API token and Bearer token in headers
axiosInstance.interceptors.request.use(
  (config) => {
    // Retrieve tokens and other required information from localStorage
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token"); // Assuming Bearer token is stored here

      // Add Bearer token to request headers if it exists
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        axiosInstance.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${token}`;
      }
    }
    if (config.data instanceof FormData) {
      // If it's a FormData request, we don't need to set Content-Type manually, it'll be automatically done by axios
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error) => {
    // Handle request error
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const prevRequest = error?.config;

    if (error?.response?.status === 401 && typeof window !== "undefined") {
      const requestUrl = String(prevRequest?.url || "");
      const isRefreshCall = requestUrl.includes("/user/refresh");
      const refreshToken = localStorage.getItem("refreshToken");
      const authStore = useAuth.getState();

      if (!prevRequest?._retry && refreshToken && !isRefreshCall) {
        prevRequest._retry = true;

        try {
          const refreshResponse = await axios.post(
            `${baseURL}/user/refresh`,
            {
              refreshToken,
            },
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          const newToken = refreshResponse?.data?.token;
          const newRefreshToken = refreshResponse?.data?.refreshToken;
          const refreshedUser = refreshResponse?.data?.user;

          if (newToken) {
            localStorage.setItem("token", newToken);
            if (newRefreshToken) {
              localStorage.setItem("refreshToken", newRefreshToken);
            }

            authStore?.setToken?.(newToken);
            if (newRefreshToken) {
              authStore?.setRefreshToken?.(newRefreshToken);
            }
            if (refreshedUser) {
              authStore?.setUser?.(refreshedUser);
            }

            prevRequest.headers = prevRequest.headers || {};
            prevRequest.headers.Authorization = `Bearer ${newToken}`;

            return axiosInstance(prevRequest);
          }
        } catch (refreshError) {
          // Fall through to clean logout below.
        }
      }

      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      authStore?.logout?.();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
