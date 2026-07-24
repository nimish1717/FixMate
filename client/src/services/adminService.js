import api from "./api";

// GET /api/admin/dashboard — global system metrics
export const adminService = {
    getDashboard: async (startDate, endDate) => {
        const params = {};
        if (startDate && endDate) {
            params.startDate = startDate;
            params.endDate = endDate;
        }
        const res = await api.get("/admin/dashboard", { params });
        return res.data;
    },
    getShopkeepers: async () => {
        const res = await api.get("/shopkeepers/get-shopkeepers");
        return res.data;
    },
    verifyShopkeeper: async (id, isVerified) => {
        const res = await api.patch(`/shopkeepers/verify-shopkeeper/${id}`, { isVerified });
        return res.data;
    },
};