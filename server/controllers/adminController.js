const User = require("../models/User");
const Worker = require("../models/Workers");
const Shopkeeper = require("../models/Shopkeeper");
const Booking = require("../models/Booking");
const WorkerLedger = require("../models/WorkerLedger");

let cachedDashboardData = null;

const refreshDashboardData = async () => {
    try {
        const totalUsers = await User.countDocuments({ role: "user" });
        const totalWorkers = await Worker.countDocuments();
        const totalShopkeepers = await Shopkeeper.countDocuments();

        const totalBookings = await Booking.countDocuments();
        const completedBookings = await Booking.countDocuments({ status: "payment_completed" });
        const completedCount = await Booking.countDocuments({ status: { $in: ["completed", "payment_completed"] } });
        const cancelledBookings = await Booking.countDocuments({ status: "cancelled" });

        const revenueAgg = await WorkerLedger.aggregate([
            { $group: { _id: null, total: { $sum: "$platformFee" } } }
        ]);
        const revenue = revenueAgg.length > 0 ? revenueAgg[0].total : 0;

        const ratingAgg = await Worker.aggregate([
            { $group: { _id: null, avg: { $avg: "$rating" } } }
        ]);
        const averageRating = ratingAgg.length > 0 ? parseFloat(ratingAgg[0].avg.toFixed(1)) : 0;

        const mlBookings = await Booking.find({ predictedCategory: { $ne: "" } });
        let correctPredictions = 0;
        mlBookings.forEach(b => {
            if (b.category === b.predictedCategory) correctPredictions++;
        });
        const mlAccuracy = mlBookings.length > 0 ? parseFloat(((correctPredictions / mlBookings.length) * 100).toFixed(1)) : 0;

        const activeWorkers = await Worker.countDocuments({ isActive: true });
        const onlineWorkers = await Worker.countDocuments({ status: "online" });

        cachedDashboardData = {
            totalUsers,
            totalWorkers,
            totalShopkeepers,
            totalBookings,
            completedBookings: completedCount,
            cancelledBookings,
            revenue,
            averageRating,
            mlAccuracy,
            activeWorkers,
            onlineWorkers
        };
        console.log("[CRON] Admin dashboard cache refreshed.");
    } catch (error) {
        console.error("Dashboard Refresh Error:", error.message);
    }
};

const getDashboardData = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // If date filters are provided, bypass cache and compute live
        if (startDate && endDate) {
            const dateQuery = { createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) } };

            const totalUsers = await User.countDocuments({ role: "user", ...dateQuery });
            const totalWorkers = await Worker.countDocuments(dateQuery);
            const totalShopkeepers = await Shopkeeper.countDocuments(dateQuery);

            const totalBookings = await Booking.countDocuments(dateQuery);
            const completedCount = await Booking.countDocuments({ status: { $in: ["completed", "payment_completed"] }, ...dateQuery });
            const cancelledBookings = await Booking.countDocuments({ status: "cancelled", ...dateQuery });

            const revenueAgg = await WorkerLedger.aggregate([
                { $match: { createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
                { $group: { _id: null, total: { $sum: "$platformFee" } } }
            ]);
            const revenue = revenueAgg.length > 0 ? revenueAgg[0].total : 0;

            const ratingAgg = await Worker.aggregate([
                { $match: { createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
                { $group: { _id: null, avg: { $avg: "$rating" } } }
            ]);
            const averageRating = ratingAgg.length > 0 ? parseFloat(ratingAgg[0].avg.toFixed(1)) : 0;

            const mlBookings = await Booking.find({ predictedCategory: { $ne: "" }, ...dateQuery });
            let correctPredictions = 0;
            mlBookings.forEach(b => {
                if (b.category === b.predictedCategory) correctPredictions++;
            });
            const mlAccuracy = mlBookings.length > 0 ? parseFloat(((correctPredictions / mlBookings.length) * 100).toFixed(1)) : 0;

            // Online/Active workers are snapshot states, so we don't apply date bounds to them
            const activeWorkers = await Worker.countDocuments({ isActive: true });
            const onlineWorkers = await Worker.countDocuments({ status: "online" });

            return res.status(200).json({
                success: true,
                data: {
                    totalUsers,
                    totalWorkers,
                    totalShopkeepers,
                    totalBookings,
                    completedBookings: completedCount,
                    cancelledBookings,
                    revenue,
                    averageRating,
                    mlAccuracy,
                    activeWorkers,
                    onlineWorkers
                }
            });
        }

        // Fallback: If cache is null (e.g. server just restarted and cron hasn't fired yet), refresh synchronously once
        if (!cachedDashboardData) {
            await refreshDashboardData();
        }

        res.status(200).json({
            success: true,
            data: cachedDashboardData
        });
    } catch (error) {
        console.error("Dashboard Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

const getManualVerificationAudit = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const [bookings, total] = await Promise.all([
            Booking.find({ status: "repair_verified", "verificationResult.repairDetected": false })
                .populate("user", "name phone")
                .populate({
                    path: "worker",
                    populate: { path: "user", select: "name phone" }
                })
                .sort({ updatedAt: -1 })
                .skip(skip)
                .limit(limit),
            Booking.countDocuments({ status: "repair_verified", "verificationResult.repairDetected": false })
        ]);

        return res.status(200).json({
            success: true,
            total,
            page,
            pages: Math.ceil(total / limit),
            bookings
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getDashboardData, refreshDashboardData, getManualVerificationAudit };
