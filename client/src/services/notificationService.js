import api from "./api";

// Matches FixMate backend:
// GET /api/notifications
// PATCH /api/notifications/:id/read
// PATCH /api/notifications/mark-all-read
export const notificationService = {
    getAll: async () => {
        const res = await api.get("/notifications");
        return res.data;
    },

    markRead: async (id) => {
        const res = await api.patch(`/notifications/${id}/read`);
        return res.data;
    },

    markAllRead: async () => {
        const res = await api.patch("/notifications/mark-all-read");
        return res.data;
    },
};