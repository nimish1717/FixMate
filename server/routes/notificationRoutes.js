const express = require("express");
const router = express.Router();
const { getNotifications, markAsRead, markAllAsRead } = require("../controllers/notificationController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect); // Ensure user/worker is authenticated

router.route("/")
    .get(getNotifications);

router.route("/mark-all-read")
    .patch(markAllAsRead);

router.route("/:id/read")
    .patch(markAsRead);

module.exports = router;
