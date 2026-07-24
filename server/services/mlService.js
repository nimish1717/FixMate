const axios = require("axios");
const FormData = require("form-data");

exports.predictIssue = async (imageUrl) => {
    try {
        if (!process.env.ML_API_URL) {
            console.warn("ML_API_URL is missing. Using fallback for local dev.");
        }
        const apiUrl = process.env.ML_API_URL ? `${process.env.ML_API_URL}/classify` : 'http://127.0.0.1:5000/api/classify';

        // Fetch image stream from Cloudinary
        const imageResponse = await axios.get(imageUrl, { responseType: 'stream' });

        const form = new FormData();
        form.append('image', imageResponse.data, 'issue.jpg');

        const mlResponse = await axios.post(apiUrl, form, {
            headers: form.getHeaders()
        });

        const { category, confidence, all_scores } = mlResponse.data;

        return {
            predictedCategory: category,
            confidence: confidence,
            allScores: all_scores,
            success: true
        };

    } catch (error) {
        console.error("ML Prediction Error:", error.message);
        return {
            predictedCategory: null,
            success: false,
            error: error.message
        };
    }
};
