// Utility functions for managing recently viewed products

export const addToRecentlyViewed = (product) => {
  try {
    // Get existing recently viewed products
    const stored = localStorage.getItem("recentlyViewedProducts");
    let recentlyViewed = stored ? JSON.parse(stored) : [];

    // Remove the product if it already exists (to avoid duplicates)
    recentlyViewed = recentlyViewed.filter((p) => p.id !== product.id);

    // Add the new product to the beginning
    recentlyViewed.unshift(product);

    // Keep only the last 10 products
    recentlyViewed = recentlyViewed.slice(0, 10);

    // Save back to localStorage
    localStorage.setItem(
      "recentlyViewedProducts",
      JSON.stringify(recentlyViewed)
    );
  } catch (error) {
    console.error("Error saving recently viewed product:", error);
  }
};

export const getRecentlyViewed = () => {
  try {
    const stored = localStorage.getItem("recentlyViewedProducts");
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error getting recently viewed products:", error);
    return [];
  }
};

export const clearRecentlyViewed = () => {
  try {
    localStorage.removeItem("recentlyViewedProducts");
  } catch (error) {
    console.error("Error clearing recently viewed products:", error);
  }
};
