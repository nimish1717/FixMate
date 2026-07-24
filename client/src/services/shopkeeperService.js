import api from "./api";

// Shopkeeper module — endpoints assumed based on backend feature docs.
// Confirm exact routes with backend before relying on these.
export const shopkeeperService = {
    // GET /api/shopkeepers/me — shop profile + verification status
    getProfile: async () => {
        const res = await api.get("/shopkeepers/me");
        return res.data;
    },

    // GET /api/workers/my-workers — list of workers registered by this shopkeeper
    getMyWorkers: async () => {
        const res = await api.get("/workers/my-workers");
        return res.data;
    },

    // POST /api/workers — register a new worker
    // data: { name, phone, category, experience }
    registerWorker: async (data) => {
        const res = await api.post("/workers", data);
        return res.data;
    },

    // PUT /api/workers/:id — update worker details
    updateWorker: async (workerId, data) => {
        const res = await api.put(`/workers/${workerId}`, data);
        return res.data;
    },

    // DELETE /api/workers/:id/remove — remove worker from shop
    removeWorker: async (workerId) => {
        const res = await api.delete(`/workers/${workerId}/remove`);
        return res.data;
    },

    searchWorkerByPhone: async (phone) => {
        const res = await api.get(`/workers/search?phone=${phone}`);
        return res.data;
    },

    requestVerification: async (workerId) => {
        const res = await api.post(`/workers/${workerId}/request-verification`);
        return res.data;
    },
};