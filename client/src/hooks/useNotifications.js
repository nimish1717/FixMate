import { useEffect } from "react";
import { useSocket } from "./useSocket";
import { useNotificationStore } from "../store/notificationStore";
import { notificationService } from "../services/notificationService";

// Call this once near the app root (e.g. inside PageWrapper) so the
// unread badge stays in sync everywhere via the shared store.
export function useNotifications() {
    const socket = useSocket();
    const setUnreadCount = useNotificationStore((state) => state.setUnreadCount);
    const increment = useNotificationStore((state) => state.increment);

    // Initial unread count on load
    useEffect(() => {
        const fetchInitial = async () => {
            try {
                const data = await notificationService.getAll();
                const notifications = data.notifications || data || [];
                const unread = notifications.filter((n) => !n.isRead).length;
                setUnreadCount(unread);
            } catch {
                // silent fail — badge just stays at 0
            }
        };
        fetchInitial();
    }, [setUnreadCount]);

    // Live updates
    useEffect(() => {
        if (!socket) return;
        const handler = () => increment();
        socket.on("notification:new", handler);
        return () => socket.off("notification:new", handler);
    }, [socket, increment]);
}