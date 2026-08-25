import { useQuery } from "@tanstack/react-query";

import { ProductServices } from "@/services/product";

// Shared across DesktopNavbar and MobileNavbar, which mount at the same time (one hidden per
// breakpoint, same responsive pattern as the rest of this app's nav) - without a shared query
// key each fired its own independent request for the same data on every page load. Returns the
// raw API shape; each caller maps it into whatever shape its own UI needs.
export const useCategories = () =>
  useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await ProductServices.getAllCategories();
      return response.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
