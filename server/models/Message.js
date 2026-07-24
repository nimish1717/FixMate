const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Booking",
        required: false,
    },
    inquiryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ShopInquiry",
        required: false,
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    text: {
        type: String,
        required: true,
    },
}, { timestamps: true });

// Index for quickly grabbing all messages for a specific booking or inquiry
messageSchema.index({ bookingId: 1, createdAt: 1 });
messageSchema.index({ inquiryId: 1, createdAt: 1 });

module.exports = mongoose.model("Message", messageSchema);
