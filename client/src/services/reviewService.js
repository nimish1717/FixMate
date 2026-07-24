import api from "./api";

// Matches backend: POST /api/bookings/:id/review
// data: { punctuality, behaviour, quality, cleanliness, comment }
export const reviewService = {
    submit: async (bookingId, data) => {
        const res = await api.post(`/bookings/${bookingId}/review`, data);
        return res.data;
    },
};