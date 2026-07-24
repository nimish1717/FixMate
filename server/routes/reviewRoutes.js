const express = require("express");
const { createReview } = require("../controllers/reviewController");
const { protect } = require("../middleware/authMiddleware");
const authorize = require("../middleware/authorize");

const router = express.Router();

router.post(
    "/:id/review",
    protect,
    authorize("user"),
    createReview
);

module.exports = router;
