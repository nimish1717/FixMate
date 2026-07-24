import api from "./api";

export const workerService = {
    getProfile: async () => {
        const res = await api.get("/workers/me");
        return res.data;
    },

    // Fetches nearby workers via GET /api/workers/nearby
    getNearbyWorkers: async (category, lng, lat, filters = {}) => {
        const res = await api.get("/workers/nearby", {
            params: { 
                category, 
                longitude: lng, 
                latitude: lat, 
                radius: filters.radius || 10000,
                status: filters.status,
                experience: filters.experience,
                trustScore: filters.trustScore,
                sortBy: filters.sortBy
            },
        });
        return res.data; // { success, count, workers }
    },

    // Gets a single worker by ID
    getWorkerById: async (id) => {
        const res = await api.get(`/workers/${id}`);
        return res.data; // { success, worker }
    },

    getEarnings: async () => {
        const res = await api.get("/workers/earnings");
        return res.data;
    },

    updateAvailability: async (status, coords = null) => {
        const payload = { status };
        if (coords) {
            payload.coordinates = [coords.lng, coords.lat];
        }
        const res = await api.patch("/workers/availability", payload);
        return res.data;
    },

    getPendingFees: async () => {
        const res = await api.get("/workers/pending-fees");
        return res.data;
    },

    payFees: async () => {
        const res = await api.post("/workers/pay-fees");
        return res.data;
    },

    acceptVerification: async () => {
        const res = await api.post("/workers/requests/accept");
        return res.data;
    },

    rejectVerification: async () => {
        const res = await api.post("/workers/requests/reject");
        return res.data;
    },

    sendHeartbeat: async () => {
        const res = await api.patch("/workers/heartbeat");
        return res.data;
    },

    getReviews: async () => {
        const res = await api.get("/workers/me/reviews");
        return res.data;
    },

    updateOfflineTimeout: async (timeout) => {
        const res = await api.patch("/workers/me/timeout", { timeout });
        return res.data;
    }
};
