import { create } from "zustand";

const useUtilityII = create((set, get) => ({
  customizationImagesCustom: [],
  setCustomizationImagesCustom: (updater) =>
    set((state) => ({
      customizationImagesCustom:
        typeof updater === "function"
          ? updater(state.customizationImagesCustom)
          : updater,
    })),
}));

export default useUtilityII;
