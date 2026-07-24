const express = require("express");
const rateLimit = require("express-rate-limit");
const { protect } = require("../middleware/authMiddleware");
const authorize = require("../middleware/authorize");
const {
    createReport,
    createCustomerReport,
    getReports,
    resolveReport,
    getPendingReviewReports,
    confirmReport,
    dismissReport,
} = require("../controllers/reportController");

const router = express.Router();

// Phase 6: Rate limiter — 5 reports per hour per IP to prevent bulk sabotage attempts
const reportRateLimit = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many reports submitted. Please wait before submitting again." },
});

// Customer reports a Worker
router.post(
    "/",
    protect,
    authorize("user"),
    reportRateLimit,
    createReport
);

// Worker reports a Customer
router.post(
    "/customer",
    protect,
    authorize("worker"),
    reportRateLimit,
    createCustomerReport
);

// Get open reports (admin / shopkeeper)
router.get(
    "/",
    protect,
    authorize("admin", "shopkeeper"),
    getReports
);

// Phase 6: Admin — list reports pending review (suspected sabotage)
router.get(
    "/pending-review",
    protect,
    authorize("admin"),
    getPendingReviewReports
);

// Phase 6: Admin — confirm report (apply held trust score deduction)
router.patch(
    "/:id/confirm",
    protect,
    authorize("admin"),
    confirmReport
);

// Phase 6: Admin — dismiss report (clear without any score change)
router.patch(
    "/:id/dismiss",
    protect,
    authorize("admin"),
    dismissReport
);

router.patch(
    "/:id/resolve",
    protect,
    authorize("admin"),
    resolveReport
);

module.exports = router;
