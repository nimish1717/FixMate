import { create } from "zustand";

// Holds just the unread count, used by Topbar's bell badge.
// Notifications.jsx fetches the full list separately via notificationService.
export const useNotificationStore = create((set) => ({
    unreadCount: 0,

    setUnreadCount: (count) => set({ unreadCount: count }),

    decrement: () =>
        set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) })),

    reset: () => set({ unreadCount: 0 }),

    // Called when socket 'notification:new' fires
    increment: () =>
        set((state) => ({ unreadCount: state.unreadCount + 1 })),
}));