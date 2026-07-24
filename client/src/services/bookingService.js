import api from "./api";

// All booking lifecycle API calls live here.
// Matches FixMate backend booking routes.
export const bookingService = {
    // POST /api/bookings/create
    // data: { workerId, category, issueImage (File), location: {lat, lng}, address }
    create: async (data) => {
        const formData = new FormData();
        formData.append("workerId", data.workerId);
        formData.append("category", data.category);
        formData.append("latitude", data.location.lat);
        formData.append("longitude", data.location.lng);
        if (data.address) formData.append("address", data.address);
        if (data.issueImage) formData.append("issueImage", data.issueImage);
        if (data.issueDescription) formData.append("issueDescription", data.issueDescription);
        if (data.scheduledAt) formData.append("scheduledAt", data.scheduledAt);

        const res = await api.post("/bookings/create", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return res.data;
    },

    getById: async (id) => {
        const res = await api.get(`/bookings/${id}`);
        return res.data;
    },

    getActive: async () => {
        const res = await api.get("/bookings/active");
        return res.data;
    },

    cancel: async (id, reason) => {
        const res = await api.post(`/bookings/${id}/cancel`, { reason });
        return res.data;
    },


    verifyArrival: async (id, otp) => {
        const res = await api.patch(`/bookings/${id}/verify-arrival-otp`, { otp });
        return res.data;
    },

    confirmPrice: async (id, agreedPrice) => {
        const res = await api.patch(`/bookings/${id}/confirm-price`, { agreedPrice, customerConfirmed: true });
        return res.data;
    },

    uploadBeforePhoto: async (id, file) => {
        const formData = new FormData();
        formData.append("image", file);
        const res = await api.patch(`/bookings/${id}/before-photo`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return res.data;
    },

    uploadAfterPhoto: async (id, file) => {
        const formData = new FormData();
        formData.append("image", file);
        const res = await api.patch(`/bookings/${id}/after-photo`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return res.data;
    },

    verifyCompletion: async (id, otp) => {
        const res = await api.patch(`/bookings/${id}/verify-completion-otp`, { otp });
        return res.data;
    },

    confirmCash: async (id) => {
        const res = await api.patch(`/bookings/${id}/confirm-cash`);
        return res.data;
    },

    // GET /api/bookings/:id/otps
    getOtps: async (id) => {
        const res = await api.get(`/bookings/${id}/otps`);
        return res.data;
    },

    getMyBookings: async (dateRange = "") => {
        const res = await api.get("/bookings/my", { params: { dateRange } });
        return res.data;
    },

    accept: async (id) => {
        const res = await api.patch(`/bookings/${id}/accept`);
        return res.data;
    },

    quotePrice: async (id, extraCharge) => {
        const res = await api.patch(`/bookings/${id}/quote-price`, { extraCharge });
        return res.data;
    },
    // PATCH /api/bookings/:id/pay — body: { paymentMethod, paymentId?, orderId?, transactionId? }
    pay: async (id, paymentData) => {
        const res = await api.patch(`/bookings/${id}/pay`, paymentData);
        return res.data;
    },

    // Phase 4: Worker marks arrival at customer's gate — sends GPS for server-side geofence check
    // PATCH /api/bookings/:id/mark-at-gate  body: { latitude, longitude }
    markAtGate: async (id, { latitude, longitude }) => {
        const res = await api.patch(`/bookings/${id}/mark-at-gate`, { latitude, longitude });
        return res.data;
    },

    getWorkerBookings: async () => {
        const res = await api.get("/bookings/worker");
        return res.data;
    },

    // Phase 1: Two-Stage Invoicing — Spare Parts Approval

    // PATCH /api/bookings/:id/request-spare-parts (worker)
    requestSpareParts: async (id, { sparePartsCost, sparePartsDescription }) => {
        const res = await api.patch(`/bookings/${id}/request-spare-parts`, {
            sparePartsCost,
            sparePartsDescription,
        });
        return res.data;
    },

    // PATCH /api/bookings/:id/respond-spare-parts (customer)
    // approved: boolean
    respondToSpareParts: async (id, approved) => {
        const res = await api.patch(`/bookings/${id}/respond-spare-parts`, { approved });
        return res.data;
    },
};