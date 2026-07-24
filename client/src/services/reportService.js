import api from "./api";

export const reportService = {
    submitReport: async (data) => {
        const res = await api.post("/reports", data);
        return res.data;
    },

    reportCustomer: async (data) => {
        const res = await api.post("/reports/customer", data);
        return res.data;
    },

    getReports: async () => {
        const res = await api.get("/reports");
        return res.data;
    },

    resolveReport: async (reportId) => {
        const res = await api.patch(`/reports/${reportId}/resolve`);
        return res.data;
    }
};
