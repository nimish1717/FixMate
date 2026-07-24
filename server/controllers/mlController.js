const Worker = require("../models/Workers");
const mlService = require("../services/mlService");

function normalizeToClientId(category) {
    if (!category) return "";
    const lower = category.toLowerCase().trim();
    if (lower.includes("plumb")) return "plumbing";
    if (lower.includes("electr")) return "electrical";
    if (lower.includes("ac") || lower.includes("air")) return "ac_repair";
    return lower;
}

const clientToDbCategory = {
    plumbing: "Plumbing",
    electrical: "Electrical",
    ac_repair: "AC Repair"
};

exports.predictCategory = async (req, res) => {
    try {
        if (!req.file || !req.file.path) {
            return res.status(400).json({ success: false, message: "Image upload failed or missing" });
        }

        const imagePath = req.file.path;

        const prediction = await mlService.predictIssue(imagePath);

        if (!prediction.success) {
            return res.status(500).json({
                success: false,
                message: "Failed to predict category from image",
                error: prediction.error
            });
        }

        const clientCategory = normalizeToClientId(prediction.predictedCategory);
        const dbCategory = clientToDbCategory[clientCategory] || clientCategory;

        const { longitude, latitude } = req.body;

        let query = {
            category: dbCategory,
            isActive: true,
            status: "online"
        };

        if (longitude && latitude) {
            query.location = {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [parseFloat(longitude), parseFloat(latitude)]
                    },
                    $maxDistance: 10000
                }
            };
        }

        const nearbyWorkers = await Worker.find(query).limit(10);

        // Build alternatives
        const alternatives = [];
        if (prediction.allScores) {
            for (const [key, score] of Object.entries(prediction.allScores)) {
                const normalizedKey = normalizeToClientId(key);
                if (normalizedKey !== clientCategory) {
                    alternatives.push({
                        category: normalizedKey,
                        confidence: score
                    });
                }
            }
            alternatives.sort((a, b) => b.confidence - a.confidence);
        }

        res.status(200).json({
            success: true,
            predictedCategory: clientCategory,
            confidence: prediction.confidence,
            alternatives,
            imagePath,
            nearbyWorkers
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
