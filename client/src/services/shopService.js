import api from "./api";

export const shopService = {
    getNearbyShops: async (lat, lng, radius = 5000) => {
        const res = await api.get(`/shops/nearby`, { params: { lat, lng, radius } });
        return res.data;
    }
};
