import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface ListPreferences {
  pageSize: number;
  setPageSize: (size: number) => void;
}

/** Non-sensitive per-user view preference — safe to keep in localStorage. */
export const useListPreferences = create<ListPreferences>()(
  persist(
    (set) => ({
      pageSize: 10,
      setPageSize: (pageSize) => set({ pageSize }),
    }),
    {
      name: "nb-loan-list-prefs",
      storage: createJSONStorage(() => localStorage),
      // Rehydrate after mount so server and first client render agree (no hydration mismatch).
      skipHydration: true,
    },
  ),
);
