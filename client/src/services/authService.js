import api from "./api";

export const authService = {
    register: async (data) => {
        const res = await api.post("/auth/register", data);
        return res.data;
    },

    // NEW: matches backend POST /api/auth/send-otp
    sendOtp: async (data) => {
        const res = await api.post("/auth/send-otp", data);
        return res.data;
    },

    // matches backend POST /api/auth/verify-otp
    login: async (data) => {
        const res = await api.post("/auth/verify-otp", data); // ← updated path
        return res.data;
    },

    getMe: async () => {
        const res = await api.get("/auth/me");
        return res.data;
    },
    // Add inside the authService object:

    // POST /api/auth/admin/login — body: { email, password }
    adminLogin: async (data) => {
        const res = await api.post("/auth/admin/login", data);
        return res.data;
    },
};