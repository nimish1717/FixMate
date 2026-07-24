import api from "./api";

// Matches backend: POST /api/ml/predict-category
// Sends an image (multipart/form-data), returns predicted category + confidence
export const mlService = {
    predictCategory: async (imageFile) => {
        const formData = new FormData();
        formData.append("issueImage", imageFile); // field name from backend docs

        const res = await api.post("/ml/predict-category", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return res.data;
        // Expected shape (per backend docs):
        // { predictedCategory: "electrical", confidence: 0.94, nearbyWorkers: [...] }
    },
};