const express = require("express");
const { getDashboardData, getManualVerificationAudit } = require("../controllers/adminController");
const { protect } = require("../middleware/authMiddleware");
const authorize = require("../middleware/authorize");

const router = express.Router();

// Get aggregated metrics for the admin dashboard
router.get("/dashboard", protect, authorize("admin"), getDashboardData);

// Phase 2: Audit table for bookings that used the manual verification fallback
router.get("/manual-verification-audit", protect, authorize("admin"), getManualVerificationAudit);

module.exports = router;
