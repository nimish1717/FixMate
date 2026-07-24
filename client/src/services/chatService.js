import api from "./api";

export const chatService = {
    getMessages: async (bookingId) => {
        const res = await api.get(`/bookings/${bookingId}/messages`);
        return res.data;
    },
};