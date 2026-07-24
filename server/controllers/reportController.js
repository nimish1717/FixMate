const Report = require("../models/Report");
const Booking = require("../models/Booking");
const Shopkeeper = require("../models/Shopkeeper");
const User = require("../models/User");

const VALID_WORKER_REPORT_CATEGORIES = [
    "Poor Workmanship",
    "Overcharging",
    "Unprofessional Behavior",
    "Did Not Show Up",
    "Damage to Property",
    "Other",
];

const VALID_CUSTOMER_REPORT_CATEGORIES = [
    "Wasted Time",
    "Wrong Address",
    "Abusive Behavior",
    "Refused to Pay",
    "Fake Booking",
    "Other",
];

const CUSTOMER_DEDUCTIONS = {
    "Wasted Time": 10,
    "Wrong Address": 10,
    "Abusive Behavior": 20,
    "Refused to Pay": 15,
    "Fake Booking": 20,
    "Other": 5,
};

const createReport = async (req, res) => {
    try {
        const { bookingId, category, note } = req.body;

        if (!bookingId || !category) {
            return res.status(400).json({ success: false, message: "bookingId and category are required" });
        }
        if (!VALID_WORKER_REPORT_CATEGORIES.includes(category)) {
            return res.status(400).json({ success: false, message: "Invalid report category" });
        }
        if (note && note.length > 500) {
            return res.status(400).json({ success: false, message: "Note must be 500 characters or fewer" });
        }

        const booking = await Booking.findById(bookingId).populate("worker");
        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        if (booking.user.toString() !== req.user.id.toString()) {
            return res.status(403).json({ success: false, message: "Not authorized to report this booking" });
        }

        if (!["payment_completed", "completed"].includes(booking.status)) {
            return res.status(400).json({ success: false, message: "You can only report after the booking is completed" });
        }

        const existingReport = await Report.findOne({ booking: bookingId, reporter: req.user.id, reportType: "worker_report" });
        if (existingReport) {
            return res.status(409).json({ success: false, message: "You have already submitted a report for this booking" });
        }

        const customerUser = await User.findById(req.user.id);
        let requiresAdminReview = false;
        const reviewReasons = [];

        if (customerUser) {
            const accountAgeMs = Date.now() - new Date(customerUser.createdAt).getTime();
            const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;
            if (accountAgeMs < TWO_DAYS_MS) {
                requiresAdminReview = true;
                reviewReasons.push("Reporter account is less than 2 days old");
            }
            const completedBookingCount = await Booking.countDocuments({
                user: req.user.id,
                status: { $in: ["payment_completed", "completed"] },
                _id: { $ne: booking._id },
            });
            if (completedBookingCount === 0) {
                requiresAdminReview = true;
                reviewReasons.push("Reporter has no previously completed bookings");
            }
        }

        const report = await Report.create({
            booking: booking._id,
            reporter: req.user.id,
            worker: booking.worker._id,
            shopkeeper: booking.worker.shopkeeper,
            category,
            note: note || "",
            reportType: "worker_report",
            requiresAdminReview,
            adminReviewReason: reviewReasons.join("; "),
            status: requiresAdminReview ? "pending_review" : "open",
        });

        return res.status(201).json({
            success: true,
            message: requiresAdminReview
                ? "Report submitted — pending admin review before any action is taken"
                : "Report submitted successfully",
            report
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const createCustomerReport = async (req, res) => {
    try {
        const { bookingId, category, note } = req.body;

        if (!bookingId || !category) {
            return res.status(400).json({ success: false, message: "bookingId and category are required" });
        }
        if (!VALID_CUSTOMER_REPORT_CATEGORIES.includes(category)) {
            return res.status(400).json({ success: false, message: "Invalid report category" });
        }
        if (note && note.length > 500) {
            return res.status(400).json({ success: false, message: "Note must be 500 characters or fewer" });
        }

        const booking = await Booking.findById(bookingId).populate("worker");
        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        if (booking.worker.user.toString() !== req.user.id.toString()) {
            return res.status(403).json({ success: false, message: "Not authorized to report this customer" });
        }

        if (!["payment_completed", "completed", "cancelled", "cancelled_price_disagreement"].includes(booking.status)) {
            return res.status(400).json({ success: false, message: "Booking must be in a completed or cancelled state to file a report" });
        }

        const existingReport = await Report.findOne({ booking: bookingId, reporter: req.user.id, reportType: "customer_report" });
        if (existingReport) {
            return res.status(409).json({ success: false, message: "You have already submitted a report for this booking" });
        }

        const customerUser = await User.findById(booking.user);
        let requiresAdminReview = false;
        const reviewReasons = [];

        if (customerUser) {
            const accountAgeMs = Date.now() - new Date(customerUser.createdAt).getTime();
            const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;
            if (accountAgeMs < TWO_DAYS_MS) {
                requiresAdminReview = true;
                reviewReasons.push("Reporter account is less than 2 days old");
            }
            const completedBookingCount = await Booking.countDocuments({
                user: booking.user,
                status: { $in: ["payment_completed", "completed"] },
                _id: { $ne: booking._id },
            });
            if (completedBookingCount === 0) {
                requiresAdminReview = true;
                reviewReasons.push("Reporter has no previously completed bookings");
            }
        }
        const report = await Report.create({
            booking: booking._id,
            reporter: req.user.id,
            worker: booking.worker._id,
            shopkeeper: booking.worker.shopkeeper,
            category,
            reportType: "customer_report",
            note: note || "",
            requiresAdminReview,
            adminReviewReason: reviewReasons.join("; "),
            status: requiresAdminReview ? "pending_review" : "open",
        });

        if (!requiresAdminReview && customerUser) {
            const deduction = CUSTOMER_DEDUCTIONS[category] ?? 5;
            customerUser.trustScore = Math.max(0, customerUser.trustScore - deduction);
            await customerUser.save();
        }

        return res.status(201).json({
            success: true,
            message: requiresAdminReview
                ? "Report submitted — pending admin review before score deduction"
                : "Customer reported successfully",
            report,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const confirmReport = async (req, res) => {
    try {
        const { id } = req.params;
        const report = await Report.findById(id).populate({
            path: "worker",
            populate: { path: "user", select: "name" }
        });

        if (!report) {
            return res.status(404).json({ success: false, message: "Report not found" });
        }
        if (report.status !== "pending_review") {
            return res.status(400).json({ success: false, message: "Only pending_review reports can be confirmed" });
        }

        const customerUser = await User.findById(report.reporter);
        if (customerUser) {
            const deduction = CUSTOMER_DEDUCTIONS[report.category] ?? 5;
            customerUser.trustScore = Math.max(0, customerUser.trustScore - deduction);
            await customerUser.save();
        }

        report.status = "resolved";
        report.requiresAdminReview = false;
        await report.save();

        return res.status(200).json({ success: true, message: "Report confirmed — trust score deducted", report });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const dismissReport = async (req, res) => {
    try {
        const { id } = req.params;
        const report = await Report.findById(id);

        if (!report) {
            return res.status(404).json({ success: false, message: "Report not found" });
        }
        if (!["pending_review", "open"].includes(report.status)) {
            return res.status(400).json({ success: false, message: "Report is already resolved" });
        }

        report.status = "resolved";
        await report.save();

        return res.status(200).json({ success: true, message: "Report dismissed — no score deduction applied", report });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const getReports = async (req, res) => {
    try {
        let query = { status: "open" };

        if (req.user.role === "shopkeeper") {
            const shopkeeper = await Shopkeeper.findOne({ user: req.user.id });
            if (!shopkeeper) {
                return res.status(404).json({ success: false, message: "Shopkeeper not found" });
            }
            query.shopkeeper = shopkeeper._id;
        } else if (req.user.role !== "admin") {
            return res.status(403).json({ success: false, message: "Access denied" });
        }

        const reports = await Report.find(query)
            .populate("reporter", "name phone")
            .populate({
                path: "worker",
                populate: { path: "user", select: "name phone" }
            })
            .populate("booking", "category")
            .sort({ createdAt: -1 });

        return res.status(200).json({ success: true, reports });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const getPendingReviewReports = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const [reports, total] = await Promise.all([
            Report.find({ status: "pending_review" })
                .populate("reporter", "name phone createdAt")
                .populate({
                    path: "worker",
                    populate: { path: "user", select: "name phone" }
                })
                .populate("booking", "category status createdAt")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Report.countDocuments({ status: "pending_review" }),
        ]);

        return res.status(200).json({ success: true, total, page, pages: Math.ceil(total / limit), reports });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const resolveReport = async (req, res) => {
    try {
        const { id } = req.params;
        const report = await Report.findByIdAndUpdate(id, { status: "resolved" }, { new: true });

        if (!report) {
            return res.status(404).json({ success: false, message: "Report not found" });
        }

        return res.status(200).json({ success: true, message: "Report resolved", report });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createReport,
    createCustomerReport,
    getReports,
    resolveReport,
    getPendingReviewReports,
    confirmReport,
    dismissReport,
};
