const express = require("express");
const {
    createWorker,
    getMyWorkers,
    getWorkerById,
    updateWorker,
    verifyWorker,
    deleteWorker,
    getNearbyWorkers,
    toggleAvailability,
    getWorkerEarnings,
    getPendingFees,
    payPlatformFee,
    getProfile,
    searchWorkerByPhone,
    requestVerification,
    removeWorker,
    acceptVerification,
    rejectVerification,
    heartbeat,
    getMyReviews,
    updateAutoOfflineTimeout
} = require("../controllers/workerController");
const { protect } = require("../middleware/authMiddleware");
const authorize = require("../middleware/authorize");

const router = express.Router();

router.get(
    "/me",
    protect,
    authorize("worker"),
    getProfile
);

router.get(
    "/me/reviews",
    protect,
    authorize("worker"),
    getMyReviews
);

router.patch(
    "/me/timeout",
    protect,
    authorize("worker"),
    updateAutoOfflineTimeout
);

router.get(
    "/earnings",
    protect,
    authorize("worker"),
    getWorkerEarnings
);

router.get(
    "/pending-fees",
    protect,
    authorize("worker"),
    getPendingFees
);

router.post(
    "/pay-fees",
    protect,
    authorize("worker"),
    payPlatformFee
);

router.patch(
    "/availability",
    protect,
    authorize("worker"),
    toggleAvailability
);

router.patch(
    "/heartbeat",
    protect,
    authorize("worker"),
    heartbeat
);

router.post(
    "/",
    protect,
    authorize("shopkeeper"),
    createWorker
);

router.get(
    "/my-workers",
    protect,
    authorize("shopkeeper"),
    getMyWorkers
);

router.get(
    "/nearby",
    protect,
    authorize("user"),
    getNearbyWorkers
);

router.get(
    "/search",
    protect,
    authorize("shopkeeper"),
    searchWorkerByPhone
);

router.post(
    "/:id/request-verification",
    protect,
    authorize("shopkeeper"),
    requestVerification
);

router.delete(
    "/:id/remove",
    protect,
    authorize("shopkeeper"),
    removeWorker
);

router.post(
    "/requests/accept",
    protect,
    authorize("worker"),
    acceptVerification
);

router.post(
    "/requests/reject",
    protect,
    authorize("worker"),
    rejectVerification
);

router.get(
    "/:id",
    protect,
    authorize("admin", "shopkeeper"),
    getWorkerById
);

router.put(
    "/:id",
    protect,
    authorize("shopkeeper"),
    updateWorker
);

router.patch(
    "/:id/verify",
    protect,
    authorize("admin", "shopkeeper"),
    verifyWorker
);

router.delete(
    "/:id",
    protect,
    authorize("shopkeeper"),
    deleteWorker
);

module.exports = router;