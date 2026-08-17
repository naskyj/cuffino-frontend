import axiosInstance from "@/core/api/api";

export const ImageServices = {
  // Single image upload (legacy)
  uploadCustomizationImage: (formData) =>
    axiosInstance.post("/api/images/upload", formData),
  // Multiple images upload
  uploadCustomizationImages: (formData) =>
    axiosInstance.post("/api/images/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),
  deleteCustomizationImage: (imageId) =>
    axiosInstance.delete(`/api/images/delete/${imageId}`),
  listMyImages: (imageType) =>
    axiosInstance.get(`/api/images/mine${imageType ? `?imageType=${imageType}` : ""}`),
};
