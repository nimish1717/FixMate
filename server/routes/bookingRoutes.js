const express = require("express");
const {
    createBooking,
    acceptBooking,
    quotePrice,
    requestSpareParts,
    respondToSpareParts,
    payForBooking,
    verifyArrivalOtp,
    uploadBeforePhoto,
    uploadAfterPhotoAndVerify,
    verifyCompletionOtp,
    getUserOtps,
    workerConfirmsCash,
    cancelBooking,
    markWorkerAtGate,
    getBookingById,
    getMyBookings,
    getBookingMessages,
    getWorkerBookings,
    getActiveBooking,
    confirmPrice
} = require("../controllers/bookingController");

const { protect } = require("../middleware/authMiddleware");
const authorize = require("../middleware/authorize");
const upload = require("../middleware/upload");

const router = express.Router();

router.get(
    "/active",
    protect,
    authorize("user", "worker"),
    getActiveBooking
);

router.post(
    "/create",
    protect,

    authorize("user"),
    upload.single("issueImage"),
    createBooking
);

router.patch(
    "/:id/accept",
    protect,
    authorize("worker"),
    acceptBooking
);

router.patch(
    "/:id/quote-price",
    protect,
    authorize("worker"),
    quotePrice
);

router.patch(
    "/:id/pay",
    protect,
    authorize("user"),
    payForBooking
);

router.patch(
    "/:id/verify-arrival-otp",
    protect,
    authorize("worker"),
    verifyArrivalOtp
);

router.patch(
    "/:id/confirm-price",
    protect,
    authorize("worker"),
    confirmPrice
);

router.patch(
    "/:id/before-photo",
    protect,
    authorize("worker"),
    upload.single("image"),
    uploadBeforePhoto
);

router.patch(
    "/:id/after-photo",
    protect,
    authorize("worker"),
    upload.single("image"),
    uploadAfterPhotoAndVerify
);

router.patch(
    "/:id/verify-completion-otp",
    protect,
    authorize("worker"),
    verifyCompletionOtp
);

router.get(
    "/my",
    protect,
    authorize("user"),
    getMyBookings
);

router.get(
    "/worker",
    protect,
    authorize("worker"),
    getWorkerBookings
);

router.get(
    "/:id",
    protect,
    getBookingById
);

router.get(
    "/:id/otps",
    protect,
    authorize("user"),
    getUserOtps
);

router.get(
    "/:id/messages",
    protect,
    getBookingMessages
);

router.patch(
    "/:id/confirm-cash",
    protect,
    authorize("worker"),
    workerConfirmsCash
);

router.patch(
    "/:id/cancel",
    protect,
    cancelBooking
);

// Phase 1: Two-Stage Invoicing — Spare Parts Approval
router.patch(
    "/:id/request-spare-parts",
    protect,
    authorize("worker"),
    requestSpareParts
);

router.patch(
    "/:id/respond-spare-parts",
    protect,
    authorize("user"),
    respondToSpareParts
);

// Phase 4: Geofenced gate arrival
router.patch(
    "/:id/mark-at-gate",
    protect,
    authorize("worker"),
    markWorkerAtGate
);



module.exports = router;