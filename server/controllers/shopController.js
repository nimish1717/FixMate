const Shop = require("../models/Shop");

const getNearbyShops = async (req, res) => {
    try {
        const { lat, lng, radius = 5000, verified = "true" } = req.query;

        if (!lat || !lng) {
            return res.status(400).json({
                success: false,
                message: "Latitude and longitude are required",
            });
        }

        let shops = await Shop.find({
            location: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [parseFloat(lng), parseFloat(lat)],
                    },
                    $maxDistance: parseInt(radius),
                },
            },
            isActive: true,
        }).populate({
            path: "shopkeeperId",
            select: "isVerified rating",
            populate: {
                path: "user",
                select: "name phone",
            },
        });

        if (verified === "true") {
            shops = shops.filter(shop => shop.shopkeeperId?.isVerified);
        }

        res.status(200).json({
            success: true,
            count: shops.length,
            shops,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    getNearbyShops,
};
