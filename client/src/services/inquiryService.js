import api from "./api";

export const inquiryService = {
    createOrGetInquiry: async (shopId) => {
        const res = await api.post("/inquiries", { shopId });
        return res.data;
    },
    getInquiries: async () => {
        const res = await api.get("/inquiries");
        return res.data;
    },
    getInquiryById: async (id) => {
        const res = await api.get(`/inquiries/${id}`);
        return res.data;
    },
    getMessages: async (id) => {
        const res = await api.get(`/inquiries/${id}/messages`);
        return res.data;
    },
};
