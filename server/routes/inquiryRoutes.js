const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { createOrGetInquiry, getInquiries, getInquiryById, getMessages } = require("../controllers/inquiryController");

const router = express.Router();

router.post("/", protect, createOrGetInquiry);
router.get("/", protect, getInquiries);
router.get("/:id", protect, getInquiryById);
router.get("/:id/messages", protect, getMessages);

module.exports = router;
