import { create } from "zustand";
import { persist } from "zustand/middleware";
import { workerService } from "../services/workerService";

// Worker's online/offline toggle. Separate from authStore since
// this changes often and shouldn't trigger auth-related re-renders.
export const useWorkerStore = create(
    persist(
        (set, get) => ({
            isOnline: false,
            toggleOnline: async (coords = null) => {
                const current = get().isOnline;
                const nextStatus = !current;

                set({ isOnline: nextStatus });

                try {
                    await workerService.updateAvailability(nextStatus ? "online" : "offline", coords);
                } catch (error) {
                    // Revert if API fails
                    set({ isOnline: current });
                    console.error("Failed to update availability:", error);
                }
            },
            setOnline: (value) => set({ isOnline: value }),
        }),
        {
            name: "worker-status-storage",
        }
    )
);