const express = require('express');
const rateLimit = require('express-rate-limit');

const {
    sendOtp,
    verifyOtp,
    adminLogin,
    register,
    getMe
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/me", protect, getMe);

// Rate limiter for OTP requests: max 3 per 10 minutes per phone number
const otpLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 3, 
    message: { success: false, message: "Too many OTP requests. Please try again after 10 minutes." },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        // Key by phone number if provided, fallback to IP (prefixed to avoid IPv6 validation crash in express-rate-limit v7+)
        return req.body.phone ? String(req.body.phone) : `anon_${req.ip}`;
    }
});

router.post("/send-otp", otpLimiter, sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/register", register);

router.post("/admin/login", adminLogin);

module.exports = router;