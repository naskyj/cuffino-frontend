import axiosInstance from "@/core/api/api";

export const ProductServices = {
  getProductById: (id) => axiosInstance.get(`/product/get/${id}`),
  getAllProducts: () => axiosInstance.get(`/product/all`),
  searchProducts: ({ name, category }) =>
    axiosInstance.get(`/product/search`, { params: { name, category } }),
  getAllCategories: () => axiosInstance.get(`/product/category/all`),
};

export const InventoryServices = {
  getAllInventory: () => axiosInstance.get(`/inventory/all`),
};
