const mongoose = require("mongoose");

const bookingOtpSchema = new mongoose.Schema(
    {
        booking: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Booking",
            required: true,
        },
        type: {
            type: String,
            enum: ["arrival", "completion"],
            required: true,
        },
        otp: {
            type: String,
            required: true,
        },
        verified: {
            type: Boolean,
            default: false,
        },
        expiresAt: {
            type: Date,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);


bookingOtpSchema.index({ booking: 1, type: 1 }, { unique: true });

module.exports = mongoose.model("BookingOtp", bookingOtpSchema);
